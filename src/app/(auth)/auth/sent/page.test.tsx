import { render, screen } from "@testing-library/react";
import type React from "react";

const mockLinkSentCard = jest.fn(
  ({
    title,
    description,
    retryHref,
  }: {
    title: string;
    description: React.ReactNode;
    retryHref: string;
  }) => (
    <div
      data-testid="link-sent-card"
      data-title={title}
      data-retry-href={retryHref}
    >
      {description}
    </div>
  ),
);

jest.mock("@/components/auth/link-sent-card", () => ({
  LinkSentCard: (props: React.ComponentProps<any>) => mockLinkSentCard(props),
}));

jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-user-locale": "en" }),
  cookies: async () => ({ get: () => undefined }),
}));

describe("MagicLinkSent page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("uses generic copy without exposing an email address in the URL", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default();
    render(element);

    const card = screen.getByTestId("link-sent-card");
    expect(card).toHaveAttribute("data-title", "Check your email");
    expect(card).toHaveAttribute("data-retry-href", "/login");
    expect(card.textContent).toContain("your email address");
  });
});
