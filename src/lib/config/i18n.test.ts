import { describe, expect, it } from "@jest/globals";
import {
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
  });

  it("returns configured locale display info for supported locales", () => {
    expect(getLocaleDisplayInfo("en")).toEqual({
      flag: "🇺🇸",
      nativeName: "English",
    });
    expect(getLocaleDisplayInfo("zh-Hans")).toEqual({
      flag: "🇨🇳",
      nativeName: "简体中文",
    });
  });

  it("falls back to generated native names for unknown locales", () => {
    expect(getLocaleDisplayInfo("fr").nativeName.toLowerCase()).toContain("fr");
    expect(getLocaleDisplayInfo("  ").nativeName).toBe("  ");
  });

  it("keeps lingo model configuration aligned", () => {
    expect(LINGO_DEFAULT_MODEL).toBeTruthy();
    expect(LINGO_MODEL_MAP["*:*"]).toBe(LINGO_DEFAULT_MODEL);
    expect(LINGO_PLURALIZATION_MODEL).toBe(LINGO_DEFAULT_MODEL);
  });
});
