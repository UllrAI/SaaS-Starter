import { notFound } from "next/navigation";

import type { SupportedLocale } from "@/lib/config/i18n";
import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";

export function resolveRequestConfigLocale({
  localeOverride,
  rootLocale,
}: {
  localeOverride?: string;
  rootLocale?: string;
}): SupportedLocale | undefined {
  if (localeOverride !== undefined) {
    const locale = normalizeLocaleCandidate(localeOverride);
    if (!locale) {
      notFound();
    }
    return locale;
  }

  if (rootLocale !== undefined) {
    const locale = normalizeLocaleCandidate(rootLocale);
    if (!locale || locale !== rootLocale) {
      notFound();
    }
    return locale;
  }

  return undefined;
}
