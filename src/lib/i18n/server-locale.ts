import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { SupportedLocale } from "@/lib/config/i18n";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
  normalizeLocaleCandidate,
  resolvePreferredLocale,
} from "@/lib/config/i18n-routing";
import { resolveIntlLocale } from "@/lib/locale";

export const getRequestLocale = cache(async (): Promise<SupportedLocale> => {
  const headerStore = await headers();
  const headerLocale = normalizeLocaleCandidate(
    headerStore.get(LOCALE_HEADER_NAME),
  );
  if (headerLocale) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  return resolvePreferredLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
});

export const getRequestIntlLocale = cache(async (): Promise<string> => {
  return resolveIntlLocale(await getRequestLocale());
});
