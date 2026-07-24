import { localizeHref } from "./localized-link";

describe("localizeHref", () => {
  it("keeps English marketing URLs canonical", () => {
    expect(localizeHref("/pricing", "en")).toBe("/pricing");
  });

  it("prefixes Chinese marketing URLs and preserves query and hash", () => {
    expect(localizeHref("/blog?page=2#latest", "zh-Hans")).toBe(
      "/zh-Hans/blog?page=2#latest",
    );
  });

  it("localizes URL objects without discarding their other fields", () => {
    expect(
      localizeHref(
        {
          pathname: "/contact",
          query: { source: "footer" },
          hash: "form",
        },
        "zh-Hans",
      ),
    ).toEqual({
      pathname: "/zh-Hans/contact",
      query: { source: "footer" },
      hash: "form",
    });
  });

  it("leaves external and non-marketing destinations unchanged", () => {
    expect(localizeHref("https://example.com/about", "zh-Hans")).toBe(
      "https://example.com/about",
    );
    expect(localizeHref("/dashboard/settings", "zh-Hans")).toBe(
      "/dashboard/settings",
    );
  });
});
