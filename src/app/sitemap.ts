import { MetadataRoute } from "next";
import env from "@/env";
import { SOURCE_LOCALE, SUPPORTED_LOCALES } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import { getAllLocalizedPosts, getPostLocalizations } from "@/lib/content/blog";

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
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      `${env.NEXT_PUBLIC_APP_URL}${withLocalePrefix(pathname, locale)}`,
    ]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const staticPages: MetadataRoute.Sitemap = localizedMarketingRoutes.flatMap(
    ({ pathname, changeFrequency, priority }) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: `${baseUrl}${withLocalePrefix(pathname, locale)}`,
        changeFrequency,
        priority: locale === SOURCE_LOCALE ? priority : Math.max(priority - 0.1, 0.1),
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
        `${baseUrl}${getLocalizedPostPath(localizedPost.slug, localizedPost.locale)}`,
      ]),
    );

    return {
      url: `${baseUrl}${getLocalizedPostPath(post.slug, post.locale)}`,
      lastModified: post.publishedDate
        ? new Date(post.publishedDate)
        : undefined,
      changeFrequency: "monthly" as const,
      priority: post.featured ? 0.8 : 0.7,
      alternates: {
        languages,
      },
    };
  });

  return [...staticPages, ...blogPostEntries];
}

function getLocalizedPostPath(slug: string, locale: (typeof SUPPORTED_LOCALES)[number]) {
  return withLocalePrefix(`/blog/${slug}`, locale);
}
