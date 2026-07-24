jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: jest.fn(),
}));

jest.mock("@/lib/i18n/messages", () => ({
  loadMessages: jest.fn(),
}));

import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";
import getRequestConfig from "./request";

const mockGetRequestLocale = jest.mocked(getRequestLocale);
const mockLoadMessages = jest.mocked(loadMessages);

describe("next-intl request config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestLocale.mockResolvedValue("en");
    mockLoadMessages.mockImplementation(async (locale: string) => ({
      locale,
    }));
  });

  it("lets an explicit route locale override request preferences", async () => {
    const result = await getRequestConfig({
      locale: "zh-Hans",
      requestLocale: Promise.resolve("en"),
    });

    expect(mockGetRequestLocale).not.toHaveBeenCalled();
    expect(mockLoadMessages).toHaveBeenCalledWith("zh-Hans");
    expect(result).toEqual({
      locale: "zh-Hans",
      messages: { locale: "zh-Hans" },
      timeZone: "UTC",
    });
  });

  it("falls back to the request locale for non-route surfaces", async () => {
    mockGetRequestLocale.mockResolvedValue("zh-Hans");

    const result = await getRequestConfig({
      locale: undefined,
      requestLocale: Promise.resolve(undefined),
    });

    expect(mockGetRequestLocale).toHaveBeenCalledTimes(1);
    expect(mockLoadMessages).toHaveBeenCalledWith("zh-Hans");
    expect(result.locale).toBe("zh-Hans");
  });
});
