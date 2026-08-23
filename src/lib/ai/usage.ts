import "server-only";

import type { LanguageModelUsage } from "ai";
import { db } from "@/database";
import { aiUsageEvents } from "@/database/schema";
import type { ReasoningEffort } from "./reasoning";

/**
 * Stand-in for `model` when the provider omits `response.modelId`. A sentinel
 * keeps the column NOT NULL and makes unattributable spend visible in
 * aggregates instead of hiding it behind an empty string.
 */
export const AI_MODEL_UNREPORTED = "unreported";

/**
 * Token counts for one assistant turn. Every field is optional because the
 * SDK types each of them as `number | undefined`: a provider may report only
 * a subset. Absent stays absent all the way to the database — see the note on
 * `aiUsageEvents` for why 0 is not an acceptable stand-in.
 */
export interface AiUsageTotals {
  inputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export interface AiUsageEventInput extends AiUsageTotals {
  userId: string;
  conversationId: string;
  messageId: string;
  agentId: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  finishReason?: string;
  aborted: boolean;
  durationMs?: number;
}

/** Keeps a non-finite value (NaN, Infinity) from reaching an integer column. */
function toTokenCount(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : undefined;
}

/** Flattens the SDK's nested usage shape into the columns we persist. */
export function extractUsageTotals(
  usage: LanguageModelUsage | undefined,
): AiUsageTotals {
  return {
    inputTokens: toTokenCount(usage?.inputTokens),
    cacheReadTokens: toTokenCount(usage?.inputTokenDetails?.cacheReadTokens),
    cacheWriteTokens: toTokenCount(usage?.inputTokenDetails?.cacheWriteTokens),
    outputTokens: toTokenCount(usage?.outputTokens),
    reasoningTokens: toTokenCount(usage?.outputTokenDetails?.reasoningTokens),
    totalTokens: toTokenCount(usage?.totalTokens),
  };
}

export async function recordAiUsageEvent(
  event: AiUsageEventInput,
): Promise<void> {
  await db.insert(aiUsageEvents).values({
    userId: event.userId,
    conversationId: event.conversationId,
    messageId: event.messageId,
    agentId: event.agentId,
    model: event.model,
    reasoningEffort: event.reasoningEffort,
    inputTokens: event.inputTokens,
    cacheReadTokens: event.cacheReadTokens,
    cacheWriteTokens: event.cacheWriteTokens,
    outputTokens: event.outputTokens,
    reasoningTokens: event.reasoningTokens,
    totalTokens: event.totalTokens,
    finishReason: event.finishReason,
    aborted: event.aborted,
    durationMs: event.durationMs,
  });
}
