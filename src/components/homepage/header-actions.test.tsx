import { render, screen } from "@testing-library/react";

import { HeaderActions } from "./header-actions";

const mockUseSession = jest.fn();

jest.mock("@/lib/auth/client", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("@/components/locale-switcher", () => ({
  LocaleSwitcher: () => <button type="button">Locale</button>,
}));

jest.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <button type="button">Theme</button>,
}));

const labels = {
  dashboard: "Dashboard",
  getStarted: "Get Started",
  navigationMenu: "Navigation Menu",
  signIn: "Sign In",
  toggleMenu: "Toggle menu",
};

const navigationItems = [
  {
    id: "features",
    href: "/features",
    title: "Features",
  },
];

describe("HeaderActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows guest actions when the user is signed out", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<HeaderActions labels={labels} navigationItems={navigationItems} />);

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("shows the dashboard action when the user is signed in", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      isPending: false,
    });

    render(<HeaderActions labels={labels} navigationItems={navigationItems} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.queryByRole("link", { name: "Sign In" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Get Started" }),
    ).not.toBeInTheDocument();
  });

  it("keeps guest actions hidden while the session is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<HeaderActions labels={labels} navigationItems={navigationItems} />);

    expect(
      screen.queryByRole("link", { name: "Sign In" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Get Started" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });
});
