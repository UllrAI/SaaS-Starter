import { render, screen } from "@testing-library/react";
import AuthLayout from "./layout";
import { APP_NAME } from "@/lib/config/constants";

// Mock the Logo component
jest.mock("@/components/logo", () => ({
  Logo: ({ className }: { className?: string }) => (
    <div data-testid="logo" className={className}>
      Logo
    </div>
  ),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className} data-testid="link">
        {children}
      </a>
    );
  };
});

describe("AuthLayout", () => {
  it("renders the layout with all required elements", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    render(<AuthLayout>{testContent}</AuthLayout>);

    // Check if the main container is rendered
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass(
      "relative",
      "flex",
      "min-h-screen",
      "flex-col",
      "items-center",
      "justify-center",
      "overflow-hidden",
      "bg-background",
    );

    // Check if children are rendered
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("renders the back to home button", () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>,
    );

    const backButton = screen.getByText("Back to Home");
    expect(backButton).toBeInTheDocument();

    const backLink = backButton.closest("a");
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders the logo and brand name", () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>,
    );

    // Check if logo is rendered
    expect(screen.getByTestId("logo")).toBeInTheDocument();

    // Check if brand name is rendered
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();

    // Check if the logo link points to home
    const logoContainer = screen.getByText(APP_NAME).closest("a");
    expect(logoContainer).toHaveAttribute("href", "/");
  });

  it("renders background patterns", () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>,
    );

    const mainElement = screen.getByRole("main");

    // Check if background pattern container exists
    const backgroundContainer = mainElement.querySelector(
      ".absolute.inset-0.-z-10",
    );
    expect(backgroundContainer).toBeInTheDocument();
  });

  it("renders children in the correct container", () => {
    const testContent = <div data-testid="child-content">Child Content</div>;

    render(<AuthLayout>{testContent}</AuthLayout>);

    const childContent = screen.getByTestId("child-content");
    expect(childContent).toBeInTheDocument();

    // Check if children are in the correct wrapper
    const wrapper = childContent.closest(".relative.w-full.max-w-md.px-6");
    expect(wrapper).toBeInTheDocument();
  });
});
