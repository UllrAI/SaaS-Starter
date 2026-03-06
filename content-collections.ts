import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { type SupportedLocale, SUPPORTED_LOCALES } from "./src/lib/config/i18n";

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);

function getPostLocaleAndSlug(path: string): {
  locale: SupportedLocale;
  pathSlug: string;
} {
  const [localeSegment, ...slugSegments] = path.split("/");

  if (!localeSegment || slugSegments.length === 0) {
    throw new Error(
      `Blog post path must be namespaced by locale, received "${path}".`,
    );
  }

  if (!supportedLocaleSet.has(localeSegment)) {
    throw new Error(
      `Unsupported blog post locale "${localeSegment}" in "${path}".`,
    );
  }

  return {
    locale: localeSegment as SupportedLocale,
    pathSlug: slugSegments.join("/"),
  };
}

const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.json",
  parser: "json",
  schema: z.object({
    name: z.string(),
    avatar: z
      .string()
      .nullish()
      .transform((avatar) => avatar ?? undefined),
  }),
  transform: (author) => ({
    ...author,
    slug: author._meta.path,
  }),
});

const posts = defineCollection({
  name: "posts",
  directory: "content/blog",
  include: "**/*.md",
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    publishedDate: z.string(),
    author: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    heroImage: z.string().optional(),
    content: z.string(),
  }),
  transform: (post) => {
    const { locale, pathSlug } = getPostLocaleAndSlug(post._meta.path);

    return {
      ...post,
      locale,
      slug: post.slug?.trim() || pathSlug,
    };
  },
});

export default defineConfig({
  content: [authors, posts],
});
