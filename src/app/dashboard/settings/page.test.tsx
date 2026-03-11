import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../_components/dashboard-page-wrapper", () => ({
  DashboardPageWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-wrapper">{children}</div>
  ),
}));

jest.mock("./_components/account-page", () => ({
  AccountPage: () => <div data-testid="account-page">Account</div>,
}));

jest.mock("./_components/appearance-page", () => ({
  AppearancePage: () => <div data-testid="appearance-page">Appearance</div>,
}));

jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => config,
}));

import SettingsPage, { generateMetadata } from "./page";

describe("Dashboard Settings Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports metadata for settings page", () => {
    expect(generateMetadata()).resolves.toMatchObject({
      title: "Settings",
      description: "Manage your account profile and dashboard appearance.",
    });
  });

  it("renders account, appearance, and developer access entry by default", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("settings-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("account-page")).toBeInTheDocument();
    expect(screen.getByTestId("appearance-page")).toBeInTheDocument();
    expect(screen.getByText("Developer Access")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open developer access/i }),
    ).toHaveAttribute("href", "/dashboard/developer");
  });
});
