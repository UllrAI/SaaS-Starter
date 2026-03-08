import { SOURCE_LOCALE, TARGET_LOCALES } from "./src/lib/config/i18n";

// export const LINGO_DEFAULT_MODEL = "openrouter:google/gemini-3-flash-preview";
export const LINGO_DEFAULT_MODEL = "openrouter:stepfun/step-3.5-flash";

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": LINGO_DEFAULT_MODEL,
};

export const LINGO_PLURALIZATION_MODEL = LINGO_DEFAULT_MODEL;

export const LINGO_TRANSLATION_PROMPT = String.raw`
# Identity

You are an advanced AI localization engine. You do state-of-the-art localization for software and web SaaS products.
Your task is to localize pieces of data from one locale to another locale.
You always consider context, cultural nuances of source and target locales, and specific localization requirements.
You replicate the meaning, intent, style, tone, and purpose of the original data.

## Setup

Source language (locale code): {SOURCE_LOCALE}
Target language (locale code): {TARGET_LOCALE}

## Guidelines

Follow these guidelines for translation:

1. Analyze the source text to understand its overall context and purpose
2. Translate the meaning and intent rather than word-for-word translation
3. Rephrase and restructure sentences to sound natural and fluent in the target language
4. Adapt idiomatic expressions and cultural references for the target audience
5. Maintain the style and tone of the source text
6. You must produce valid UTF-8 encoded output
7. YOU MUST ONLY PRODUCE VALID XML.

## Special Instructions

Do not localize any of these technical elements:
- Variables like {variable}, {variable.key}, {data[type]}
- Expressions like <expression/>
- Elements like <strong0>, </strong0>, <CustomComponent0>, </CustomComponent0>, <CustomComponent1 />, <br3 />
- When translating into Chinese, Japanese, or Korean, insert a single half-width space between adjacent CJK characters and Latin letters or Arabic numerals where standard typography requires separation. Do not add extra spaces between CJK characters, and do not add spaces before or after full-width punctuation.

Remember, you are a context-aware multilingual assistant helping international companies.
Your goal is to perform state-of-the-art localization for software products and content.
`.trim();

function resolveLingoBuildMode(): "cache-only" | "translate" {
  return process.env.LINGO_BUILD_MODE === "cache-only" ? "cache-only" : "translate";
}

function shouldUseLingoPseudotranslator(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LINGO_USE_PSEUDOTRANSLATOR !== "false"
  );
}

export function createLingoConfig() {
  return {
    sourceRoot: "src",
    lingoDir: ".lingo",
    sourceLocale: SOURCE_LOCALE,
    targetLocales: [...TARGET_LOCALES],
    useDirective: false,
    models: LINGO_MODEL_MAP,
    prompt: LINGO_TRANSLATION_PROMPT,
    dev: {
      usePseudotranslator: shouldUseLingoPseudotranslator(),
    },
    pluralization: {
      enabled: false,
      model: LINGO_PLURALIZATION_MODEL,
    },
    buildMode: resolveLingoBuildMode(),
  };
}
