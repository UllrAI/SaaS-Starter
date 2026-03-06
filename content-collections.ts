import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.json",
  parser: "json",
  schema: z.object({
    name: z.string(),
    avatar: z.string().nullish().transform((avatar) => avatar ?? undefined),
  }),
  transform: (author) => ({
    ...author,
    slug: author._meta.path,
  }),
});

const posts = defineCollection({
  name: "posts",
  directory: "content/blog",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    publishedDate: z.string(),
    author: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    heroImage: z.string().optional(),
    content: z.string(),
  }),
  transform: (post) => ({
    ...post,
    slug: post._meta.path,
  }),
});

export default defineConfig({
  content: [authors, posts],
});
