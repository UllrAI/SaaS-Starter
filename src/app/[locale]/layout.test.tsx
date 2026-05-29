import { render, screen } from "@testing-library/react";
import type React from "react";
import MarketingLayout, { generateStaticParams } from "./layout";

jest.mock("@/components/homepage/header", () => ({
  Header: () => <header data-testid="homepage-header">Header</header>,
}));

jest.mock("@/components/homepage/footer", () => ({
  Footer: () => <footer data-testid="homepage-footer">Footer</footer>,
}));

describe("MarketingLayout", () => {
  it("returns all locale params for the unified marketing route tree", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "en" },
      { locale: "zh-Hans" },
    ]);
  });

  it("renders the header, footer, and provided children", async () => {
    const childContent = <div data-testid="layout-child">Child content</div>;
    const ui = await MarketingLayout({
      children: childContent,
      params: Promise.resolve({ locale: "en" }),
    });

    const { container } = render(ui);

    expect(screen.getByTestId("homepage-header")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-footer")).toBeInTheDocument();
    expect(screen.getByTestId("layout-child")).toBeInTheDocument();

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("flex", "min-h-screen", "flex-col");

    const main = screen.getByRole("main");
    expect(main).toHaveClass("flex-1");
    expect(main).toContainElement(screen.getByTestId("layout-child"));
  });
});
