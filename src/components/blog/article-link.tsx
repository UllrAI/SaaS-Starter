import type { ComponentPropsWithoutRef } from "react";
import { ArticleLocaleLink } from "./article-locale-link";
import { LocalizedLink } from "@/components/localized-link";
import { GITHUB_URL } from "@/lib/config/constants";
import type { SupportedLocale } from "@/lib/config/i18n";
import { extractLocaleFromPath } from "@/lib/config/i18n-routing";
import { getPostBySlug } from "@/lib/content/blog";

type ArticleLinkProps = ComponentPropsWithoutRef<"a"> & {
  slug: string;
  locale: SupportedLocale;
};

function isSourceLink(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    const repository = new URL(GITHUB_URL);
    return (
      url.origin === repository.origin &&
      url.pathname.replace(/\/$/, "").toLowerCase() ===
        repository.pathname.replace(/\/$/, "").toLowerCase()
    );
  } catch {
    return false;
  }
}

export function ArticleLink({
  slug,
  locale,
  href,
  ...props
}: ArticleLinkProps) {
  if (href?.startsWith("/") && !href.startsWith("//")) {
    const url = new URL(href, "https://local.invalid");
    const { strippedPathname } = extractLocaleFromPath(url.pathname);
    const linkedSlug = strippedPathname.match(/^\/blog\/([^/]+)$/)?.[1];
    const linkLocale =
      linkedSlug && !getPostBySlug(linkedSlug, locale) ? "en" : locale;

    const canonicalHref = `${strippedPathname}${url.search}${url.hash}`;
    if (linkLocale !== locale) {
      return (
        <ArticleLocaleLink
          href={canonicalHref}
          locale={linkLocale}
          {...props}
        />
      );
    }

    return (
      <LocalizedLink href={canonicalHref} locale={linkLocale} {...props} />
    );
  }

  const sourceLink = isSourceLink(href);
  return (
    <a
      href={href}
      {...props}
      data-umami-event={sourceLink ? "github_source_click" : undefined}
      data-umami-event-source={sourceLink ? "blog_article" : undefined}
      data-umami-event-article={sourceLink ? slug : undefined}
      data-umami-event-locale={sourceLink ? locale : undefined}
    />
  );
}
