import { describe, expect, it } from "@jest/globals";

import { resolveIntlLocale } from "./locale";

describe("resolveIntlLocale", () => {
  it("maps supported app locales to Intl locales", () => {
    expect(resolveIntlLocale("en")).toBe("en-US");
    expect(resolveIntlLocale("zh-Hans")).toBe("zh-CN");
  });

  it("falls back to en-US when no locale is provided", () => {
    expect(resolveIntlLocale()).toBe("en-US");
    expect(resolveIntlLocale(null)).toBe("en-US");
  });

  it("returns unknown locales unchanged", () => {
    expect(resolveIntlLocale("fr-FR")).toBe("fr-FR");
  });
});
