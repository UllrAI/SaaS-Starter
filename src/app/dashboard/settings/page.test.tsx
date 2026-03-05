import React from "react";
import { render, screen } from "@testing-library/react";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

jest.mock("../_components/dashboard-page-wrapper", () => ({
  DashboardPageWrapper: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="settings-wrapper">{children}</div>,
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

import SettingsPage, { metadata } from "./page";

describe("Dashboard Settings Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT: ${url}`);
    });
  });

  it("exports metadata for settings page", () => {
    expect(metadata).toMatchObject({
      title: "Settings",
      description: "Manage your account profile and dashboard appearance.",
    });
  });

  it("renders account and appearance sections by default", async () => {
    const element = await SettingsPage({
      searchParams: Promise.resolve({}),
    });

    render(element);
    expect(screen.getByTestId("settings-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("account-page")).toBeInTheDocument();
    expect(screen.getByTestId("appearance-page")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("keeps rendering settings content for unknown legacy query", async () => {
    const element = await SettingsPage({
      searchParams: Promise.resolve({ page: "unknown" }),
    });

    render(element);
    expect(screen.getByTestId("settings-wrapper")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects legacy billing query to new billing route", async () => {
    await expect(
      SettingsPage({
        searchParams: Promise.resolve({ page: "billing" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT: /dashboard/billing");

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/billing");
  });

  it("redirects legacy account query to unified settings route", async () => {
    await expect(
      SettingsPage({
        searchParams: Promise.resolve({ page: "account" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT: /dashboard/settings");

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/settings");
  });
});
