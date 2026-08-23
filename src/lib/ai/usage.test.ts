import { describe, expect, it } from "@jest/globals";
import type { LanguageModelUsage } from "ai";
import { extractUsageTotals } from "./usage";

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
