jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
}));

import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingLocale,
} from "./static-marketing-locale";

describe("static marketing locale helpers", () => {
  it("returns only target locales for localized marketing paths", () => {
    expect(getStaticMarketingLocaleParams()).toEqual([{ locale: "zh-Hans" }]);
  });

  it("accepts canonical target locale segments", () => {
    expect(resolveStaticMarketingLocale("zh-Hans")).toBe("zh-Hans");
  });

  it("rejects source, alias, and unsupported locale segments", () => {
    expect(() => resolveStaticMarketingLocale("en")).toThrow("NEXT_NOT_FOUND");
    expect(() => resolveStaticMarketingLocale("zh")).toThrow("NEXT_NOT_FOUND");
    expect(() => resolveStaticMarketingLocale("fr")).toThrow("NEXT_NOT_FOUND");
  });
});
