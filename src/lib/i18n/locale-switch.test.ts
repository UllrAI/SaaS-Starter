import { resolveLocaleSwitchUrl } from "./locale-switch";

describe("resolveLocaleSwitchUrl", () => {
  it("routes english marketing path to localized path", () => {
    expect(
      resolveLocaleSwitchUrl({
        pathname: "/about",
        locale: "zh-Hans",
      }),
    ).toBe("/zh-Hans/about");
  });

  it("routes localized marketing path back to english canonical path", () => {
    expect(
      resolveLocaleSwitchUrl({
        pathname: "/zh-Hans/about",
        locale: "en",
      }),
    ).toBe("/about");
  });

  it("returns null when locale switch keeps the same marketing URL", () => {
    expect(
      resolveLocaleSwitchUrl({
        pathname: "/zh-Hans/about",
        locale: "zh-Hans",
      }),
    ).toBeNull();
  });

  it("returns null for non-marketing paths", () => {
    expect(
      resolveLocaleSwitchUrl({
        pathname: "/dashboard",
        locale: "zh-Hans",
      }),
    ).toBeNull();
  });

  it("preserves query and hash in localized URL", () => {
    expect(
      resolveLocaleSwitchUrl({
        pathname: "/pricing",
        search: "?plan=pro",
        hash: "#faq",
        locale: "zh-Hans",
      }),
    ).toBe("/zh-Hans/pricing?plan=pro#faq");
  });

  it("supports switching from zh-Hans to en and back to zh-Hans", () => {
    const toEnglish = resolveLocaleSwitchUrl({
      pathname: "/zh-Hans/about",
      locale: "en",
    });
    expect(toEnglish).toBe("/about");

    const toChinese = resolveLocaleSwitchUrl({
      pathname: toEnglish ?? "/about",
      locale: "zh-Hans",
    });
    expect(toChinese).toBe("/zh-Hans/about");
  });
});
