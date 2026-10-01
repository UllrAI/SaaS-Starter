import type { LanguageModelUsage } from "ai";
import type { AiMessage } from "./chat-history-types";
import type { GptImage1kSize } from "./image-size";
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
  durationMs?: number;
  aborted?: boolean;
  usageComplete?: boolean;
  imageSize?: GptImage1kSize;
  imageAttempts?: number;
  generatedImages?: number;
  estimatedImageOutputCostMicrousd?: number;
  imageCostBasis?: string;
}

/**
 * Rejects anything an integer token column cannot honestly hold. A negative or
 * non-finite count is corrupt rather than zero, and this module treats absent
 * as absent — see `AiUsageTotals` for why 0 is not a safe stand-in.
 */
function toTokenCount(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
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

// Only completed steps report usage on abort. Missing fields remain unknown.
export function createAiUsageCollector() {
  let finished: AiUsageTotals | undefined;
  const steps: AiUsageTotals[] = [];
  return {
    capture(part: {
      type: string;
      usage?: LanguageModelUsage;
      totalUsage?: LanguageModelUsage;
    }) {
      if (part.type === "finish-step")
        steps.push(extractUsageTotals(part.usage));
      if (part.type === "finish")
        finished = extractUsageTotals(part.totalUsage);
    },
    totals(): AiUsageTotals {
      if (finished) return finished;
      const totals = extractUsageTotals(undefined);
      for (const key of Object.keys(totals) as (keyof AiUsageTotals)[]) {
        const counts = steps.map((step) => step[key]);
        if (counts.length > 0 && counts.every((value) => value !== undefined))
          totals[key] = counts.reduce<number>(
            (sum, value) => sum + (value ?? 0),
            0,
          );
      }
      return totals;
    },
    isComplete() {
      return finished !== undefined;
    },
  };
}

export function imageUsageForMessage(
  message: AiMessage,
  size: GptImage1kSize | undefined,
  previousCalls = new Set<string>(),
) {
  const calls = new Map(
    message.parts.flatMap((part) =>
      part.type === "tool-generateImage" && !previousCalls.has(part.toolCallId)
        ? [[part.toolCallId, part] as const]
        : [],
    ),
  );
  const generatedImages = [...calls.values()].filter(
    (part) => part.state === "output-available",
  ).length;
  // Official GPT Image 2 low-quality output estimates, verified 2026-10-01.
  // Excludes input/reference tokens and gateway-specific markups; never a bill.
  const outputMicrousd = size === "1024x1024" ? 6000 : size ? 5000 : undefined;
  return {
    imageAttempts: calls.size,
    generatedImages,
    imageSize: size,
    estimatedImageOutputCostMicrousd:
      outputMicrousd === undefined
        ? undefined
        : outputMicrousd * generatedImages,
    imageCostBasis: size
      ? "gpt-image-2:low:webp:output-only:2026-10-01"
      : undefined,
  };
}
