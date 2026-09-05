import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/database";
import {
  aiConversations,
  aiRuns,
  aiMessages,
  aiUsageEvents,
} from "@/database/schema";
import { withoutImageBytes } from "./finalize";
import env from "@/env";
import type { AiMessage } from "./chat-history-types";
import type { AiUsageEventInput } from "./usage";
import { AI_RUN_TIMEOUT_MS, AI_RUN_TOKEN_RESERVATION } from "./limits";

export class AiRunConflictError extends Error {}
export class AiBudgetExceededError extends Error {}

export async function beginAiRun(input: {
  userId: string;
  conversationId: string;
  messages: AiMessage[];
  parentMessageId: string | null;
  requestId: string;
}) {
  const requestKey = input.requestId;
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${"ai:" + input.userId}, 0))`,
    );
    const [conversation] = await tx
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, input.conversationId),
          eq(aiConversations.userId, input.userId),
        ),
      );
    if (!conversation)
      throw new AiRunConflictError("Conversation unavailable.");
    await tx
      .update(aiRuns)
      .set({ status: "interrupted" })
      .where(
        and(
          eq(aiRuns.userId, input.userId),
          eq(aiRuns.status, "running"),
          sql`${aiRuns.expiresAt} < now()`,
        ),
      );
    const [previous] = await tx
      .select()
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.conversationId, input.conversationId),
          eq(aiRuns.requestKey, requestKey),
        ),
      );
    if (previous)
      throw new AiRunConflictError(
        "This request was already accepted. Reload the conversation.",
      );
    const [usage] = await tx
      .select({
        tokens: sql<number>`coalesce(sum(coalesce(${aiRuns.totalTokens}, ${aiRuns.reservedTokens})), 0)`,
        images: sql<number>`coalesce(sum(${aiRuns.imageCount}), 0)`,
        active: sql<number>`count(*) filter (where ${aiRuns.status} = 'running')`,
      })
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.userId, input.userId),
          gte(aiRuns.createdAt, sql<Date>`now() - interval '24 hours'`),
        ),
      );
    // One active run per user also serializes approvals and image reservations.
    if (Number(usage.active) > 0)
      throw new AiRunConflictError("Another response is still running.");
    if (
      Number(usage.tokens) + AI_RUN_TOKEN_RESERVATION >
      env.AI_DAILY_TOKEN_LIMIT
    )
      throw new AiBudgetExceededError("Daily AI allowance reached.");
    const [run] = await tx
      .insert(aiRuns)
      .values({
        userId: input.userId,
        conversationId: input.conversationId,
        requestKey,
        reservedTokens: AI_RUN_TOKEN_RESERVATION,
        imageCount: Number(usage.images) < env.AI_DAILY_IMAGE_LIMIT ? 1 : 0,
        expiresAt: new Date(Date.now() + AI_RUN_TIMEOUT_MS + 30_000),
      })
      .returning();
    return {
      run,
      allowImageGeneration: Number(usage.images) < env.AI_DAILY_IMAGE_LIMIT,
    };
  });
}

// Persist the response and accounting together before optional media work.
// The Worker only finalizes optional media; it never re-executes the model.
export async function completeAiRun(
  runId: string,
  response: AiMessage,
  usage: AiUsageEventInput,
) {
  await db.transaction(async (tx) => {
    const [run] = await tx
      .update(aiRuns)
      .set({
        status: "completed",
        response,
        usage: { ...usage },
        totalTokens: usage.totalTokens ?? null,
      })
      .where(and(eq(aiRuns.id, runId), eq(aiRuns.status, "running")))
      .returning();
    if (!run) return;
    const [previous] = await tx
      .select({ parts: aiMessages.parts })
      .from(aiMessages)
      .where(
        and(
          eq(aiMessages.conversationId, run.conversationId),
          eq(aiMessages.id, response.id),
        ),
      );
    const imageCalls = (parts: AiMessage["parts"]) =>
      new Set(
        parts.flatMap((part) =>
          part.type === "tool-generateImage" ? [part.toolCallId] : [],
        ),
      );
    const previousCalls = imageCalls(
      (previous?.parts ?? []) as AiMessage["parts"],
    );
    const newImageCalls = [...imageCalls(response.parts)].filter(
      (id) => !previousCalls.has(id),
    ).length;
    // Count image attempts, including uncertain failures. Continuations can
    // reuse an assistant message ID and must not charge its earlier tools again.
    await tx
      .update(aiRuns)
      .set({
        imageCount:
          usage.totalTokens === undefined
            ? Math.max(run.imageCount, newImageCalls)
            : newImageCalls,
      })
      .where(eq(aiRuns.id, run.id));
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
      .insert(aiUsageEvents)
      .values({
        ...usage,
        runId,
        userId: run.userId,
        conversationId: run.conversationId,
      })
      .onConflictDoNothing({ target: aiUsageEvents.runId });
  });
}

export async function failAiRun(runId: string, providerStarted: boolean) {
  await db
    .update(aiRuns)
    .set({
      status: "failed",
      ...(!providerStarted ? { totalTokens: 0, imageCount: 0 } : {}),
    })
    .where(and(eq(aiRuns.id, runId), eq(aiRuns.status, "running")));
}
