import { notFound } from "next/navigation";

import {
  SOURCE_LOCALE,
  TARGET_LOCALES,
  type SupportedLocale,
} from "@/lib/config/i18n";
import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";

export type StaticMarketingLocaleParams = {
  locale: SupportedLocale;
};

export function getStaticMarketingLocaleParams(): StaticMarketingLocaleParams[] {
  return TARGET_LOCALES.map((locale) => ({ locale }));
}

export function resolveStaticMarketingLocale(locale: string): SupportedLocale {
  const normalizedLocale = normalizeLocaleCandidate(locale);

  if (
    !normalizedLocale ||
    normalizedLocale === SOURCE_LOCALE ||
    normalizedLocale !== locale
  ) {
    notFound();
  }

  return normalizedLocale;
}

export async function resolveStaticMarketingParams(
  params: Promise<{ locale: string }>,
): Promise<SupportedLocale> {
  const { locale } = await params;
  return resolveStaticMarketingLocale(locale);
}
