import "server-only";

import type { SupportedLocale } from "@/lib/config/i18n";

export type AppMessages = Record<string, string>;

const messageLoaders: Record<
  SupportedLocale,
  () => Promise<{ default: AppMessages }>
> = {
  en: () => import("@/messages/en.json"),
  "zh-Hans": () => import("@/messages/zh-Hans.json"),
};

export async function loadMessages(
  locale: SupportedLocale,
): Promise<AppMessages> {
  return (await messageLoaders[locale]()).default;
}
