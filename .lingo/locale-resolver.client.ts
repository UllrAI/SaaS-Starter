import {
  LOCALE_COOKIE_NAME,
  SOURCE_LOCALE,
  extractLocaleFromPath,
  isMarketingPath,
  normalizeLocaleCandidate,
  resolvePreferredLocale,
  withLocalePrefix,
} from "../src/lib/config/i18n-routing";

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
  document.cookie = `${LOCALE_COOKIE_NAME}=${encoded}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function getClientLocale(): string {
  const currentPath = window.location.pathname;
  const pathLocale = extractLocaleFromPath(currentPath);

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

  const { pathname, search, hash } = window.location;
  const pathLocale = extractLocaleFromPath(pathname);
  const basePathname = pathLocale.locale ? pathLocale.strippedPathname : pathname;

  if (isMarketingPath(basePathname)) {
    const nextPathname = withLocalePrefix(basePathname, nextLocale);
    const currentUrl = `${pathname}${search}${hash}`;
    const nextUrl = `${nextPathname}${search}${hash}`;
    if (nextUrl !== currentUrl) {
      window.location.assign(nextUrl);
    }
    return;
  }

  window.location.reload();
}
