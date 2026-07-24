import "server-only";

import type { SupportedLocale } from "@/lib/config/i18n";

export type AppMessages = Record<string, string>;

export const MARKETING_CLIENT_MESSAGE_KEYS = [
  "02cda586643c",
  "054cfb234633",
  "0b075846d479",
  "12b611abe60d",
  "16e1cecef2be",
  "187728ec629b",
  "1a88dd2e4d44",
  "1cc344db3b2b",
  "20cd73fb1bec",
  "278de7e66247",
  "293787595c45",
  "29e8db45989c",
  "312da6104ab4",
  "33911e975b6d",
  "339aaf4ddc46",
  "37f2e9365f7a",
  "3f29f12409bd",
  "42de003b5354",
  "44589d849dec",
  "4695d02fe97f",
  "540b59043028",
  "5e3803d0e6ec",
  "67c5d9896269",
  "74dc0d1e6b74",
  "763354d42ebf",
  "7b9f92682d8a",
  "7e654802f9b7",
  "8f131b81c3a2",
  "92737d402302",
  "9274ad8909ea",
  "95644d062359",
  "992711608c27",
  "a6004ced2373",
  "a6e1af30b960",
  "b1c2f0f90a10",
  "bc0861ad819b",
  "c037e047ac1e",
  "c2c035aeeda0",
  "c8a372da047c",
  "ccea6b5e420c",
  "d5406e61d01d",
  "d5f143a73e5c",
  "d6efefcd2a41",
  "dca05cf29a13",
  "e0ed86da986c",
  "ea6618cd547e",
  "ef377f617c2e",
  "fecf06fdc1d1",
  "payment_status_access_dashboard",
  "payment_status_cancelled_badge",
  "payment_status_cancelled_description",
  "payment_status_cancelled_title",
  "payment_status_check_billing",
  "payment_status_completed_badge",
  "payment_status_contact_support",
  "payment_status_failed_badge",
  "payment_status_failed_description",
  "payment_status_failed_title",
  "payment_status_go_dashboard",
  "payment_status_lifetime_success_description",
  "payment_status_manage_billing",
  "payment_status_processing_badge",
  "payment_status_processing_description",
  "payment_status_processing_title",
  "payment_status_subscription_success_description",
  "payment_status_success_title",
  "payment_status_timeout",
  "payment_status_try_again",
  "payment_status_view_plans",
  "pricing_per_month",
] as const;

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

export async function loadMarketingMessages(
  locale: SupportedLocale,
): Promise<AppMessages> {
  const messages = await loadMessages(locale);

  return Object.fromEntries(
    MARKETING_CLIENT_MESSAGE_KEYS.map((key) => {
      const message = messages[key];
      if (message === undefined) {
        throw new Error(
          `Missing marketing client message "${key}" for ${locale}`,
        );
      }
      return [key, message];
    }),
  );
}
