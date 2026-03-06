import { allAuthors, allPosts } from "content-collections";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";

type BlogAuthor = (typeof allAuthors)[number];
type BlogPost = (typeof allPosts)[number];

export type LocalizedBlogPost = BlogPost & {
  availableLocales: SupportedLocale[];
  isFallback: boolean;
};

const authorsBySlug = new Map<string, BlogAuthor>(
  allAuthors.map((author) => [author.slug, author]),
);

const comparePosts = (a: BlogPost, b: BlogPost) => {
  const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
  const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);

  if (dateA.getTime() !== dateB.getTime()) {
    return dateB.getTime() - dateA.getTime();
  }

  return a.title.localeCompare(b.title);
};

const postLocalizationsBySlug = new Map<string, BlogPost[]>();

for (const post of allPosts) {
  const existingPosts = postLocalizationsBySlug.get(post.slug);

  if (existingPosts) {
    existingPosts.push(post);
  } else {
    postLocalizationsBySlug.set(post.slug, [post]);
  }
}

for (const posts of postLocalizationsBySlug.values()) {
  posts.sort((a, b) => a.locale.localeCompare(b.locale));
}

function getAvailableLocales(posts: BlogPost[]): SupportedLocale[] {
  const locales = new Set<SupportedLocale>();

  for (const post of posts) {
    locales.add(post.locale);
  }

  return [...locales];
}

function resolveLocalizedPost(
  posts: BlogPost[],
  locale: SupportedLocale,
): LocalizedBlogPost {
  const resolvedPost =
    posts.find((post) => post.locale === locale) ??
    posts.find((post) => post.locale === SOURCE_LOCALE) ??
    posts[0];

  if (!resolvedPost) {
    throw new Error("Expected at least one localized blog post.");
  }

  return {
    ...resolvedPost,
    availableLocales: getAvailableLocales(posts),
    isFallback: resolvedPost.locale !== locale,
  };
}

export type { BlogAuthor, BlogPost };

export function getAllLocalizedPosts(): BlogPost[] {
  return allPosts.toSorted(comparePosts);
}

export function getAllPostSlugs(): string[] {
  return [...postLocalizationsBySlug.keys()].sort();
}

export function getAllPosts(
  locale: SupportedLocale = SOURCE_LOCALE,
): LocalizedBlogPost[] {
  return [...postLocalizationsBySlug.values()]
    .map((posts) => resolveLocalizedPost(posts, locale))
    .toSorted(comparePosts);
}

export function getPostBySlug(
  slug: string,
  locale: SupportedLocale = SOURCE_LOCALE,
): LocalizedBlogPost | undefined {
  const posts = postLocalizationsBySlug.get(slug);

  if (!posts) {
    return undefined;
  }

  return resolveLocalizedPost(posts, locale);
}

export function getPostLocalizations(slug: string): BlogPost[] {
  return [...(postLocalizationsBySlug.get(slug) ?? [])];
}

export function getAuthorBySlug(slug?: string | null): BlogAuthor | undefined {
  if (!slug) {
    return undefined;
  }

  return authorsBySlug.get(slug);
}

export function getLocalizedBlogPath(locale: SupportedLocale): string {
  return withLocalePrefix("/blog", locale);
}

export function getLocalizedBlogPostPath(
  slug: string,
  locale: SupportedLocale,
): string {
  return withLocalePrefix(`/blog/${slug}`, locale);
}
