import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { getToolOrDynamicToolName, isToolUIPart } from "ai";
import type { AppDatabase } from "@/database/client";
import { aiMessages, aiRuns } from "@/database/schema";
import { UploadFileDeletedError } from "@/lib/uploads/repository";
import type { createFileStorage } from "@/lib/uploads/store";
import type { AiMessage } from "./chat-history-types";

type StoreFile = ReturnType<typeof createFileStorage>;

export async function persistMessageImages(
  message: AiMessage,
  userId: string,
  storeFile: StoreFile,
): Promise<AiMessage> {
  const stored = structuredClone(message);
  for (const part of stored.parts) {
    if (
      !isToolUIPart(part) ||
      part.state !== "output-available" ||
      getToolOrDynamicToolName(part) !== "generateImage"
    )
      continue;
    const output = part.output as { result?: string };
    if (!output?.result) continue;
    try {
      const file = await storeFile({
        userId,
        identity: `image:${message.id}:${part.toolCallId}`,
        fileName: `ai-${message.id}.webp`,
        contentType: "image/webp",
        body: Buffer.from(output.result, "base64"),
      });
      const rest = { ...output };
      delete rest.result;
      part.output = { ...rest, url: file.url, mediaType: file.contentType };
    } catch (error) {
      if (!(error instanceof UploadFileDeletedError)) throw error;
      part.output = { storageStatus: "deleted" };
    }
  }
  return stored;
}

export function withoutImageBytes(message: AiMessage): AiMessage {
  const pending = structuredClone(message);
  for (const part of pending.parts) {
    if (
      isToolUIPart(part) &&
      part.state === "output-available" &&
      getToolOrDynamicToolName(part) === "generateImage" &&
      part.output &&
      typeof part.output === "object" &&
      "result" in part.output
    ) {
      const output = { ...part.output };
      delete output.result;
      part.output = { ...output, storageStatus: "pending" };
    }
  }
  return pending;
}

export async function finalizeAiRun(
  db: AppDatabase,
  runId: string,
  storeFile: StoreFile,
): Promise<void> {
  const [run] = await db
    .select()
    .from(aiRuns)
    .where(
      and(
        eq(aiRuns.id, runId),
        isNull(aiRuns.finalizedAt),
        eq(aiRuns.status, "completed"),
      ),
    );
  if (!run?.response || !run.usage) return;
  const message = run.response as AiMessage;
  const stored = await persistMessageImages(message, run.userId, storeFile);
  await db.transaction(async (tx) => {
    await tx
      .update(aiMessages)
      .set({ parts: stored.parts })
      .where(
        and(
          eq(aiMessages.conversationId, run.conversationId),
          eq(aiMessages.id, message.id),
          eq(aiMessages.runId, run.id),
        ),
      );
    await tx
      .update(aiRuns)
      .set({ finalizedAt: new Date(), response: null })
      .where(eq(aiRuns.id, run.id));
  });
}

export async function finalizePendingAiRuns(
  db: AppDatabase,
  storeFile: StoreFile,
): Promise<void> {
  const runs = await db
    .select({ id: aiRuns.id })
    .from(aiRuns)
    .where(
      and(
        eq(aiRuns.status, "completed"),
        isNull(aiRuns.finalizedAt),
        lte(aiRuns.finalizationRetryAt, new Date()),
      ),
    )
    .orderBy(aiRuns.finalizationRetryAt)
    .limit(20);
  for (const run of runs) {
    try {
      await finalizeAiRun(db, run.id, storeFile);
    } catch (error) {
      await db
        .update(aiRuns)
        .set({ finalizationRetryAt: sql`now() + interval '1 minute'` })
        .where(eq(aiRuns.id, run.id));
      console.error(
        JSON.stringify({
          component: "ai-finalizer",
          runId: run.id,
          error: error instanceof Error ? error.message : "Finalization failed",
        }),
      );
    }
  }
}
