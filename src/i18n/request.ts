import * as rootParams from "next/root-params";
import { getRequestConfig } from "next-intl/server";

import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";
import { resolveRequestConfigLocale } from "@/lib/i18n/request-locale";

export default getRequestConfig(async ({ locale: localeOverride }) => {
  let locale = resolveRequestConfigLocale({ localeOverride });

  if (!locale) {
    const rootLocale = await rootParams.locale();
    locale = resolveRequestConfigLocale({ rootLocale });
  }

  locale ??= await getRequestLocale();

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "UTC",
  };
});
