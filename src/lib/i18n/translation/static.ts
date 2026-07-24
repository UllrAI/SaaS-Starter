import "server-only";

import { createTranslator } from "next-intl";

import enMessages from "@/messages/en.json";
import zhHansMessages from "@/messages/zh-Hans.json";
import type { SupportedLocale } from "@/lib/config/i18n";
import { createAppTranslate } from "@/lib/i18n/translation/shared";

const messagesByLocale = {
  en: enMessages,
  "zh-Hans": zhHansMessages,
} satisfies Record<SupportedLocale, Record<string, string>>;

export function getStaticTranslations(locale: SupportedLocale) {
  const translator = createTranslator({
    locale,
    messages: messagesByLocale[locale],
  });

  return {
    t: createAppTranslate(translator),
  };
}
