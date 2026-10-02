import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import { generateId } from "ai";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import {
  aiConversations,
  aiRuns,
  aiMessages,
  aiUsageEvents,
  taskRuns,
  taskDispatches,
} from "@/database/schema";
import { withoutImageBytes, restoreStoredImageOutputs } from "./finalize";
import type { AiMessage } from "./chat-history-types";
import { imageUsageForMessage, type AiUsageEventInput } from "./usage";
import {
  AI_RUN_TIMEOUT_MS,
  AI_RUN_TOKEN_RESERVATION,
  AI_MAX_CONTEXT_BYTES,
} from "./limits";
import { mergeAiTranscript, AiTranscriptConflictError } from "./transcript";
import { AI_GENERATION_JOB, type AiGenerationInput } from "./durable-types";

export class AiRunConflictError extends Error {}
export class AiBudgetExceededError extends Error {}

export async function beginAiRun(
  db: AppDatabase,
  limits: { tokenLimit: number; imageLimit: number },
  input: {
    userId: string;
    conversationId: string;
    messages: AiMessage[];
    parentMessageId: string | null;
    requestId: string;
    retryRunId?: string;
    agentId: string;
    reasoningEffort: AiGenerationInput["reasoningEffort"];
    locale: AiGenerationInput["locale"];
  },
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${"ai:" + input.userId}, 0))`,
    );
    const [conversation] = await tx
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, input.conversationId),
          eq(aiConversations.userId, input.userId),
        ),
      )
      .for("update");
    if (!conversation)
      throw new AiRunConflictError("Conversation unavailable.");
    const [previous] = await tx
      .select()
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.conversationId, input.conversationId),
          eq(aiRuns.requestKey, input.requestId),
        ),
      );
    let request = {
      message:
        input.messages[0]?.role === "user"
          ? { ...input.messages[0], metadata: undefined }
          : input.messages[0],
      parentMessageId: input.parentMessageId,
      agentId: input.agentId,
      reasoningEffort: input.reasoningEffort,
      ...(input.retryRunId ? { retryRunId: input.retryRunId } : {}),
    };
    if (previous) {
      if (
        input.retryRunId
          ? previous.input?.request.retryRunId !== input.retryRunId
          : !isDeepStrictEqual(
              previous.input?.request,
              JSON.parse(JSON.stringify(request)),
            )
      )
        throw new AiRunConflictError(
          "This request ID was already used with different input.",
        );
      return {
        run: previous,
        allowImageGeneration: previous.input?.allowImageGeneration ?? false,
      };
    }
    const [usage] = await tx
      .select({
        tokens: sql<number>`coalesce(sum(coalesce(${aiRuns.totalTokens}, ${aiRuns.reservedTokens})), 0)`,
        images: sql<number>`coalesce(sum(${aiRuns.imageCount}), 0)`,
      })
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.userId, input.userId),
          gte(aiRuns.createdAt, sql<Date>`now() - interval '24 hours'`),
        ),
      );
    const [active] = await tx
      .select({ id: aiRuns.id })
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.userId, input.userId),
          inArray(aiRuns.status, ["queued", "running"]),
        ),
      )
      .limit(1);
    if (active)
      throw new AiRunConflictError("Another response is still running.");
    if (Number(usage.tokens) + AI_RUN_TOKEN_RESERVATION > limits.tokenLimit)
      throw new AiBudgetExceededError("Daily AI allowance reached.");
    const rows = await tx
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversation.id))
      .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
      .limit(81);
    if (!input.retryRunId && rows.length > 80)
      throw new AiTranscriptConflictError(
        "Conversation context is full. Start a new conversation.",
        "ai_context_full",
      );
    const history = rows.reverse().map((row) => ({
      id: row.id,
      role: row.role,
      parts: row.parts as AiMessage["parts"],
      ...(row.metadata ? { metadata: row.metadata } : {}),
    }));
    let source: typeof aiRuns.$inferSelect | undefined;
    let messages: AiMessage[];
    if (input.retryRunId) {
      const [latestRun] = await tx
        .select()
        .from(aiRuns)
        .where(eq(aiRuns.conversationId, conversation.id))
        .orderBy(desc(aiRuns.createdAt), desc(aiRuns.id))
        .limit(1);
      source = latestRun;
      const latestMessage = rows.at(-1);
      if (
        !source ||
        source.id !== input.retryRunId ||
        !source.input ||
        !["completed", "failed", "aborted", "interrupted"].includes(
          source.status,
        ) ||
        !latestMessage ||
        ![source.assistantMessageId, source.input.messages.at(-1)?.id].includes(
          latestMessage.id,
        )
      )
        throw new AiTranscriptConflictError(
          "The conversation changed. Reload it before retrying.",
        );
      messages = source.input.messages;
      request = { ...source.input.request, retryRunId: source.id };
      if (messages.at(-1)?.role === "user") {
        await tx
          .delete(aiMessages)
          .where(
            and(
              eq(aiMessages.conversationId, conversation.id),
              eq(aiMessages.id, source.assistantMessageId!),
            ),
          );
      }
    } else {
      messages = mergeAiTranscript(
        history,
        input.messages,
        input.parentMessageId,
      );
    }
    if (
      Buffer.byteLength(JSON.stringify(messages), "utf8") > AI_MAX_CONTEXT_BYTES
    )
      throw new AiTranscriptConflictError(
        "Conversation context is full. Start a new conversation.",
        "ai_context_full",
      );
    const last = messages.at(-1)!;
    const assistantMessageId =
      source?.assistantMessageId ??
      (last.role === "assistant" ? last.id : generateId());
    const allowImageGeneration = Number(usage.images) < limits.imageLimit;
    const runInput: AiGenerationInput = {
      messages,
      request,
      agentId: source?.input?.agentId ?? input.agentId,
      reasoningEffort: source?.input?.reasoningEffort ?? input.reasoningEffort,
      locale: input.locale,
      allowImageGeneration,
    };
    const taskId = randomUUID();
    const runId = randomUUID();
    const scopeKey = `user:${input.userId}`;
    await tx.insert(taskRuns).values({
      id: taskId,
      kind: AI_GENERATION_JOB,
      scopeKey,
      idempotencyKey: input.requestId,
      input: { runId },
      dispatchId: taskId,
    });
    const [run] = await tx
      .insert(aiRuns)
      .values({
        id: runId,
        userId: input.userId,
        conversationId: input.conversationId,
        requestKey: input.requestId,
        taskRunId: taskId,
        assistantMessageId,
        input: runInput,
        status: "queued",
        reservedTokens: AI_RUN_TOKEN_RESERVATION,
        imageCount: allowImageGeneration ? 1 : 0,
        expiresAt: new Date(Date.now() + AI_RUN_TIMEOUT_MS + 30_000),
      })
      .returning();
    await tx
      .insert(aiMessages)
      .values({
        id: last.id,
        conversationId: conversation.id,
        role: last.role,
        parts: last.parts,
        metadata: last.metadata ?? null,
        ...(last.role === "assistant" ? { runId } : {}),
      })
      .onConflictDoUpdate({
        target: [aiMessages.conversationId, aiMessages.id],
        set: {
          parts: last.parts,
          metadata: last.metadata ?? null,
          ...(last.role === "assistant" ? { runId } : {}),
        },
      });
    const title =
      last.role === "user"
        ? last.parts
            .flatMap((part) =>
              part.type === "text"
                ? [part.text]
                : part.type === "file" && part.filename
                  ? [part.filename]
                  : [],
            )
            .join(" ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80)
        : null;
    await tx
      .update(aiConversations)
      .set({
        updatedAt: sql`now()`,
        ...(title
          ? { title: sql`coalesce(${aiConversations.title}, ${title})` }
          : {}),
      })
      .where(eq(aiConversations.id, conversation.id));
    await tx.insert(taskDispatches).values({
      id: taskId,
      taskRunId: taskId,
      kind: AI_GENERATION_JOB,
      scopeKey,
      payload: { runId },
    });
    return { run, allowImageGeneration };
  });
}

// Persist the response and accounting together before optional media work.
// Optional media and usage insertion retry independently of model execution.
export async function completeAiRun(
  db: AppDatabase,
  runId: string,
  response: AiMessage,
  usage: AiUsageEventInput,
) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.id, runId))
      .for("update");
    const cancelled =
      current?.status === "aborted" &&
      current.cancelRequestedAt !== null &&
      current.usage === null;
    if (!current || (current.status !== "running" && !cancelled)) return;
    if (cancelled) {
      // Retain the snapshot committed by Stop. The late SDK callback may add
      // measured usage, but it cannot publish new output after cancellation.
      usage = { ...usage, aborted: true, usageComplete: false };
      response = (current.response as AiMessage) ?? {
        id: current.assistantMessageId!,
        role: "assistant",
        parts: [],
      };
    }
    const [run] = await tx
      .update(aiRuns)
      .set({
        status: usage.aborted
          ? "aborted"
          : usage.finishReason === "error"
            ? "failed"
            : "completed",
        response: cancelled ? current.response : response,
        usage: { ...usage },
        totalTokens:
          usage.usageComplete === false ? null : (usage.totalTokens ?? null),
        accountingStatus: "pending",
      })
      .where(eq(aiRuns.id, runId))
      .returning();
    if (!run) return;
    const [previous] = await tx
      .select({ parts: aiMessages.parts, runId: aiMessages.runId })
      .from(aiMessages)
      .where(
        and(
          eq(aiMessages.conversationId, run.conversationId),
          eq(aiMessages.id, response.id),
        ),
      );
    if (previous)
      response = restoreStoredImageOutputs(response, {
        id: response.id,
        role: "assistant",
        parts: previous.parts as AiMessage["parts"],
      });
    const imageCalls = (parts: AiMessage["parts"]) =>
      new Set(
        parts.flatMap((part) =>
          part.type === "tool-generateImage" ? [part.toolCallId] : [],
        ),
      );
    const original = current.input?.messages.find(
      (message) => message.id === response.id && message.role === "assistant",
    );
    const previousCalls = imageCalls(original?.parts ?? []);
    const imageUsage = imageUsageForMessage(
      response,
      usage.imageSize,
      previousCalls,
    );
    const newImageCalls = imageUsage.imageAttempts;
    await tx
      .update(aiRuns)
      .set({ usage: { ...usage, ...imageUsage } })
      .where(eq(aiRuns.id, run.id));
    // Count image attempts, including uncertain failures. Continuations can
    // reuse an assistant message ID and must not charge its earlier tools again.
    await tx
      .update(aiRuns)
      .set({
        imageCount:
          usage.usageComplete === false || usage.totalTokens === undefined
            ? Math.max(run.imageCount, newImageCalls)
            : newImageCalls,
      })
      .where(eq(aiRuns.id, run.id));
    if (cancelled) return;
    const pending = withoutImageBytes(response);
    await tx
      .insert(aiMessages)
      .values({
        id: response.id,
        conversationId: run.conversationId,
        role: response.role,
        parts: pending.parts,
        metadata: response.metadata ?? null,
        runId,
      })
      .onConflictDoUpdate({
        target: [aiMessages.conversationId, aiMessages.id],
        set: {
          parts: pending.parts,
          metadata: response.metadata ?? null,
          runId,
        },
      });
    await tx
      .update(aiConversations)
      .set({ updatedAt: sql`now()` })
      .where(eq(aiConversations.id, run.conversationId));
  });
  await recordPendingAiUsage(db, runId);
}

export async function failAiRun(
  db: AppDatabase,
  runId: string,
  providerStarted: boolean,
) {
  await db
    .update(aiRuns)
    .set({
      status: "failed",
      ...(!providerStarted ? { totalTokens: 0, imageCount: 0 } : {}),
    })
    .where(
      and(eq(aiRuns.id, runId), inArray(aiRuns.status, ["queued", "running"])),
    );
}

export async function recordPendingAiUsage(db: AppDatabase, runId: string) {
  try {
    await db.transaction(async (tx) => {
      const [run] = await tx
        .select()
        .from(aiRuns)
        .where(
          and(eq(aiRuns.id, runId), eq(aiRuns.accountingStatus, "pending")),
        );
      if (!run?.usage) return;
      await tx
        .insert(aiUsageEvents)
        .values({
          ...(run.usage as unknown as AiUsageEventInput),
          runId,
          userId: run.userId,
          conversationId: run.conversationId,
        })
        .onConflictDoNothing({ target: aiUsageEvents.runId });
      await tx
        .update(aiRuns)
        .set({ accountingStatus: "recorded" })
        .where(eq(aiRuns.id, run.id));
    });
  } catch {
    console.error(
      JSON.stringify({
        component: "ai-accounting",
        event: "write_failed",
        runId,
      }),
    );
    await db
      .update(aiRuns)
      .set({
        accountingFailures: sql`${aiRuns.accountingFailures} + 1`,
        accountingRetryAt: sql`now() + interval '1 minute'`,
      })
      .where(and(eq(aiRuns.id, runId), eq(aiRuns.accountingStatus, "pending")))
      .catch(() => {
        console.error(
          JSON.stringify({
            component: "ai-accounting",
            event: "failure_counter_unavailable",
            runId,
          }),
        );
      });
  }
}

export async function retryPendingAiUsage(db: AppDatabase) {
  const runs = await db
    .select({ id: aiRuns.id })
    .from(aiRuns)
    .where(
      and(
        eq(aiRuns.accountingStatus, "pending"),
        sql`${aiRuns.accountingRetryAt} <= now()`,
      ),
    )
    .orderBy(aiRuns.accountingRetryAt)
    .limit(20);
  for (const run of runs) await recordPendingAiUsage(db, run.id);
}

export async function reportAiAccountingHealth(db: AppDatabase) {
  const [metrics] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${aiRuns.accountingStatus} = 'pending')`,
      failuresTotal: sql<number>`coalesce(sum(${aiRuns.accountingFailures}), 0)`,
      unreportedLast24Hours: sql<number>`count(*) filter (where ${aiRuns.createdAt} >= now() - interval '24 hours' and ${aiRuns.status} in ('failed', 'interrupted', 'aborted') and ${aiRuns.accountingStatus} = 'unreported' and ${aiRuns.totalTokens} is null)`,
      partialUsageLast24Hours: sql<number>`count(*) filter (where ${aiRuns.createdAt} >= now() - interval '24 hours' and (${aiRuns.usage}->>'usageComplete')::boolean = false)`,
      oldestPendingAgeSeconds: sql<number>`coalesce(extract(epoch from now() - min(${aiRuns.createdAt}) filter (where ${aiRuns.accountingStatus} = 'pending')), 0)`,
    })
    .from(aiRuns);
  console.info(
    JSON.stringify({
      component: "ai-accounting",
      event: "health",
      recentWindowHours: 24,
      ...Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [key, Number(value)]),
      ),
    }),
  );
}
