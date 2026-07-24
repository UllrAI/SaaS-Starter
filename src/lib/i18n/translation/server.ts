import "server-only";

import { getTranslations } from "next-intl/server";

import type { SupportedLocale } from "@/lib/config/i18n";
import { createAppTranslate } from "@/lib/i18n/translation/shared";

export async function getServerTranslations({
  locale,
}: {
  locale?: SupportedLocale;
} = {}) {
  const translator = locale
    ? await getTranslations({ locale })
    : await getTranslations();

  return {
    t: createAppTranslate(translator),
  };
}
