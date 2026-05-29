jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingLocale,
} from "./static-marketing-locale";

describe("static marketing locale helpers", () => {
  it("returns all supported locales for the unified marketing route tree", () => {
    expect(getStaticMarketingLocaleParams()).toEqual([
      { locale: "en" },
      { locale: "zh-Hans" },
    ]);
  });

  it("accepts canonical supported locale segments", () => {
    expect(resolveStaticMarketingLocale("en")).toBe("en");
    expect(resolveStaticMarketingLocale("zh-Hans")).toBe("zh-Hans");
  });

  it("rejects alias and unsupported locale segments", () => {
    expect(() => resolveStaticMarketingLocale("zh")).toThrow("NEXT_NOT_FOUND");
    expect(() => resolveStaticMarketingLocale("fr")).toThrow("NEXT_NOT_FOUND");
  });
});
