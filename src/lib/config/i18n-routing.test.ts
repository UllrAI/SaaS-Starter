import {
  extractLocaleFromPath,
  isMarketingPath,
  normalizeLocaleCandidate,
  resolvePreferredLocale,
  resolveLocaleFromAcceptLanguage,
  withLocalePrefix,
} from "./i18n-routing";

describe("i18n routing helpers", () => {
  it("normalizes locale aliases to supported locales", () => {
    expect(normalizeLocaleCandidate("zh")).toBe("zh-Hans");
    expect(normalizeLocaleCandidate("zh-CN")).toBe("zh-Hans");
    expect(normalizeLocaleCandidate("en-US")).toBe("en");
    expect(normalizeLocaleCandidate("zh_Hans")).toBe("zh-Hans");
    expect(normalizeLocaleCandidate("  ")).toBeNull();
    expect(normalizeLocaleCandidate("fr")).toBeNull();
  });

  it("resolves locale from Accept-Language by quality score", () => {
    expect(
      resolveLocaleFromAcceptLanguage("fr;q=0.9,zh-CN;q=0.8,en;q=0.7"),
    ).toBe("zh-Hans");
    expect(
      resolveLocaleFromAcceptLanguage(" ,en-GB;q=not-a-number,zh;q=0.2"),
    ).toBe("en");
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

    expect(extractLocaleFromPath("/dashboard")).toEqual({
      locale: null,
      strippedPathname: "/dashboard",
      isCanonicalLocaleSegment: true,
    });
  });

  it("handles marketing path detection and locale prefix building", () => {
    expect(isMarketingPath("/")).toBe(true);
    expect(isMarketingPath("/blog/post")).toBe(true);
    expect(isMarketingPath("/dashboard")).toBe(false);

    expect(withLocalePrefix("/about", "zh-Hans")).toBe("/zh-Hans/about");
    expect(withLocalePrefix("/about", "en")).toBe("/about");
    expect(withLocalePrefix("/", "zh-Hans")).toBe("/zh-Hans");
  });

  it("prefers cookie locale, then accept-language, then the source locale", () => {
    expect(
      resolvePreferredLocale({
        cookieLocale: "zh-CN",
        acceptLanguage: "en-US,en;q=0.8",
      }),
    ).toBe("zh-Hans");

    expect(
      resolvePreferredLocale({
        cookieLocale: "fr-FR",
        acceptLanguage: "zh-CN,fr;q=0.8",
      }),
    ).toBe("zh-Hans");

    expect(
      resolvePreferredLocale({
        cookieLocale: "fr-FR",
        acceptLanguage: "fr-FR,fr;q=0.8",
      }),
    ).toBe("en");
  });
});
