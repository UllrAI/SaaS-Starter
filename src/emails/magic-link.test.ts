import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { LOCALE_COOKIE_NAME, LOCALE_HEADER_NAME } from "@/lib/config/i18n-routing";

const mockSendEmail = jest.fn();
const mockUserAgent = jest.fn();
const mockRenderMagicLinkEmail = jest.fn();

describe("sendMagicLink", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-03-06T12:00:00.000Z"));
    mockSendEmail.mockResolvedValue(undefined);
    mockRenderMagicLinkEmail.mockImplementation(
      async ({
        copy,
        locale,
      }: {
        copy: {
          heading: string;
          deviceDetailsTitle?: string;
          deviceLine?: string;
          locationLine?: string;
        };
        locale: string;
      }) => ({
        html: `<html lang="${locale}">${copy.heading}</html>`,
        text: [
          copy.deviceDetailsTitle,
          copy.deviceLine,
          copy.locationLine,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    );
    mockUserAgent.mockReturnValue({
      browser: { name: undefined },
      os: { name: undefined },
      device: undefined,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function loadSendMagicLink() {
    jest.doMock("@/lib/email", () => ({
      sendEmail: mockSendEmail,
    }));
    jest.doMock("next/server", () => ({
      userAgent: mockUserAgent,
    }));
    jest.doMock("@/lib/config/constants", () => ({
      APP_NAME: "Starter App",
      COMPANY_NAME: "Starter Company",
    }));
    jest.doMock("./magic-link-email", () => {
      const actual = jest.requireActual("./magic-link-email");

      return {
        ...actual,
        renderMagicLinkEmail: mockRenderMagicLinkEmail,
      };
    });

    return require("./magic-link") as typeof import("./magic-link");
  }

  it("sends an English magic-link email without device details by default", async () => {
    const { sendMagicLink } = loadSendMagicLink();

    await sendMagicLink(
      "user@example.com",
      "https://example.com/auth/callback?token=test",
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    const [email, subject, body] = mockSendEmail.mock.calls[0] as [
      string,
      string,
      { html: string; text: string },
    ];

    expect(email).toBe("user@example.com");
    expect(subject).toBe("Your secure sign-in link for Starter App");
    expect(body.html).toContain('lang="en"');
    expect(body.html).toContain("Access your account securely");
    expect(body.text).not.toContain("Sign-in request details");
  });

  it("prefers the locale header and includes rendered device details", async () => {
    const { sendMagicLink } = loadSendMagicLink();

    mockUserAgent.mockReturnValue({
      browser: { name: "Safari" },
      os: { name: "iOS" },
      device: { type: "mobile" },
    });

    const request = {
      headers: new Headers({
        [LOCALE_HEADER_NAME]: "zh-CN",
        cookie: `${LOCALE_COOKIE_NAME}=en`,
        "cf-connecting-ip": "198.51.100.10, 198.51.100.11",
        "cf-ipcity": encodeURIComponent("San Francisco"),
        "cf-ipregioncode": "CA",
        "cf-ipcountry": "US",
      }),
    } as unknown as Request;

    await sendMagicLink(
      "user@example.com",
      "https://example.com/auth/callback?token=test",
      request,
    );

    const [, , body] = mockSendEmail.mock.calls[0] as [
      string,
      string,
      { html: string; text: string },
    ];

    expect(body.html).toContain('lang="zh-Hans"');
    expect(body.text).toContain("Sign-in request details");
    expect(body.text).toContain("Device: Safari on iOS");
    expect(body.text).toContain("Location: San Francisco, CA, US (approximate)");
  });

  it("falls back to Accept-Language when no explicit locale is present", async () => {
    const { sendMagicLink } = loadSendMagicLink();

    const request = {
      headers: new Headers({
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      }),
    } as unknown as Request;

    await sendMagicLink(
      "user@example.com",
      "https://example.com/auth/callback?token=test",
      request,
    );

    const [, , body] = mockSendEmail.mock.calls[0] as [
      string,
      string,
      { html: string; text: string },
    ];

    expect(body.html).toContain('lang="zh-Hans"');
  });

  it("logs and rethrows email delivery errors", async () => {
    const { sendMagicLink } = loadSendMagicLink();
    const error = new Error("Email provider unavailable");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockSendEmail.mockRejectedValue(error);

    await expect(
      sendMagicLink(
        "user@example.com",
        "https://example.com/auth/callback?token=test",
      ),
    ).rejects.toThrow("Email provider unavailable");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error sending magic link email with device info:",
      error,
    );

    consoleErrorSpy.mockRestore();
  });
});
