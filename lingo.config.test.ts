import { describe, expect, it } from "@jest/globals";
import {
  createLingoConfig,
  LINGO_DEFAULT_MODEL,
  LINGO_MODEL_MAP,
  LINGO_PLURALIZATION_MODEL,
  LINGO_TRANSLATION_PROMPT,
} from "./lingo.config";

describe("lingo config", () => {
  it("keeps model configuration aligned", () => {
    expect(LINGO_DEFAULT_MODEL).toBeTruthy();
    expect(LINGO_MODEL_MAP["*:*"]).toBe(LINGO_DEFAULT_MODEL);
    expect(LINGO_PLURALIZATION_MODEL).toBe(LINGO_DEFAULT_MODEL);
  });

  it("includes the custom CJK spacing rule in the translation prompt", () => {
    expect(LINGO_TRANSLATION_PROMPT).toContain(
      "When translating into Chinese, Japanese, or Korean",
    );
    expect(LINGO_TRANSLATION_PROMPT).toContain(
      "insert a single half-width space between adjacent CJK characters and Latin letters or Arabic numerals",
    );
  });

  it("creates lingo compiler config with the custom prompt", () => {
    expect(createLingoConfig()).toMatchObject({
      sourceRoot: "src",
      lingoDir: ".lingo",
      sourceLocale: "en",
      targetLocales: ["zh-Hans"],
      useDirective: false,
      models: LINGO_MODEL_MAP,
      prompt: LINGO_TRANSLATION_PROMPT,
      pluralization: {
        enabled: false,
        model: LINGO_PLURALIZATION_MODEL,
      },
    });
  });
});
