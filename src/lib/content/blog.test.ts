import { describe, expect, it } from "@jest/globals";
import {
  getAllLocalizedPosts,
  getAllPostSlugs,
  getAllPosts,
  getAuthorBySlug,
  getLocalizedBlogPath,
  getLocalizedBlogPostPath,
  getPostBySlug,
  getPostLocalizations,
} from "./blog";

describe("blog content localization helpers", () => {
  it("returns the localized blog post when the locale exists", () => {
    const post = getPostBySlug("saas-starter-kit-developer-guide", "zh-Hans");

    expect(post).toBeDefined();
    expect(post?.locale).toBe("zh-Hans");
    expect(post?.isFallback).toBe(false);
    expect(post?.title).toContain("开发者文档");
    expect(post?.availableLocales).toEqual(["en", "zh-Hans"]);
  });

  it("falls back to english when a translation is missing", () => {
    const post = getPostBySlug("modern-css-techniques", "zh-Hans");

    expect(post).toBeDefined();
    expect(post?.locale).toBe("en");
    expect(post?.isFallback).toBe(true);
  });

  it("returns a locale-aware list without duplicating translated slugs", () => {
    const posts = getAllPosts("zh-Hans");

    expect(posts).toHaveLength(5);
    expect(posts[0]?.slug).toBe("agent-friendly-saas-template");
    expect(getAllPostSlugs()).toEqual([
      "agent-friendly-saas-template",
      "modern-css-techniques",
      "nextjs-15-features",
      "saas-starter-kit-developer-guide",
      "typescript-best-practices",
    ]);
  });

  it("exposes all localized source records for sitemap and metadata", () => {
    expect(getAllLocalizedPosts()).toHaveLength(7);
    expect(
      getPostLocalizations("saas-starter-kit-developer-guide").map(
        (post) => post.locale,
      ),
    ).toEqual(["en", "zh-Hans"]);
    expect(
      getPostLocalizations("agent-friendly-saas-template").map(
        (post) => post.locale,
      ),
    ).toEqual(["en", "zh-Hans"]);
  });

  it("builds locale-aware paths and resolves authors", () => {
    expect(getLocalizedBlogPath("en")).toBe("/blog");
    expect(getLocalizedBlogPath("zh-Hans")).toBe("/zh-Hans/blog");
    expect(
      getLocalizedBlogPostPath("saas-starter-kit-developer-guide", "zh-Hans"),
    ).toBe("/zh-Hans/blog/saas-starter-kit-developer-guide");
    expect(getAuthorBySlug("admin")?.name).toBe("UllrAI");
  });

  it("returns undefined or empty collections for missing blog entities", () => {
    expect(getPostBySlug("missing-post")).toBeUndefined();
    expect(getPostLocalizations("missing-post")).toEqual([]);
    expect(getAuthorBySlug()).toBeUndefined();
    expect(getAuthorBySlug(null)).toBeUndefined();
    expect(getAuthorBySlug("missing-author")).toBeUndefined();
  });
});
