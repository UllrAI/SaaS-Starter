"use client";

import {
  LOCALE_COOKIE_NAME,
  SOURCE_LOCALE,
  normalizeLocaleCandidate,
} from "@/lib/config/i18n-routing";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function persistLocale(locale: string): void {
  const normalizedLocale = normalizeLocaleCandidate(locale) ?? SOURCE_LOCALE;
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(normalizedLocale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
