import { describe, expect, it, jest } from "@jest/globals";

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    NEXT_PUBLIC_APP_URL: "https://starter.example.com",
  },
}));

jest.mock("@/lib/content/blog", () => ({
  getAllLocalizedPosts: () => [
    {
      slug: "seo-guide",
      locale: "en",
      publishedDate: "2026-01-10",
      featured: true,
    },
    {
      slug: "seo-guide",
      locale: "zh-Hans",
      publishedDate: "2026-01-10",
      featured: true,
    },
  ],
  getPostLocalizations: () => [
    {
      slug: "seo-guide",
      locale: "en",
    },
    {
      slug: "seo-guide",
      locale: "zh-Hans",
    },
  ],
}));

describe("sitemap", () => {
  it("includes localized marketing entries with hreflang alternates", async () => {
    const { default: sitemap } = await import("./sitemap");
    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://starter.example.com/pricing",
          alternates: {
            languages: {
              en: "https://starter.example.com/pricing",
              "zh-Hans": "https://starter.example.com/zh-Hans/pricing",
            },
          },
        }),
        expect.objectContaining({
          url: "https://starter.example.com/zh-Hans/pricing",
          alternates: {
            languages: {
              en: "https://starter.example.com/pricing",
              "zh-Hans": "https://starter.example.com/zh-Hans/pricing",
            },
          },
        }),
      ]),
    );
  });

  it("includes hreflang alternates for localized blog posts", async () => {
    const { default: sitemap } = await import("./sitemap");
    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://starter.example.com/blog/seo-guide",
          alternates: {
            languages: {
              en: "https://starter.example.com/blog/seo-guide",
              "zh-Hans": "https://starter.example.com/zh-Hans/blog/seo-guide",
            },
          },
        }),
        expect.objectContaining({
          url: "https://starter.example.com/zh-Hans/blog/seo-guide",
          alternates: {
            languages: {
              en: "https://starter.example.com/blog/seo-guide",
              "zh-Hans": "https://starter.example.com/zh-Hans/blog/seo-guide",
            },
          },
        }),
      ]),
    );
  });
});
