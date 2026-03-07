import { beforeEach, describe, expect, it } from "@jest/globals";
import { LOCALE_COOKIE_NAME } from "@/lib/config/i18n-routing";

let cookieValue = "";

function installCookieMock() {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => cookieValue,
    set: (value: string) => {
      cookieValue = value;
    },
  });
}

function setNavigatorLanguages(languages: string[], language: string) {
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: languages,
  });
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
}

describe("lingo client locale resolver", () => {
  beforeEach(() => {
    cookieValue = "";
    installCookieMock();
    setNavigatorLanguages(["en-US"], "en-US");
    window.history.replaceState({}, "", "/");
  });

  it("prefers locale prefixes on marketing routes", async () => {
    window.history.replaceState({}, "", "/zh-Hans/pricing");

    const { getClientLocale } = await import("./locale-resolver.client");

    expect(getClientLocale()).toBe("zh-Hans");
  });

  it("uses the locale cookie outside marketing routes", async () => {
    cookieValue = `${LOCALE_COOKIE_NAME}=zh-Hans`;
    window.history.replaceState({}, "", "/dashboard");

    const { getClientLocale } = await import("./locale-resolver.client");

    expect(getClientLocale()).toBe("zh-Hans");
  });

  it("falls back to navigator languages when no cookie is set", async () => {
    setNavigatorLanguages(["fr-FR", "zh-CN"], "fr-FR");
    window.history.replaceState({}, "", "/dashboard");

    const { getClientLocale } = await import("./locale-resolver.client");

    expect(getClientLocale()).toBe("zh-Hans");
  });

  it("ignores locale prefixes outside marketing routes", async () => {
    cookieValue = `${LOCALE_COOKIE_NAME}=en`;
    window.history.replaceState({}, "", "/zh-Hans/dashboard");

    const { getClientLocale } = await import("./locale-resolver.client");

    expect(getClientLocale()).toBe("en");
  });

  it("ignores invalid cookie encoding and falls back to navigator locale", async () => {
    cookieValue = `${LOCALE_COOKIE_NAME}=%E0%A4%A`;
    setNavigatorLanguages(["zh-CN"], "zh-CN");
    window.history.replaceState({}, "", "/dashboard");

    const { getClientLocale } = await import("./locale-resolver.client");

    expect(getClientLocale()).toBe("zh-Hans");
  });

  it("persists the normalized locale cookie", async () => {
    const { persistLocale } = await import("./locale-resolver.client");

    persistLocale("zh-CN");

    expect(cookieValue).toContain(`${LOCALE_COOKIE_NAME}=zh-Hans`);
    expect(cookieValue).toContain("max-age=31536000");
    expect(cookieValue).toContain("SameSite=Lax");
  });

  it("falls back to the source locale when persisting an unsupported value", async () => {
    const { persistLocale } = await import("./locale-resolver.client");

    persistLocale("fr-FR");

    expect(cookieValue).toContain(`${LOCALE_COOKIE_NAME}=en`);
  });
});
