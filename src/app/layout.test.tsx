import React from "react";
import RootLayout from "./layout";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadMessages } from "@/lib/i18n/messages";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-sans" }),
  JetBrains_Mono: () => ({ variable: "font-mono" }),
}));

jest.mock("@/lib/i18n/provider", () => ({
  AppIntlProvider: ({
    children,
    locale,
    messages,
  }: {
    children: React.ReactNode;
    locale: string;
    messages: Record<string, string>;
  }) => (
    <div
      data-testid="intl-provider"
      data-locale={locale}
      data-translation-count={Object.keys(messages).length}
    >
      {children}
    </div>
  ),
}));

jest.mock("@/components/app-providers", () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: jest.fn(() => Promise.resolve("zh-Hans")),
}));

jest.mock("@/lib/i18n/messages", () => ({
  loadMessages: jest.fn(() => Promise.resolve({ hello: "你好" })),
}));

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

const mockGetRequestLocale = getRequestLocale as jest.MockedFunction<
  typeof getRequestLocale
>;
const mockLoadMessages = loadMessages as jest.MockedFunction<
  typeof loadMessages
>;

function getElementChildren(
  element: React.ReactElement<{ children?: React.ReactNode }>,
): React.ReactElement[] {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  );
}

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestLocale.mockResolvedValue("zh-Hans");
    mockLoadMessages.mockResolvedValue({ hello: "你好" });
  });

  it("initializes document and next-intl locale from the request", async () => {
    const root = (await RootLayout({
      children: <main data-testid="page-content">Page content</main>,
    })) as React.ReactElement<{ lang: string; children: React.ReactNode }>;

    const body = getElementChildren(root).find(
      (child) => child.type === "body",
    );
    expect(body).toBeDefined();

    const intlProvider = getElementChildren(
      body as React.ReactElement<{ children: React.ReactNode }>,
    ).find(
      (child) =>
        React.isValidElement(child) && child.props.locale === "zh-Hans",
    );

    expect(mockGetRequestLocale).toHaveBeenCalledTimes(1);
    expect(mockLoadMessages).toHaveBeenCalledWith("zh-Hans");
    expect(root.type).toBe("html");
    expect(root.props.lang).toBe("zh-Hans");
    expect(intlProvider?.props.locale).toBe("zh-Hans");
    expect(intlProvider?.props.messages).toEqual({ hello: "你好" });
  });
});
