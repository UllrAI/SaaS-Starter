import "server-only";

import { getTranslations } from "next-intl/server";

import type { SupportedLocale } from "@/lib/config/i18n";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { createAppTranslate } from "@/lib/i18n/translation/shared";

export async function getServerTranslations({
  locale,
}: {
  locale?: SupportedLocale;
} = {}) {
  const resolvedLocale = locale ?? (await getRequestLocale());
  const translator = await getTranslations({ locale: resolvedLocale });

  return {
    locale: resolvedLocale,
    t: createAppTranslate(translator),
  };
}
