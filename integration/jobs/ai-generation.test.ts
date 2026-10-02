import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { ToolLoopAgent, tool, isStepCount, type UIMessageChunk } from "ai";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { finalizePendingAiRuns, finalizeAiRun } from "@/lib/ai/finalize";
import { createDatabaseClient } from "@/database/client";
import {
  aiConversations,
  aiMessages,
  aiRuns,
  aiRunEvents,
  taskRuns,
  taskDispatches,
  users,
} from "@/database/schema";
import { beginAiRun, completeAiRun } from "@/lib/ai/run-repository";
import {
  appendAiRunEvents,
  interruptAiRun,
  reconcileAiRuns,
  cancelAiRun,
  claimAiRun,
  getOwnedAiRun,
  readAiRunEvents,
} from "@/lib/ai/durable-runs";
import { executeAiGeneration } from "@/lib/ai/generation-worker";
import { createAiRunEventStream } from "@/lib/ai/event-stream";
import type { createWorkerAiRuntime } from "@/lib/ai/runtime.node";
import type { JobHandlerContext } from "@/lib/jobs/definition";

type Runtime = ReturnType<typeof createWorkerAiRuntime>;
const database = createDatabaseClient({
  url: process.env.DATABASE_URL!,
  max: 5,
});
const userId = `ai-generate-${randomUUID()}`;
let conversationId: string;
const input = () => ({
  userId,
  conversationId,
  requestId: randomUUID(),
  parentMessageId: null,
  agentId: "assistant",
  reasoningEffort: "low" as const,
  locale: "en" as const,
  messages: [
    {
      id: randomUUID(),
      role: "user" as const,
      parts: [{ type: "text" as const, text: "hello" }],
    },
  ],
});
const admit = (data: Parameters<typeof beginAiRun>[2] = input()) =>
  beginAiRun(database.db, { tokenLimit: 2_000_000, imageLimit: 10 }, data);
const context = (taskRunId: string): JobHandlerContext => ({
  taskRunId,
  scopeKey: `user:${userId}`,
  attempt: 1,
  providerIdempotencyKey: taskRunId,
  signal: new AbortController().signal,
  isCancelled: async () =>
    (
      await database.db
        .select()
        .from(taskRuns)
        .where(eq(taskRuns.id, taskRunId))
    )[0]?.status === "cancelled",
  updateProgress: async () => true,
  scheduleContinuation: async () => false,
  submitProviderJob: async () => "unused",
});

function runtime(
  model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: null,
        chunkDelayInMs: null,
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "text" },
          { type: "text-delta", id: "text", delta: "Durable answer" },
          { type: "text-end", id: "text" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: {
              inputTokens: {
                total: 2,
                noCache: 2,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: 3, text: 3, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  }),
) {
  return {
    model,
    runtime: {
      createAgent: () => new ToolLoopAgent({ model, tools: {}, maxRetries: 0 }),
      getContext: async () => ({
        userId,
        conversationId,
        locale: "en",
        userName: "Test",
        userEmail: "test@example.invalid",
        userRole: "user",
      }),
      resolveAttachments: async (messages: unknown) => messages,
      createResponseHandle: () => "signed-handle",
      readResponseHandle: () => null,
      storeFile: async () => {
        throw new Error("No media expected");
      },
    } as unknown as Runtime,
  };
}

beforeAll(async () => {
  await database.db.insert(users).values({
    id: userId,
    name: "AI generation test",
    email: `${userId}@example.invalid`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [conversation] = await database.db
    .insert(aiConversations)
    .values({ userId })
    .returning();
  conversationId = conversation.id;
});
afterEach(async () => {
  await database.db
    .delete(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId));
  await database.db.delete(aiRuns).where(eq(aiRuns.userId, userId));
  await database.db
    .delete(taskRuns)
    .where(eq(taskRuns.scopeKey, `user:${userId}`));
});
afterAll(async () => {
  await database.db.delete(users).where(eq(users.id, userId));
  await database.close();
});

describe("durable AI generation against PostgreSQL and real SDK", () => {
  it("accepts message/run/task/outbox atomically and request retry creates no second task", async () => {
    const data = input();
    const accepted = await admit(data);
    const retried = await admit(data);
    await expect(
      admit({
        ...data,
        messages: [
          { ...data.messages[0], parts: [{ type: "text", text: "changed" }] },
        ],
      }),
    ).rejects.toThrow("different input");
    expect(retried.run.id).toBe(accepted.run.id);
    expect(
      await database.db
        .select()
        .from(taskRuns)
        .where(eq(taskRuns.id, accepted.run.taskRunId!)),
    ).toHaveLength(1);
    expect(
      await database.db
        .select()
        .from(taskDispatches)
        .where(eq(taskDispatches.taskRunId, accepted.run.taskRunId!)),
    ).toHaveLength(1);
    const [saved] = await database.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, data.messages[0].id));
    expect(saved.parts).toEqual(data.messages[0].parts);
  });

  it("completion and replay survive a new database client; disconnect never aborts SDK work", async () => {
    const { run } = await admit();
    const harness = runtime();
    const abort = new AbortController();
    const stream = createAiRunEventStream(
      database.db,
      run.id,
      userId,
      0,
      abort.signal,
    );
    const reader = stream.getReader();
    const pending = reader.read();
    abort.abort();
    await pending;
    await reader.cancel();
    await executeAiGeneration(
      database.db,
      harness.runtime,
      run.id,
      context(run.taskRunId!),
    );
    expect(harness.model.doStreamCalls).toHaveLength(1);
    const replacement = createDatabaseClient({
      url: process.env.DATABASE_URL!,
      max: 1,
    });
    try {
      const stored = await getOwnedAiRun(replacement.db, run.id, userId);
      expect(stored?.status).toBe("completed");
      const events = await readAiRunEvents(replacement.db, run.id, 0);
      expect(events[0].chunk).toMatchObject({
        type: "start",
        messageId: run.assistantMessageId,
      });
      expect(events.some((event) => event.chunk.type === "text-delta")).toBe(
        true,
      );
      expect(events.at(-1)?.chunk.type).toBe("finish");
      expect(events.map((event) => event.sequence)).toEqual(
        events.map((_, index) => index + 1),
      );
      const cursor = events[1].sequence;
      expect(
        (await readAiRunEvents(replacement.db, run.id, cursor)).map(
          (event) => event.sequence,
        ),
      ).toEqual(events.slice(2).map((event) => event.sequence));
      expect(
        await getOwnedAiRun(replacement.db, run.id, "another-user"),
      ).toBeNull();
      const replay = await new Response(
        createAiRunEventStream(
          replacement.db,
          run.id,
          userId,
          0,
          new AbortController().signal,
        ),
      ).text();
      expect(replay).toContain("Durable answer");
      expect(replay).toContain("[DONE]");
    } finally {
      await replacement.close();
    }
  });

  it("holds terminal events until final response/status transaction commits", async () => {
    const { run } = await admit();
    await claimAiRun(database.db, run.id);
    const chunks: UIMessageChunk[] = [
      { type: "start", messageId: run.assistantMessageId! },
      { type: "finish", finishReason: "stop" },
    ];
    await appendAiRunEvents(database.db, run.id, chunks);
    expect(
      (await readAiRunEvents(database.db, run.id, 0)).map(
        (event) => event.chunk.type,
      ),
    ).toEqual(["start"]);
    await completeAiRun(
      database.db,
      run.id,
      {
        id: run.assistantMessageId!,
        role: "assistant",
        parts: [{ type: "text", text: "saved" }],
      },
      {
        userId,
        conversationId,
        messageId: run.assistantMessageId!,
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
        totalTokens: 5,
      },
    );
    expect(
      (await readAiRunEvents(database.db, run.id, 0)).at(-1)?.chunk.type,
    ).toBe("finish");
    expect(
      await database.db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.id, run.assistantMessageId!)),
    ).toHaveLength(1);
  });

  it("does not replay a marked paid invocation after Worker restart", async () => {
    const { run } = await admit();
    await claimAiRun(database.db, run.id);
    await appendAiRunEvents(database.db, run.id, [
      { type: "start", messageId: run.assistantMessageId! },
    ]);
    const harness = runtime();
    await expect(
      executeAiGeneration(
        database.db,
        harness.runtime,
        run.id,
        context(run.taskRunId!),
      ),
    ).rejects.toMatchObject({ code: "AI_GENERATION_INTERRUPTED" });
    expect(harness.model.doStreamCalls).toHaveLength(0);
    expect((await getOwnedAiRun(database.db, run.id, userId))?.status).toBe(
      "interrupted",
    );
    expect(
      (await readAiRunEvents(database.db, run.id, 0)).at(-1)?.chunk,
    ).toMatchObject({ type: "error" });
  });

  it("Stop persists partial output and late completion cannot overwrite it or successor", async () => {
    const { run } = await admit();
    await claimAiRun(database.db, run.id);
    const partial = {
      id: run.assistantMessageId!,
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Partial" }],
    };
    await appendAiRunEvents(
      database.db,
      run.id,
      [{ type: "start", messageId: partial.id }],
      partial,
    );
    await cancelAiRun(database.db, run.id, userId);
    const nextData = input();
    const successor = await admit({ ...nextData, parentMessageId: partial.id });
    await completeAiRun(
      database.db,
      run.id,
      { ...partial, parts: [{ type: "text", text: "Late output" }] },
      {
        userId,
        conversationId,
        messageId: partial.id,
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
        totalTokens: 5,
      },
    );
    const [message] = await database.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, partial.id));
    expect(message.parts).toEqual(partial.parts);
    expect(
      (await getOwnedAiRun(database.db, successor.run.id, userId))?.status,
    ).toBe("queued");
    expect(
      (await readAiRunEvents(database.db, run.id, 0)).at(-1)?.chunk.type,
    ).toBe("abort");
  });
  it("retries latest partial/approval snapshots explicitly and rejects stale source runs", async () => {
    const { run } = await admit();
    await claimAiRun(database.db, run.id);
    const partial = {
      id: run.assistantMessageId!,
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "partial" }],
    };
    await appendAiRunEvents(
      database.db,
      run.id,
      [{ type: "start", messageId: partial.id }],
      partial,
    );
    await interruptAiRun(database.db, run.id);
    const data = { ...input(), messages: [], retryRunId: run.id };
    const retried = await admit(data);
    expect(retried.run.assistantMessageId).toBe(run.assistantMessageId);
    expect(retried.run.input?.messages).toEqual(run.input?.messages);
    expect((await admit(data)).run.id).toBe(retried.run.id);
    await executeAiGeneration(
      database.db,
      runtime().runtime,
      retried.run.id,
      context(retried.run.taskRunId!),
    );
    const [message] = await database.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, run.assistantMessageId!));
    expect(message.parts).toContainEqual(
      expect.objectContaining({ type: "text", text: "Durable answer" }),
    );
    await expect(admit({ ...data, requestId: randomUUID() })).rejects.toThrow(
      "changed",
    );
  });

  it("queued delay does not consume execution timeout", async () => {
    const { run } = await admit();
    await database.db
      .update(aiRuns)
      .set({ expiresAt: new Date(0) })
      .where(eq(aiRuns.id, run.id));
    await reconcileAiRuns(database.db);
    expect((await getOwnedAiRun(database.db, run.id, userId))?.status).toBe(
      "queued",
    );
    await executeAiGeneration(
      database.db,
      runtime().runtime,
      run.id,
      context(run.taskRunId!),
    );
    expect((await getOwnedAiRun(database.db, run.id, userId))?.status).toBe(
      "completed",
    );
  });

  it.each(["interrupted", "aborted"])(
    "recovers durable media after %s even without any usage callback",
    async (status) => {
      const { run } = await admit();
      await claimAiRun(database.db, run.id);
      const snapshot = {
        id: run.assistantMessageId!,
        role: "assistant" as const,
        parts: [
          {
            type: "tool-generateImage" as const,
            state: "output-available" as const,
            toolCallId: "image-crash",
            input: {},
            output: { result: "aW1hZ2U=" },
          },
        ],
      };
      await appendAiRunEvents(
        database.db,
        run.id,
        [{ type: "start", messageId: snapshot.id }],
        snapshot,
      );
      if (status === "aborted") await cancelAiRun(database.db, run.id, userId);
      else await interruptAiRun(database.db, run.id);
      await finalizePendingAiRuns(
        database.db,
        async () =>
          ({
            url: "/api/files/content?key=recovered",
            contentType: "image/webp",
          }) as never,
      );
      const [stored] = await database.db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.id, snapshot.id));
      expect(stored.parts).toContainEqual(
        expect.objectContaining({
          output: {
            url: "/api/files/content?key=recovered",
            mediaType: "image/webp",
          },
        }),
      );
      const terminal = await getOwnedAiRun(database.db, run.id, userId);
      expect(terminal?.status).toBe(status);
      expect(terminal?.usage).toBeNull();
      expect(terminal?.totalTokens).toBeNull();
      expect(terminal?.finalizedAt).not.toBeNull();
    },
  );

  it("a stale media finalizer cannot replace an accepted approval continuation", async () => {
    const { run } = await admit();
    await claimAiRun(database.db, run.id);
    const approval = {
      type: "tool-saveDocument" as const,
      state: "approval-requested" as const,
      toolCallId: "write-1",
      input: { content: "notes" },
      approval: { id: "signed" },
    };
    const response = {
      id: run.assistantMessageId!,
      role: "assistant" as const,
      parts: [
        approval,
        {
          type: "tool-generateImage" as const,
          state: "output-available" as const,
          toolCallId: "image-1",
          input: {},
          output: { result: "aW1hZ2U=" },
        },
      ],
    };
    await completeAiRun(database.db, run.id, response, {
      userId,
      conversationId,
      messageId: response.id,
      agentId: "assistant",
      model: "test",
      reasoningEffort: "low",
      totalTokens: 5,
    });
    const [saved] = await database.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, response.id));
    const decided = {
      id: saved.id,
      role: "assistant" as const,
      parts: (saved.parts as typeof response.parts).map((part) =>
        part.type === "tool-saveDocument"
          ? {
              ...part,
              state: "approval-responded" as const,
              approval: { id: "signed", approved: true },
            }
          : part,
      ),
    };
    const next = await admit({
      ...input(),
      parentMessageId: response.id,
      messages: [decided],
    } as Parameters<typeof admit>[0]);
    await finalizeAiRun(
      database.db,
      run.id,
      async () =>
        ({
          url: "/api/files/content?key=earlier",
          contentType: "image/webp",
        }) as never,
    );
    const [current] = await database.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, response.id));
    expect(current.runId).toBe(next.run.id);
    expect(current.parts).toContainEqual(
      expect.objectContaining({
        type: "tool-saveDocument",
        state: "approval-responded",
        approval: { id: "signed", approved: true },
      }),
    );
    expect(current.parts).toContainEqual(
      expect.objectContaining({
        type: "tool-generateImage",
        output: {
          url: "/api/files/content?key=earlier",
          mediaType: "image/webp",
        },
      }),
    );
    await claimAiRun(database.db, next.run.id);
    await completeAiRun(
      database.db,
      next.run.id,
      { id: current.id, role: "assistant", parts: current.parts as never },
      {
        userId,
        conversationId,
        messageId: current.id,
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
        totalTokens: 5,
      },
    );
    const accounted = await getOwnedAiRun(database.db, next.run.id, userId);
    expect(accounted?.imageCount).toBe(0);
    expect(accounted?.usage?.imageAttempts).toBe(0);
  });
  it.each(["cancelled", "failed"])(
    "releases reservations for %s tasks before provider invocation",
    async (state) => {
      const { run } = await admit();
      if (state === "cancelled") await cancelAiRun(database.db, run.id, userId);
      else {
        await database.db
          .update(taskRuns)
          .set({ status: "failed" })
          .where(eq(taskRuns.id, run.taskRunId!));
        await reconcileAiRuns(database.db);
      }
      const stored = await getOwnedAiRun(database.db, run.id, userId);
      expect(stored?.providerStartedAt).toBeNull();
      expect(stored?.totalTokens).toBe(0);
      expect(stored?.imageCount).toBe(0);
    },
  );
  it.each([false, true])(
    "never publishes image bytes in events (storage fails=%s)",
    async (unavailable) => {
      const { run } = await admit();
      const model = new MockLanguageModelV4({
        doStream: async () => ({
          stream: simulateReadableStream({
            initialDelayInMs: null,
            chunkDelayInMs: null,
            chunks: [
              { type: "stream-start", warnings: [] },
              {
                type: "tool-call",
                toolCallId: "image-sdk",
                toolName: "generateImage",
                input: "{}",
              },
              {
                type: "finish",
                finishReason: { unified: "tool-calls", raw: "tool_calls" },
                usage: {
                  inputTokens: {
                    total: 2,
                    noCache: 2,
                    cacheRead: 0,
                    cacheWrite: 0,
                  },
                  outputTokens: { total: 3, text: 3, reasoning: 0 },
                },
              },
            ],
          }),
        }),
      });
      const harness = runtime(model);
      const imageRuntime = {
        ...harness.runtime,
        createAgent: () =>
          new ToolLoopAgent({
            model,
            maxRetries: 0,
            stopWhen: isStepCount(1),
            tools: {
              generateImage: tool({
                inputSchema: z.object({}),
                execute: () => ({ result: "aW1hZ2U=" }),
              }),
            },
          }),
        storeFile: async () => {
          if (unavailable) throw new Error("Simulated R2 outage");
          return {
            url: "/api/files/content?key=image-sdk",
            contentType: "image/webp",
          };
        },
      } as unknown as Runtime;
      await executeAiGeneration(
        database.db,
        imageRuntime,
        run.id,
        context(run.taskRunId!),
      );
      const events = await database.db
        .select()
        .from(aiRunEvents)
        .where(eq(aiRunEvents.runId, run.id));
      expect(JSON.stringify(events)).not.toContain("aW1hZ2U=");
      const result = events.find(
        (event) => event.chunk.type === "tool-output-available",
      )?.chunk;
      expect(result).toMatchObject({
        output: unavailable
          ? { storageStatus: "pending" }
          : { url: "/api/files/content?key=image-sdk" },
      });
      const stored = await getOwnedAiRun(database.db, run.id, userId);
      if (unavailable) {
        expect(stored?.response).not.toBeNull();
        expect(stored?.finalizedAt).toBeNull();
      } else expect(stored?.finalizedAt).not.toBeNull();
    },
  );
  it.each(["interrupt", "cancel", "expiry"])(
    "retains potentially paid reservations for a post-migration legacy Web run on %s",
    async (operation) => {
      // Simulate an old Web replica admitting after 0028's one-time backfill.
      const [legacy] = await database.db
        .insert(aiRuns)
        .values({
          userId,
          conversationId,
          requestKey: randomUUID(),
          reservedTokens: 400_000,
          imageCount: 1,
          expiresAt: new Date(0),
        })
        .returning();
      if (operation === "cancel")
        await cancelAiRun(database.db, legacy.id, userId);
      else if (operation === "expiry") await reconcileAiRuns(database.db);
      else await interruptAiRun(database.db, legacy.id);
      const stored = await getOwnedAiRun(database.db, legacy.id, userId);
      expect(stored?.taskRunId).toBeNull();
      expect(stored?.providerStartedAt).toBeNull();
      expect(stored?.status).toBe(
        operation === "cancel" ? "aborted" : "interrupted",
      );
      expect(stored?.reservedTokens).toBe(400_000);
      expect(stored?.totalTokens).toBeNull();
      expect(stored?.imageCount).toBe(1);
    },
  );
});
