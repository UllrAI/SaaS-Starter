import React from "react";
import { AppDocument } from "./app-document";

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

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

function getElementChildren(
  element: React.ReactElement<{ children?: React.ReactNode }>,
): React.ReactElement[] {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  );
}

describe("AppDocument", () => {
  it("initializes the document and provider from an explicit locale", () => {
    const root = AppDocument({
      children: <main data-testid="page-content">Page content</main>,
      locale: "zh-Hans",
      messages: { hello: "你好" },
    }) as React.ReactElement<{ lang: string; children: React.ReactNode }>;

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

    expect(root.type).toBe("html");
    expect(root.props.lang).toBe("zh-Hans");
    expect(intlProvider?.props.locale).toBe("zh-Hans");
    expect(intlProvider?.props.messages).toEqual({ hello: "你好" });

    const structuredDataScript = getElementChildren(
      body as React.ReactElement<{ children: React.ReactNode }>,
    ).find((child) => child.props.id === "website-structured-data");
    const structuredData = JSON.parse(
      structuredDataScript?.props.dangerouslySetInnerHTML.__html,
    );
    expect(structuredData["@graph"][1].inLanguage).toEqual(["en", "zh-Hans"]);
  });
});
