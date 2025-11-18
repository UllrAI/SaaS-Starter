export const LOCALE_CONFIG = {
  en: {
    flag: "🇺🇸",
    label: "English",
  },
  "zh-CN": {
    flag: "🇨🇳",
    label: "简体中文",
  },
} as const;

export type SupportedLocale = keyof typeof LOCALE_CONFIG;

export const SOURCE_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIG) as SupportedLocale[];

export const TARGET_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale !== SOURCE_LOCALE
);

export type LocaleDisplayInfo = typeof LOCALE_CONFIG[SupportedLocale];

export function getLocaleDisplayInfo(locale: string): LocaleDisplayInfo {
  return (
    LOCALE_CONFIG[locale as SupportedLocale] ?? {
      label: locale.toUpperCase(),
    }
  );
}

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": "openrouter:z-ai/glm-4.5-air:free",
};