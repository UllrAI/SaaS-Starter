export const LOCALE_CONFIG = {
  en: {
    flag: "🇺🇸",
    label: "English",
  },
  "zh-Hans": {
    flag: "🇨🇳",
    label: "简体中文",
  },
} as const;

export type SupportedLocale = keyof typeof LOCALE_CONFIG;

export const SOURCE_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = Object.keys(
  LOCALE_CONFIG,
) as SupportedLocale[];

export const TARGET_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale !== SOURCE_LOCALE,
);

export type LocaleDisplayInfo = (typeof LOCALE_CONFIG)[SupportedLocale];

export function getLocaleDisplayInfo(locale: string): LocaleDisplayInfo {
  return (
    LOCALE_CONFIG[locale as SupportedLocale] ?? {
      label: locale.toUpperCase(),
    }
  );
}

// export const LINGO_DEFAULT_MODEL = "openai:gpt-5-nano";
export const LINGO_DEFAULT_MODEL = "openrouter:openai/gpt-oss-safeguard-20b";
// export const LINGO_DEFAULT_MODEL = "openrouter:google/gemini-3-flash-preview";

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": LINGO_DEFAULT_MODEL,
};

export const LINGO_PLURALIZATION_MODEL = LINGO_DEFAULT_MODEL;
