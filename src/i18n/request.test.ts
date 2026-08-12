import { describe, expect, it } from "@jest/globals";

import { resolveRequestConfigLocale } from "@/lib/i18n/request-locale";

describe("request config locale resolution", () => {
  it("prefers and normalizes an explicit locale override", () => {
    expect(resolveRequestConfigLocale({ localeOverride: "zh-CN" })).toBe(
      "zh-Hans",
    );
  });

  it("accepts canonical root locales", () => {
    expect(resolveRequestConfigLocale({ rootLocale: "zh-Hans" })).toBe(
      "zh-Hans",
    );
  });

  it("returns undefined when neither locale source is available", () => {
    expect(resolveRequestConfigLocale({})).toBeUndefined();
  });

  it.each(["fr", "zh", "zh-CN"])(
    "rejects unsupported or non-canonical root locale %s",
    (rootLocale) => {
      expect(() => resolveRequestConfigLocale({ rootLocale })).toThrow(
        "NEXT_HTTP_ERROR_FALLBACK;404",
      );
    },
  );

  it("rejects an unsupported explicit locale", () => {
    expect(() => resolveRequestConfigLocale({ localeOverride: "fr" })).toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );
  });
});
