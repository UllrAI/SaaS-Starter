import { getRequestConfig } from "next-intl/server";

import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";
import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";

export default getRequestConfig(async ({ locale: localeOverride }) => {
  const locale =
    normalizeLocaleCandidate(localeOverride) ?? (await getRequestLocale());

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "UTC",
  };
});
