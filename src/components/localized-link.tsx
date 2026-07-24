import Link, { type LinkProps } from "next/link";
import { useLocale } from "next-intl";
import type { AnchorHTMLAttributes } from "react";

import { normalizeLocaleCandidate } from "@/lib/config/i18n-routing";
import { isMarketingPath, withLocalePrefix } from "@/lib/config/i18n-routing";
import type { SupportedLocale } from "@/lib/config/i18n";

type LocalizedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    locale?: SupportedLocale;
  };

export function localizeHref(
  href: LinkProps["href"],
  locale: NonNullable<ReturnType<typeof normalizeLocaleCandidate>>,
): LinkProps["href"] {
  if (typeof href === "string") {
    const url = new URL(href, "https://local.invalid");
    if (
      url.origin !== "https://local.invalid" ||
      !isMarketingPath(url.pathname)
    ) {
      return href;
    }

    return `${withLocalePrefix(url.pathname, locale)}${url.search}${url.hash}`;
  }

  if (typeof href.pathname !== "string" || !isMarketingPath(href.pathname)) {
    return href;
  }

  return {
    ...href,
    pathname: withLocalePrefix(href.pathname, locale),
  };
}

export function LocalizedLink({
  href,
  locale: explicitLocale,
  ...props
}: LocalizedLinkProps) {
  const requestLocale = normalizeLocaleCandidate(useLocale());
  const locale = explicitLocale ?? requestLocale;
  const localizedHref = locale ? localizeHref(href, locale) : href;

  return <Link href={localizedHref} {...props} />;
}
