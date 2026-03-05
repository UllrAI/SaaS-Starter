import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { buildLoginRedirectPath } from "@/lib/auth/callback-url";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
  SOURCE_LOCALE,
  extractLocaleFromPath,
  isMarketingPath,
  resolvePreferredLocale,
  withLocalePrefix,
} from "@/lib/config/i18n-routing";

function setLocaleCookie(response: NextResponse, locale: string): void {
  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

function createLocalizedRequestHeaders(
  request: NextRequest,
  locale: string,
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, locale);
  return requestHeaders;
}

export default async function authMiddleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { pathname, search } = requestUrl;

  const localeFromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const preferredLocale = resolvePreferredLocale({
    cookieLocale: localeFromCookie,
    acceptLanguage: request.headers.get("accept-language"),
  });

  const pathLocale = extractLocaleFromPath(pathname);
  const basePathname = pathLocale.locale ? pathLocale.strippedPathname : pathname;

  // Keep dashboard auth checks fast and deterministic.
  const isDashboardPage = pathname.startsWith("/dashboard");
  if (isDashboardPage) {
    const requestHeaders = createLocalizedRequestHeaders(request, preferredLocale);

    // Use better-auth helper to check the session cookie.
    const sessionCookie = getSessionCookie(request);
    const hasSession = !!sessionCookie;

    // Redirect unauthenticated users to login with callbackUrl.
    if (!hasSession) {
      const callbackUrl = `${pathname}${search}`;
      const loginUrl = new URL(buildLoginRedirectPath(callbackUrl), request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const isMarketingRequest = isMarketingPath(basePathname);
  if (!isMarketingRequest) {
    const requestHeaders = createLocalizedRequestHeaders(request, preferredLocale);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Locale-prefixed path handling.
  if (pathLocale.locale) {
    // Canonical English path does not include /en prefix.
    if (pathLocale.locale === SOURCE_LOCALE) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = pathLocale.strippedPathname;
      const response = NextResponse.redirect(redirectUrl);
      setLocaleCookie(response, SOURCE_LOCALE);
      return response;
    }

    const canonicalLocalizedPath = withLocalePrefix(
      pathLocale.strippedPathname,
      pathLocale.locale,
    );

    // Canonicalize locale aliases such as /zh/... to /zh-Hans/...
    if (!pathLocale.isCanonicalLocaleSegment || pathname !== canonicalLocalizedPath) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = canonicalLocalizedPath;
      const response = NextResponse.redirect(redirectUrl);
      setLocaleCookie(response, pathLocale.locale);
      return response;
    }

    // Rewrite localized marketing URL to existing route tree.
    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = pathLocale.strippedPathname;

    const requestHeaders = createLocalizedRequestHeaders(request, pathLocale.locale);
    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    setLocaleCookie(response, pathLocale.locale);
    return response;
  }

  // Bare marketing paths are canonical for English, but redirect for other locales.
  if (preferredLocale !== SOURCE_LOCALE) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = withLocalePrefix(pathname, preferredLocale);
    const response = NextResponse.redirect(redirectUrl);
    setLocaleCookie(response, preferredLocale);
    return response;
  }

  const requestHeaders = createLocalizedRequestHeaders(request, SOURCE_LOCALE);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setLocaleCookie(response, SOURCE_LOCALE);
  return response;
}

export const config = {
  // Exclude API/static assets, and handle both auth and locale routing in one place.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
