import { notFound } from "next/navigation";

import { getPostBySlug } from "@/lib/content/blog";
import LocalizedBlogPostPage from "./page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/i18n/static-marketing-locale", () => ({
  resolveStaticMarketingParams: jest.fn(async () => "zh-Hans"),
}));

jest.mock("@/lib/content/blog", () => ({
  getAllPostSlugs: jest.fn(() => []),
  getPostBySlug: jest.fn(),
}));

jest.mock("@/app/(pages)/blog/[slug]/page", () => ({
  BlogPostPageContent: jest.fn(() => null),
  generateBlogPostMetadata: jest.fn(),
}));

const mockGetPostBySlug = jest.mocked(getPostBySlug);
const mockNotFound = jest.mocked(notFound);

describe("LocalizedBlogPostPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws notFound at the route boundary when a translation is missing", async () => {
    mockGetPostBySlug.mockReturnValue(undefined);

    await expect(
      LocalizedBlogPostPage({
        params: Promise.resolve({
          locale: "zh-Hans",
          slug: "english-only-post",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetPostBySlug).toHaveBeenCalledWith(
      "english-only-post",
      "zh-Hans",
    );
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
