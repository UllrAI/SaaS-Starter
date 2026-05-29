import "server-only";

import type { SupportedLocale } from "@/lib/config/i18n";

export type LingoTranslations = Record<string, string>;

export async function loadLingoTranslations(
  locale: SupportedLocale,
): Promise<LingoTranslations> {
  const { getServerTranslations } =
    await import("@lingo.dev/compiler/react/server");
  const { translations } = await getServerTranslations({ locale });

  return translations;
}
