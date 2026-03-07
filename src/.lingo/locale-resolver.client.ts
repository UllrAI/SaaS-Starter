import {
  LOCALE_COOKIE_NAME,
  SOURCE_LOCALE,
  extractLocaleFromPath,
  isMarketingPath,
  normalizeLocaleCandidate,
  resolvePreferredLocale,
} from "@/lib/config/i18n-routing";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getLocaleCookie(): string | null {
  const cookiePair = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`));

  if (!cookiePair) {
    return null;
  }

  const rawValue = cookiePair.split("=")[1];
  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return null;
  }
}

function persistLocaleCookie(locale: string): void {
  const encoded = encodeURIComponent(locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${encoded}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getClientLocale(): string {
  const pathLocale = extractLocaleFromPath(window.location.pathname);

  if (pathLocale.locale && isMarketingPath(pathLocale.strippedPathname)) {
    return pathLocale.locale;
  }

  return resolvePreferredLocale({
    cookieLocale: getLocaleCookie(),
    acceptLanguage: navigator.languages?.join(",") ?? navigator.language,
  });
}

export function persistLocale(locale: string): void {
  const nextLocale = normalizeLocaleCandidate(locale) ?? SOURCE_LOCALE;
  persistLocaleCookie(nextLocale);
}
