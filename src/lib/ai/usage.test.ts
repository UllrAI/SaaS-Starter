import { describe, expect, it } from "@jest/globals";
import type { LanguageModelUsage } from "ai";
import {
  createAiUsageCollector,
  imageUsageForMessage,
  extractUsageTotals,
} from "./usage";

function usage(overrides: Partial<LanguageModelUsage>): LanguageModelUsage {
  return {
    inputTokens: undefined,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: undefined,
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
    totalTokens: undefined,
    ...overrides,
  } as LanguageModelUsage;
}

describe("extractUsageTotals", () => {
  it("flattens the nested provider shape into persisted columns", () => {
    expect(
      extractUsageTotals(
        usage({
          inputTokens: 100,
          inputTokenDetails: {
            noCacheTokens: 60,
            cacheReadTokens: 30,
            cacheWriteTokens: 10,
          },
          outputTokens: 50,
          outputTokenDetails: { textTokens: 20, reasoningTokens: 30 },
          totalTokens: 150,
        }),
      ),
    ).toEqual({
      inputTokens: 100,
      cacheReadTokens: 30,
      cacheWriteTokens: 10,
      outputTokens: 50,
      reasoningTokens: 30,
      totalTokens: 150,
    });
  });

  it("keeps unreported fields undefined instead of defaulting to zero", () => {
    // A provider that reports no cache tokens is not the same as one that
    // reports zero; collapsing the two would understate cost silently.
    expect(extractUsageTotals(usage({ inputTokens: 7 }))).toEqual({
      inputTokens: 7,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      outputTokens: undefined,
      reasoningTokens: undefined,
      totalTokens: undefined,
    });
  });

  it("returns an all-undefined record when usage is missing entirely", () => {
    expect(extractUsageTotals(undefined)).toEqual({
      inputTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      outputTokens: undefined,
      reasoningTokens: undefined,
      totalTokens: undefined,
    });
  });

  it("drops non-finite counts that an integer column cannot hold", () => {
    expect(
      extractUsageTotals(
        usage({
          inputTokens: Number.NaN,
          outputTokens: Number.POSITIVE_INFINITY,
        }),
      ),
    ).toMatchObject({ inputTokens: undefined, outputTokens: undefined });
  });

  it("normalizes fractional counts and rejects negative ones", () => {
    expect(
      extractUsageTotals(usage({ inputTokens: 10.6, outputTokens: -5 })),
    ).toMatchObject({ inputTokens: 11, outputTokens: undefined });
  });
});

describe("incremental accounting", () => {
  it("does not double count step usage when a final total arrives", () => {
    const collector = createAiUsageCollector();
    collector.capture({
      type: "finish-step",
      usage: usage({ inputTokens: 10, outputTokens: 3, totalTokens: 13 }),
    });
    collector.capture({
      type: "finish-step",
      usage: usage({ inputTokens: 20, outputTokens: 4, totalTokens: 24 }),
    });
    expect(collector.totals().totalTokens).toBe(37);
    collector.capture({
      type: "finish",
      totalUsage: usage({ totalTokens: 37 }),
    });
    expect(collector.totals().totalTokens).toBe(37);
    expect(collector.isComplete()).toBe(true);
  });
  it("keeps a partially unreported field unknown", () => {
    const collector = createAiUsageCollector();
    collector.capture({
      type: "finish-step",
      usage: usage({ totalTokens: 13, inputTokens: 10 }),
    });
    collector.capture({
      type: "finish-step",
      usage: usage({ inputTokens: 20 }),
    });
    expect(collector.totals()).toMatchObject({
      inputTokens: 30,
      totalTokens: undefined,
    });
    expect(collector.isComplete()).toBe(false);
  });
  it("counts new image attempts and estimates successful output independently from language tokens", () => {
    const message = {
      id: "assistant",
      role: "assistant" as const,
      parts: [
        {
          type: "tool-generateImage" as const,
          state: "output-available" as const,
          toolCallId: "old",
          input: {},
          output: { url: "/api/files/content?key=old" },
        },
        {
          type: "tool-generateImage" as const,
          state: "output-available" as const,
          toolCallId: "new",
          input: {},
          output: { result: "base64" },
        },
        {
          type: "tool-generateImage" as const,
          state: "output-error" as const,
          toolCallId: "failed",
          input: {},
          errorText: "Failed",
        },
      ],
    };
    expect(
      imageUsageForMessage(message, "1536x1024", new Set(["old"])),
    ).toMatchObject({
      imageAttempts: 2,
      generatedImages: 1,
      estimatedImageOutputCostMicrousd: 5000,
    });
    expect(
      imageUsageForMessage(message, undefined).estimatedImageOutputCostMicrousd,
    ).toBeUndefined();
  });
});
