import React from "react";
import RootLayout from "./layout";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { loadLingoTranslations } from "@/lib/i18n/lingo-translations";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-sans" }),
  JetBrains_Mono: () => ({ variable: "font-mono" }),
}));

jest.mock("next/script", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"script">) => (
    <script {...props}>{children}</script>
  ),
}));

jest.mock("@/lib/i18n/lingo-provider", () => ({
  AppLingoProvider: ({
    children,
    initialLocale,
    initialTranslations,
  }: {
    children: React.ReactNode;
    initialLocale: string;
    initialTranslations: Record<string, string>;
  }) => (
    <div
      data-testid="lingo-provider"
      data-locale={initialLocale}
      data-translation-count={Object.keys(initialTranslations).length}
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

jest.mock("@/lib/i18n/lingo-translations", () => ({
  loadLingoTranslations: jest.fn(() => Promise.resolve({ hello: "你好" })),
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
const mockLoadLingoTranslations = loadLingoTranslations as jest.MockedFunction<
  typeof loadLingoTranslations
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
    mockLoadLingoTranslations.mockResolvedValue({ hello: "你好" });
  });

  it("initializes document and Lingo locale from the request", async () => {
    const root = (await RootLayout({
      children: <main data-testid="page-content">Page content</main>,
    })) as React.ReactElement<{ lang: string; children: React.ReactNode }>;

    const body = getElementChildren(root).find(
      (child) => child.type === "body",
    );
    expect(body).toBeDefined();

    const lingoProvider = getElementChildren(
      body as React.ReactElement<{ children: React.ReactNode }>,
    ).find(
      (child) =>
        React.isValidElement(child) && child.props.initialLocale === "zh-Hans",
    );

    expect(mockGetRequestLocale).toHaveBeenCalledTimes(1);
    expect(mockLoadLingoTranslations).toHaveBeenCalledWith("zh-Hans");
    expect(root.type).toBe("html");
    expect(root.props.lang).toBe("zh-Hans");
    expect(lingoProvider?.props.initialLocale).toBe("zh-Hans");
    expect(lingoProvider?.props.initialTranslations).toEqual({ hello: "你好" });
  });
});
