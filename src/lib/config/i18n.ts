export const SOURCE_LOCALE = "en";
export const TARGET_LOCALES = ["zh-CN"] as const;

export const SUPPORTED_LOCALES = [SOURCE_LOCALE, ...TARGET_LOCALES] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": "openrouter:z-ai/glm-4.5-air:free",
};
