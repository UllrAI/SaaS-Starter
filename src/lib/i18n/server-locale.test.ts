import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetServerLocale = jest.fn<() => Promise<string | null | undefined>>();

jest.mock("@/.lingo/locale-resolver.server", () => ({
  getServerLocale: mockGetServerLocale,
}));

describe("server locale helpers", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("normalizes the request locale and caches the result", async () => {
    mockGetServerLocale.mockResolvedValue("zh-CN");

    const { getRequestLocale } = await import("./server-locale");

    await expect(getRequestLocale()).resolves.toBe("zh-Hans");
    await expect(getRequestLocale()).resolves.toBe("zh-Hans");
  });

  it("falls back to the source locale when the request locale is invalid", async () => {
    mockGetServerLocale.mockResolvedValue("fr-FR");

    const { getRequestLocale } = await import("./server-locale");

    await expect(getRequestLocale()).resolves.toBe("en");
  });

  it("maps the request locale to the correct Intl locale", async () => {
    mockGetServerLocale.mockResolvedValue("zh-Hans");

    const { getRequestIntlLocale } = await import("./server-locale");

    await expect(getRequestIntlLocale()).resolves.toBe("zh-CN");
  });
});
