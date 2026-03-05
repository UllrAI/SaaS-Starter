const LOCALE_TO_INTL: Record<string, string> = {
  en: "en-US",
  "zh-Hans": "zh-CN",
};

export function resolveIntlLocale(locale?: string | null): string {
  if (!locale) {
    return "en-US";
  }

  return LOCALE_TO_INTL[locale] ?? locale;
}
