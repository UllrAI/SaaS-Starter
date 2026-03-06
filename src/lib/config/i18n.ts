export const LOCALE_CONFIG = {
  en: {
    flag: "🇺🇸",
    nativeName: "English",
  },
  "zh-Hans": {
    flag: "🇨🇳",
    nativeName: "简体中文",
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

function getLocaleNativeName(locale: string): string {
  const normalized = locale.trim().replace("_", "-");
  if (!normalized) {
    return locale.toUpperCase();
  }

  try {
    const displayNames = new Intl.DisplayNames([normalized], {
      type: "language",
    });
    return displayNames.of(normalized) ?? normalized.toUpperCase();
  } catch {
    return normalized.toUpperCase();
  }
}

export function getLocaleDisplayInfo(locale: string): LocaleDisplayInfo {
  return (
    LOCALE_CONFIG[locale as SupportedLocale] ?? {
      nativeName: getLocaleNativeName(locale),
    }
  );
}

// export const LINGO_DEFAULT_MODEL = "openai:gpt-5-nano";
// export const LINGO_DEFAULT_MODEL = "openrouter:openai/gpt-oss-safeguard-20b";
export const LINGO_DEFAULT_MODEL = "openrouter:google/gemini-3-flash-preview";

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": LINGO_DEFAULT_MODEL,
};

export const LINGO_PLURALIZATION_MODEL = LINGO_DEFAULT_MODEL;
