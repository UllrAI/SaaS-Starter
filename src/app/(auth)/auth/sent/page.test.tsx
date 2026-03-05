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

describe("MagicLinkSent page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("passes the provided email address to the description", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({ email: "test@example.com" }),
    });
    render(element);

    const card = screen.getByTestId("link-sent-card");
    expect(card).toHaveAttribute("data-title", "Check your email");
    expect(card).toHaveAttribute("data-retry-href", "/login");
    expect(card.textContent).toContain("test@example.com");
    expect(card.textContent).not.toContain("your email address");
  });

  it("falls back to generic copy when email is missing", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({}),
    });
    render(element);

    const card = screen.getByTestId("link-sent-card");
    expect(card.textContent).toContain("your email address");
  });
});
