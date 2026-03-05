import {
  extractLocaleFromPath,
  isMarketingPath,
  normalizeLocaleCandidate,
  resolveLocaleFromAcceptLanguage,
  withLocalePrefix,
} from "./i18n-routing";

describe("i18n routing helpers", () => {
  it("normalizes locale aliases to supported locales", () => {
    expect(normalizeLocaleCandidate("zh")).toBe("zh-Hans");
    expect(normalizeLocaleCandidate("zh-CN")).toBe("zh-Hans");
    expect(normalizeLocaleCandidate("en-US")).toBe("en");
    expect(normalizeLocaleCandidate("fr")).toBeNull();
  });

  it("resolves locale from Accept-Language by quality score", () => {
    expect(
      resolveLocaleFromAcceptLanguage("fr;q=0.9,zh-CN;q=0.8,en;q=0.7"),
    ).toBe("zh-Hans");
    expect(resolveLocaleFromAcceptLanguage("fr-FR,fr;q=0.9")).toBeNull();
  });

  it("extracts locale prefixes and stripped paths", () => {
    expect(extractLocaleFromPath("/zh-Hans/blog/post")).toEqual({
      locale: "zh-Hans",
      strippedPathname: "/blog/post",
      isCanonicalLocaleSegment: true,
    });

    expect(extractLocaleFromPath("/zh/blog")).toEqual({
      locale: "zh-Hans",
      strippedPathname: "/blog",
      isCanonicalLocaleSegment: false,
    });
  });

  it("handles marketing path detection and locale prefix building", () => {
    expect(isMarketingPath("/")).toBe(true);
    expect(isMarketingPath("/blog/post")).toBe(true);
    expect(isMarketingPath("/dashboard")).toBe(false);

    expect(withLocalePrefix("/about", "zh-Hans")).toBe("/zh-Hans/about");
    expect(withLocalePrefix("/about", "en")).toBe("/about");
  });
});
