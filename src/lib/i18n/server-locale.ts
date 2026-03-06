import "server-only";

import { cache } from "react";
import { getServerLocale } from "@lingo.dev/compiler/virtual/locale/server";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";
import { resolveIntlLocale } from "@/lib/locale";

export const getRequestLocale = cache(async (): Promise<SupportedLocale> => {
  return normalizeLocaleCandidate(await getServerLocale()) ?? SOURCE_LOCALE;
});

export const getRequestIntlLocale = cache(async (): Promise<string> => {
  return resolveIntlLocale(await getRequestLocale());
});
