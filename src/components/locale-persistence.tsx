"use client";

import { useEffect } from "react";

import type { SupportedLocale } from "@/lib/config/i18n";
import {
  LOCALE_COOKIE_NAME,
  normalizeLocaleCandidate,
} from "@/lib/config/i18n-routing";
import { persistLocale } from "@/lib/i18n/locale-client";

export function LocalePersistence({ locale }: { locale: SupportedLocale }) {
  useEffect(() => {
    const currentLocale = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.slice(LOCALE_COOKIE_NAME.length + 1);

    if (normalizeLocaleCandidate(currentLocale) !== locale) {
      persistLocale(locale);
    }
  }, [locale]);

  return null;
}
