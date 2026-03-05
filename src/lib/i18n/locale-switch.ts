import type { SupportedLocale } from "@/lib/config/i18n";
import {
  extractLocaleFromPath,
  isMarketingPath,
  withLocalePrefix,
} from "@/lib/config/i18n-routing";

type ResolveLocaleSwitchUrlInput = {
  pathname: string;
  search?: string;
  hash?: string;
  locale: SupportedLocale;
};

export function resolveLocaleSwitchUrl({
  pathname,
  search = "",
  hash = "",
  locale,
}: ResolveLocaleSwitchUrlInput): string | null {
  const pathLocale = extractLocaleFromPath(pathname);
  const basePathname = pathLocale.locale ? pathLocale.strippedPathname : pathname;

  if (!isMarketingPath(basePathname)) {
    return null;
  }

  const nextPathname = withLocalePrefix(basePathname, locale);
  const currentUrl = `${pathname}${search}${hash}`;
  const nextUrl = `${nextPathname}${search}${hash}`;

  return nextUrl === currentUrl ? null : nextUrl;
}
