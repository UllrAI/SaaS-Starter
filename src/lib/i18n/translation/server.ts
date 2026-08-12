import "server-only";

import { createTranslator } from "next-intl";

import type { SupportedLocale } from "@/lib/config/i18n";
import { loadMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function getServerTranslations({
  locale,
}: {
  locale?: SupportedLocale;
} = {}) {
  const resolvedLocale = locale ?? (await getRequestLocale());
  const messages = await loadMessages(resolvedLocale);
  const t = createTranslator({ locale: resolvedLocale, messages });

  return {
    locale: resolvedLocale,
    t,
  };
}
