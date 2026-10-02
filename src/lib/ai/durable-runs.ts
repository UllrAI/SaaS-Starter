import { and, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import type { UIMessageChunk } from "ai";
import type { AppDatabase, DatabaseExecutor } from "@/database/client";
import { aiRuns, aiRunEvents, aiMessages, taskRuns } from "@/database/schema";
import { cancelTaskRun } from "@/lib/tasks/repository";
import { withoutImageBytes } from "./finalize";
import { AI_RUN_TIMEOUT_MS } from "./limits";
import type { AiMessage } from "./chat-history-types";
import { ACTIVE_AI_RUN_STATUSES, type AiRunSummary } from "./durable-types";

export function aiRunSummary(run: typeof aiRuns.$inferSelect): AiRunSummary {
  return {
    id: run.id,
    runId: run.id,
    conversationId: run.conversationId,
    assistantMessageId: run.assistantMessageId ?? "",
    status: run.status,
  };
}

export async function getOwnedAiRun(
  db: DatabaseExecutor,
  runId: string,
  userId: string,
) {
  const [run] = await db
    .select()
    .from(aiRuns)
    .where(and(eq(aiRuns.id, runId), eq(aiRuns.userId, userId)));
  return run ?? null;
}

export async function appendAiRunEvents(
  db: AppDatabase,
  runId: string,
  chunks: UIMessageChunk[],
  snapshot?: AiMessage,
) {
  if (!chunks.length) return true;
  return db.transaction(async (tx) => {
    const [run] = await tx
      .update(aiRuns)
      .set({
        lastEventId: sql`${aiRuns.lastEventId} + ${chunks.length}`,
        ...(snapshot ? { response: snapshot } : {}),
      })
      .where(and(eq(aiRuns.id, runId), eq(aiRuns.status, "running")))
      .returning();
    if (!run) return false;
    await tx.insert(aiRunEvents).values(
      chunks.map((chunk, index) => ({
        runId,
        sequence: run.lastEventId - chunks.length + index + 1,
        chunk,
      })),
    );
    return true;
  });
}

export async function readAiRunEvents(
  db: DatabaseExecutor,
  runId: string,
  cursor: number,
) {
  // Finish/error/abort cannot reach a browser before final message and status
  // commit. Keep the whole suffix behind the first terminal chunk contiguous.
  return db
    .select({
      runId: aiRunEvents.runId,
      sequence: aiRunEvents.sequence,
      chunk: aiRunEvents.chunk,
      createdAt: aiRunEvents.createdAt,
    })
    .from(aiRunEvents)
    .innerJoin(aiRuns, eq(aiRuns.id, aiRunEvents.runId))
    .where(
      and(
        eq(aiRunEvents.runId, runId),
        gt(aiRunEvents.sequence, cursor),
        sql`(
      ${aiRuns.status} not in ('queued', 'running') OR ${aiRunEvents.sequence} < coalesce(
        (select min(sequence) from ai_run_events terminal where terminal."runId" = ${runId}
          and terminal.chunk->>'type' in ('finish', 'abort', 'error')), 2147483647)
    )`,
      ),
    )
    .orderBy(aiRunEvents.sequence)
    .limit(100);
}

// The marker is committed before model invocation. A retried invocation with a
// marker is ambiguous and may have incurred charges, so it must never replay.
export async function claimAiRun(db: AppDatabase, runId: string) {
  const [claimed] = await db
    .update(aiRuns)
    .set({
      status: "running",
      providerStartedAt: new Date(),
      expiresAt: new Date(Date.now() + AI_RUN_TIMEOUT_MS + 30_000),
    })
    .where(
      and(
        eq(aiRuns.id, runId),
        eq(aiRuns.status, "queued"),
        isNull(aiRuns.providerStartedAt),
      ),
    )
    .returning();
  return claimed ?? null;
}

async function saveTerminalSnapshot(
  tx: DatabaseExecutor,
  run: typeof aiRuns.$inferSelect,
  status: "interrupted" | "aborted",
) {
  const sequence = run.lastEventId + 1;
  const chunk: UIMessageChunk =
    status === "aborted"
      ? { type: "abort" }
      : { type: "error", errorText: "ai_run_interrupted" };
  await tx.insert(aiRunEvents).values({ runId: run.id, sequence, chunk });
  await tx
    .update(aiRuns)
    .set({ lastEventId: sequence })
    .where(eq(aiRuns.id, run.id));
  if (run.response) {
    const message = withoutImageBytes(run.response as AiMessage);
    await tx
      .insert(aiMessages)
      .values({
        id: message.id,
        conversationId: run.conversationId,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata ?? null,
        runId: run.id,
      })
      .onConflictDoUpdate({
        target: [aiMessages.conversationId, aiMessages.id],
        set: {
          parts: message.parts,
          metadata: message.metadata ?? null,
          runId: run.id,
        },
      });
  }
}

// Old Web replicas can still accept runs after migration but before handoff.
// A null invocation marker proves no call only for a durable task-owned run.
export async function interruptAiRun(db: AppDatabase, runId: string) {
  await db.transaction(async (tx) => {
    const [run] = await tx
      .update(aiRuns)
      .set({
        status: "interrupted",
        totalTokens: sql`case when ${aiRuns.taskRunId} is not null and ${aiRuns.providerStartedAt} is null then 0 else ${aiRuns.totalTokens} end`,
        imageCount: sql`case when ${aiRuns.taskRunId} is not null and ${aiRuns.providerStartedAt} is null then 0 else ${aiRuns.imageCount} end`,
      })
      .where(
        and(
          eq(aiRuns.id, runId),
          inArray(aiRuns.status, [...ACTIVE_AI_RUN_STATUSES]),
        ),
      )
      .returning();
    if (!run) return;
    await saveTerminalSnapshot(tx, run, "interrupted");
    if (run.taskRunId) await cancelTaskRun(tx, run.taskRunId);
  });
}

export async function cancelAiRun(
  db: AppDatabase,
  runId: string,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [run] = await tx
      .update(aiRuns)
      .set({
        status: "aborted",
        cancelRequestedAt: new Date(),
        totalTokens: sql`case when ${aiRuns.taskRunId} is not null and ${aiRuns.providerStartedAt} is null then 0 else ${aiRuns.totalTokens} end`,
        imageCount: sql`case when ${aiRuns.taskRunId} is not null and ${aiRuns.providerStartedAt} is null then 0 else ${aiRuns.imageCount} end`,
      })
      .where(
        and(
          eq(aiRuns.id, runId),
          eq(aiRuns.userId, userId),
          inArray(aiRuns.status, [...ACTIVE_AI_RUN_STATUSES]),
        ),
      )
      .returning();
    if (run) {
      await saveTerminalSnapshot(tx, run, "aborted");
      if (run.taskRunId) await cancelTaskRun(tx, run.taskRunId);
    }
    return run ?? getOwnedAiRun(tx, runId, userId);
  });
}

// Queue exhaustion/crash eventually becomes a visible, manual-retry outcome.
export async function reconcileAiRuns(db: AppDatabase) {
  const runs = await db
    .select({ id: aiRuns.id })
    .from(aiRuns)
    .leftJoin(taskRuns, eq(taskRuns.id, aiRuns.taskRunId))
    .where(
      and(
        inArray(aiRuns.status, [...ACTIVE_AI_RUN_STATUSES]),
        sql`(
      ${taskRuns.status} in ('failed', 'cancelled', 'completed') OR
      (${aiRuns.status} = 'running' AND ${aiRuns.expiresAt} < now())
    )`,
      ),
    )
    .limit(100);
  for (const run of runs) await interruptAiRun(db, run.id);
}
