import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_INTL_LOCALE,
  INTL_LOCALE_BY_SUPPORTED_LOCALE,
  LINGO_DEFAULT_MODEL,
  LINGO_MODEL_MAP,
  LINGO_PLURALIZATION_MODEL,
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  TARGET_LOCALES,
  getLocaleDisplayInfo,
} from "./i18n";

describe("i18n config", () => {
  it("defines source, supported, and target locales consistently", () => {
    expect(SOURCE_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES).toEqual(["en", "zh-Hans"]);
    expect(TARGET_LOCALES).toEqual(["zh-Hans"]);
    expect(INTL_LOCALE_BY_SUPPORTED_LOCALE).toEqual({
      en: DEFAULT_INTL_LOCALE,
      "zh-Hans": "zh-CN",
    });
  });

  it("derives locale display info for supported locales via Intl", () => {
    expect(getLocaleDisplayInfo("en")).toEqual({
      nativeName: new Intl.DisplayNames(["en"], {
        type: "language",
      }).of("en"),
    });
    expect(getLocaleDisplayInfo("zh-Hans")).toEqual({
      nativeName: new Intl.DisplayNames(["zh-Hans"], {
        type: "language",
      }).of("zh-Hans"),
    });
  });

  it("falls back to generated native names for unknown locales", () => {
    expect(getLocaleDisplayInfo("fr")).toEqual({
      nativeName: new Intl.DisplayNames(["fr"], {
        type: "language",
      }).of("fr"),
    });
    expect(getLocaleDisplayInfo("  ").nativeName).toBe("  ");
  });

  it("falls back to uppercase locale tokens for invalid locale identifiers", () => {
    expect(getLocaleDisplayInfo("not_a_locale")).toEqual({
      nativeName: "NOT-A-LOCALE",
    });
  });

  it("keeps lingo model configuration aligned", () => {
    expect(LINGO_DEFAULT_MODEL).toBeTruthy();
    expect(LINGO_MODEL_MAP["*:*"]).toBe(LINGO_DEFAULT_MODEL);
    expect(LINGO_PLURALIZATION_MODEL).toBe(LINGO_DEFAULT_MODEL);
  });
});
