import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockHeaders = jest.fn<() => Promise<Headers>>();
const mockCookies =
  jest.fn<
    () => Promise<{ get: (name: string) => { value: string } | undefined }>
  >();

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
  cookies: () => mockCookies(),
}));

describe("server locale helpers", () => {
  beforeEach(() => {
    jest.resetModules();
    mockHeaders.mockResolvedValue(new Headers());
    mockCookies.mockResolvedValue({ get: () => undefined });
  });

  it("prefers and normalizes the proxy locale header", async () => {
    mockHeaders.mockResolvedValue(new Headers({ "x-user-locale": "zh-CN" }));

    const { getRequestLocale } = await import("./server-locale");

    await expect(getRequestLocale()).resolves.toBe("zh-Hans");
  });

  it("falls back to cookie and Accept-Language negotiation", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "accept-language": "zh-CN,zh;q=0.9" }),
    );
    mockCookies.mockResolvedValue({ get: () => undefined });

    const { getRequestLocale } = await import("./server-locale");

    await expect(getRequestLocale()).resolves.toBe("zh-Hans");
  });

  it("maps the request locale to the correct Intl locale", async () => {
    mockHeaders.mockResolvedValue(new Headers({ "x-user-locale": "zh-Hans" }));

    const { getRequestIntlLocale } = await import("./server-locale");

    await expect(getRequestIntlLocale()).resolves.toBe("zh-CN");
  });
});
