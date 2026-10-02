import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import { claimAiRun, reconcileAiRuns } from "@/lib/ai/durable-runs";
import { finalizePendingAiRuns } from "@/lib/ai/finalize";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { createDatabaseClient } from "@/database/client";
import {
  aiConversations,
  aiMessages,
  aiRuns,
  aiUsageEvents,
  users,
  taskRuns,
} from "@/database/schema";
import {
  beginAiRun,
  completeAiRun,
  failAiRun,
  recordPendingAiUsage,
} from "@/lib/ai/run-repository";

const database = createDatabaseClient({
  url: process.env.DATABASE_URL!,
  max: 5,
});
const userId = `ai-runs-${randomUUID()}`;
const limits = { tokenLimit: 2_000_000, imageLimit: 10 };
let conversationId: string;
const accept = async () => {
  const [last] = await database.db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
    .limit(1);
  const accepted = await beginAiRun(database.db, limits, {
    userId,
    conversationId,
    messages: [
      {
        id: randomUUID(),
        role: "user",
        parts: [{ type: "text", text: "hello" }],
      },
    ],
    parentMessageId: last?.id ?? null,
    agentId: "assistant",
    reasoningEffort: "low",
    locale: "en",
    requestId: randomUUID(),
  });
  await claimAiRun(database.db, accepted.run.id);
  return accepted;
};
beforeAll(async () => {
  await database.db.insert(users).values({
    id: userId,
    name: "AI Run Test",
    emailVerified: true,
    email: `${userId}@example.invalid`,
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
  if (!conversationId) return;
  await database.db
    .delete(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId));
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

describe("durable AI admission and accounting", () => {
  it("admits only one simultaneous request and expired ownership cannot clear its successor", async () => {
    const results = await Promise.allSettled([accept(), accept()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const old = results.find((r) => r.status === "fulfilled");
    if (old?.status !== "fulfilled") throw new Error("No accepted run");
    await database.db
      .update(aiRuns)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(aiRuns.id, old.value.run.id));
    await reconcileAiRuns(database.db);
    const next = await accept();
    await failAiRun(database.db, old.value.run.id, true);
    await completeAiRun(
      database.db,
      old.value.run.id,
      { id: "stale", role: "assistant", parts: [] },
      {
        userId,
        conversationId,
        messageId: "stale",
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
      },
    );
    const [active] = await database.db
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.id, next.run.id));
    expect(active.status).toBe("running");
    expect(
      await database.db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.id, "stale")),
    ).toHaveLength(0);
  });

  it("preserves partial token usage, unknown remaining spend, and independent image cost on abort", async () => {
    const { run } = await accept();
    await completeAiRun(
      database.db,
      run.id,
      {
        id: "aborted",
        role: "assistant",
        parts: [
          { type: "text", text: "Partial" },
          {
            type: "tool-generateImage",
            state: "output-available",
            toolCallId: "image-1",
            input: {},
            output: { result: "aW1hZ2U=" },
          },
        ],
      },
      {
        userId,
        conversationId,
        messageId: "aborted",
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
        aborted: true,
        usageComplete: false,
        totalTokens: 14,
        imageSize: "1024x1024",
      },
    );
    const [stored] = await database.db
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.id, run.id));
    const [usage] = await database.db
      .select()
      .from(aiUsageEvents)
      .where(eq(aiUsageEvents.runId, run.id));
    expect(stored.status).toBe("aborted");
    expect(stored.totalTokens).toBeNull();
    expect(usage).toMatchObject({
      aborted: true,
      usageComplete: false,
      totalTokens: 14,
      imageAttempts: 1,
      generatedImages: 1,
      estimatedImageOutputCostMicrousd: 6000,
    });
    await failAiRun(database.db, run.id, true);
    expect(
      (await database.db.select().from(aiRuns).where(eq(aiRuns.id, run.id)))[0]
        .status,
    ).toBe("aborted");
  });

  it("does not let failed runs without output starve partial/completed media finalization", async () => {
    for (let index = 0; index < 21; index++) {
      const { run } = await accept();
      await failAiRun(database.db, run.id, false);
    }
    const { run } = await accept();
    await completeAiRun(
      database.db,
      run.id,
      {
        id: "finalize-after-failures",
        role: "assistant",
        parts: [{ type: "text", text: "Saved" }],
      },
      {
        userId,
        conversationId,
        messageId: "finalize-after-failures",
        agentId: "assistant",
        model: "test",
        reasoningEffort: "low",
        totalTokens: 12,
      },
    );
    await finalizePendingAiRuns(database.db, async () => {
      throw new Error("No media expected");
    });
    expect(
      (await database.db.select().from(aiRuns).where(eq(aiRuns.id, run.id)))[0]
        .finalizedAt,
    ).not.toBeNull();
  });

  it("keeps the answer when usage insertion fails, counts failure, and retries exactly once", async () => {
    const { run } = await accept();
    const suffix = randomUUID().replaceAll("-", "");
    const functionName = `test_accounting_${suffix}`;
    await database.sql.unsafe(
      `CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."runId" = '${run.id}'::uuid THEN RAISE EXCEPTION 'Simulated accounting outage'; END IF; RETURN NEW; END $$`,
    );
    await database.sql.unsafe(
      `CREATE TRIGGER ${functionName} BEFORE INSERT ON ai_usage_events FOR EACH ROW EXECUTE FUNCTION ${functionName}()`,
    );
    try {
      await completeAiRun(
        database.db,
        run.id,
        {
          id: "answer",
          role: "assistant",
          parts: [{ type: "text", text: "Saved despite accounting outage" }],
        },
        {
          userId,
          conversationId,
          messageId: "answer",
          agentId: "assistant",
          model: "test",
          reasoningEffort: "low",
          totalTokens: 12,
          imageSize: "1536x1024",
        },
      );
      const [stored] = await database.db
        .select()
        .from(aiRuns)
        .where(eq(aiRuns.id, run.id));
      expect(stored).toMatchObject({
        status: "completed",
        accountingStatus: "pending",
        accountingFailures: 1,
      });
      expect(
        await database.db
          .select()
          .from(aiMessages)
          .where(
            and(
              eq(aiMessages.conversationId, conversationId),
              eq(aiMessages.id, "answer"),
            ),
          ),
      ).toHaveLength(1);
    } finally {
      await database.sql.unsafe(
        `DROP TRIGGER ${functionName} ON ai_usage_events`,
      );
      await database.sql.unsafe(`DROP FUNCTION ${functionName}()`);
    }
    await Promise.all([
      recordPendingAiUsage(database.db, run.id),
      recordPendingAiUsage(database.db, run.id),
    ]);
    expect(
      await database.db
        .select()
        .from(aiUsageEvents)
        .where(eq(aiUsageEvents.runId, run.id)),
    ).toHaveLength(1);
    expect(
      (await database.db.select().from(aiRuns).where(eq(aiRuns.id, run.id)))[0]
        .accountingStatus,
    ).toBe("recorded");
  });
});
