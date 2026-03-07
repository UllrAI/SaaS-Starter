import {
  DEFAULT_INTL_LOCALE,
  INTL_LOCALE_BY_SUPPORTED_LOCALE,
} from "@/lib/config/i18n";

export function resolveIntlLocale(locale?: string | null): string {
  if (!locale) {
    return DEFAULT_INTL_LOCALE;
  }

  return INTL_LOCALE_BY_SUPPORTED_LOCALE[locale as keyof typeof INTL_LOCALE_BY_SUPPORTED_LOCALE] ?? locale;
}
