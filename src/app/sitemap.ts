import { MetadataRoute } from "next";
import { SOURCE_LOCALE, SUPPORTED_LOCALES } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import { getAllLocalizedPosts, getPostLocalizations } from "@/lib/content/blog";
import { absoluteUrl } from "@/lib/url";

const localizedMarketingRoutes = [
  {
    pathname: "/",
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    pathname: "/features",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    pathname: "/about",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    pathname: "/contact",
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    pathname: "/pricing",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    pathname: "/privacy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    pathname: "/terms",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    pathname: "/blog",
    changeFrequency: "weekly" as const,
    priority: 0.9,
  },
] as const;

function buildLocaleAlternates(pathname: string) {
  return {
    ...Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [
        locale,
        absoluteUrl(withLocalePrefix(pathname, locale)),
      ]),
    ),
    "x-default": absoluteUrl(withLocalePrefix(pathname, SOURCE_LOCALE)),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = localizedMarketingRoutes.flatMap(
    ({ pathname, changeFrequency, priority }) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: absoluteUrl(withLocalePrefix(pathname, locale)),
        changeFrequency,
        priority,
        alternates: {
          languages: buildLocaleAlternates(pathname),
        },
      })),
  );

  const blogPosts = getAllLocalizedPosts();
  const blogPostEntries: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const localizations = getPostLocalizations(post.slug);
    const languages = Object.fromEntries(
      localizations.map((localizedPost) => [
        localizedPost.locale,
        absoluteUrl(
          getLocalizedPostPath(localizedPost.slug, localizedPost.locale),
        ),
      ]),
    );
    const defaultPost = localizations.find(
      (localizedPost) => localizedPost.locale === SOURCE_LOCALE,
    );

    return {
      url: absoluteUrl(getLocalizedPostPath(post.slug, post.locale)),
      lastModified: post.updatedDate ? new Date(post.updatedDate) : undefined,
      changeFrequency: "monthly" as const,
      priority: post.featured ? 0.8 : 0.7,
      alternates: {
        languages: {
          ...languages,
          ...(defaultPost
            ? {
                "x-default": absoluteUrl(
                  getLocalizedPostPath(defaultPost.slug, defaultPost.locale),
                ),
              }
            : {}),
        },
      },
    };
  });

  return [...staticPages, ...blogPostEntries];
}

function getLocalizedPostPath(
  slug: string,
  locale: (typeof SUPPORTED_LOCALES)[number],
) {
  return withLocalePrefix(`/blog/${slug}`, locale);
}
