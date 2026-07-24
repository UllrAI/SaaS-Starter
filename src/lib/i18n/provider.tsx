"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

import type { SupportedLocale } from "@/lib/config/i18n";
import type { AppMessages } from "@/lib/i18n/messages";

export function AppIntlProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: SupportedLocale;
  messages: AppMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
