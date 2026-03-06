import {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/config/i18n";

export { SOURCE_LOCALE };

export const LOCALE_COOKIE_NAME = "locale";
export const LOCALE_HEADER_NAME = "x-user-locale";

const DEFAULT_LOCALE = SOURCE_LOCALE;

const MARKETING_ROUTE_PREFIXES = [
  "/features",
  "/about",
  "/pricing",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
  "/payment-status",
] as const;

const LOCALE_ALIAS_MAP: Record<string, SupportedLocale> = {
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  zh: "zh-Hans",
  "zh-hans": "zh-Hans",
  "zh-cn": "zh-Hans",
  "zh-sg": "zh-Hans",
};

const SUPPORTED_LOCALE_LOOKUP = new Map(
  SUPPORTED_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
);

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function getFirstPathSegment(pathname: string): string | null {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return null;
  }

  const match = normalized.match(/^\/([^/]+)/);
  return match?.[1] ?? null;
}

function stripFirstPathSegment(pathname: string): string {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return "/";
  }

  const stripped = normalized.replace(/^\/[^/]+/, "");
  return stripped || "/";
}

function parseAcceptLanguageEntry(entry: string): { tag: string; q: number } | null {
  const trimmed = entry.trim();
  if (!trimmed) {
    return null;
  }

  const [tagPart, ...params] = trimmed.split(";");
  const tag = tagPart?.trim();
  if (!tag) {
    return null;
  }

  let q = 1;
  for (const param of params) {
    const [key, value] = param.split("=");
    if (key?.trim().toLowerCase() === "q") {
      const parsed = Number.parseFloat(value?.trim() ?? "");
      if (Number.isFinite(parsed)) {
        q = parsed;
      }
    }
  }

  return { tag, q };
}

export function normalizeLocaleCandidate(
  locale: string | null | undefined,
): SupportedLocale | null {
  if (!locale) {
    return null;
  }

  const normalized = locale.trim().replace("_", "-").toLowerCase();
  if (!normalized) {
    return null;
  }

  const exact = SUPPORTED_LOCALE_LOOKUP.get(normalized);
  if (exact) {
    return exact;
  }

  const alias = LOCALE_ALIAS_MAP[normalized];
  if (alias) {
    return alias;
  }

  const languageOnly = normalized.split("-")[0];
  if (languageOnly) {
    const languageAlias = LOCALE_ALIAS_MAP[languageOnly];
    if (languageAlias) {
      return languageAlias;
    }
  }

  return null;
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): SupportedLocale | null {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(",")
    .map(parseAcceptLanguageEntry)
    .filter((entry): entry is { tag: string; q: number } => entry !== null)
    .sort((a, b) => b.q - a.q);

  for (const candidate of candidates) {
    const locale = normalizeLocaleCandidate(candidate.tag);
    if (locale) {
      return locale;
    }
  }

  return null;
}

export function resolvePreferredLocale({
  cookieLocale,
  acceptLanguage,
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): SupportedLocale {
  return (
    normalizeLocaleCandidate(cookieLocale) ??
    resolveLocaleFromAcceptLanguage(acceptLanguage) ??
    DEFAULT_LOCALE
  );
}

export function isMarketingPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return true;
  }

  return MARKETING_ROUTE_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function extractLocaleFromPath(pathname: string): {
  locale: SupportedLocale | null;
  strippedPathname: string;
  isCanonicalLocaleSegment: boolean;
} {
  const normalized = normalizePathname(pathname);
  const segment = getFirstPathSegment(normalized);
  if (!segment) {
    return {
      locale: null,
      strippedPathname: normalized,
      isCanonicalLocaleSegment: true,
    };
  }

  const locale = normalizeLocaleCandidate(segment);
  if (!locale) {
    return {
      locale: null,
      strippedPathname: normalized,
      isCanonicalLocaleSegment: true,
    };
  }

  return {
    locale,
    strippedPathname: stripFirstPathSegment(normalized),
    isCanonicalLocaleSegment: segment === locale,
  };
}

export function withLocalePrefix(
  pathname: string,
  locale: SupportedLocale,
): string {
  const normalized = normalizePathname(pathname);
  if (locale === DEFAULT_LOCALE) {
    return normalized;
  }

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
