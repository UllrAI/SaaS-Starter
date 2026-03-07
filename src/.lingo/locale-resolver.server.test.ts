import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
} from "@/lib/config/i18n-routing";

const mockCookies = jest.fn();
const mockHeaders = jest.fn();

jest.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

type CookieValue = { value: string } | undefined;

function createCookieStore(value?: CookieValue) {
  return {
    get: jest.fn((name: string) =>
      name === LOCALE_COOKIE_NAME ? value : undefined,
    ),
  };
}

describe("lingo server locale resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefers the explicit locale request header", async () => {
    mockHeaders.mockResolvedValue(
      new Headers([
        [LOCALE_HEADER_NAME, "zh-CN"],
        ["accept-language", "en-US,en;q=0.9"],
      ]),
    );
    mockCookies.mockResolvedValue(createCookieStore({ value: "en" }));

    const { getServerLocale } = await import("./locale-resolver.server");

    await expect(getServerLocale()).resolves.toBe("zh-Hans");
  });

  it("falls back to cookie locale and then accept-language", async () => {
    mockHeaders.mockResolvedValue(new Headers([["accept-language", "en-US,en;q=0.9"]]));
    mockCookies.mockResolvedValue(createCookieStore({ value: "zh-Hans" }));

    const { getServerLocale } = await import("./locale-resolver.server");

    await expect(getServerLocale()).resolves.toBe("zh-Hans");
  });

  it("uses accept-language when there is no valid header or cookie locale", async () => {
    mockHeaders.mockResolvedValue(
      new Headers([
        [LOCALE_HEADER_NAME, "fr-FR"],
        ["accept-language", "fr;q=0.9,zh-CN;q=0.8,en;q=0.7"],
      ]),
    );
    mockCookies.mockResolvedValue(createCookieStore());

    const { getServerLocale } = await import("./locale-resolver.server");

    await expect(getServerLocale()).resolves.toBe("zh-Hans");
  });
});
