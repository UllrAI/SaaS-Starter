import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../_components/dashboard-page-wrapper", () => ({
  DashboardPageWrapper: ({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
  }) => (
    <div data-testid="developer-access-wrapper">
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

jest.mock("./_components/developer-access-sections", () => ({
  DeveloperAccessSections: () => (
    <div data-testid="developer-access-sections">Developer sections</div>
  ),
}));

jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => config,
}));

import DeveloperAccessPage, { generateMetadata } from "./page";

describe("Dashboard Developer Access Page", () => {
  it("exports metadata for developer access page", () => {
    expect(generateMetadata()).resolves.toMatchObject({
      title: "Developer Access",
      description:
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    });
  });

  it("renders the dedicated developer access workspace", () => {
    render(<DeveloperAccessPage />);

    expect(screen.getByTestId("developer-access-wrapper")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Developer Access" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage API keys, CLI sessions, and agent-friendly access from one place.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("developer-access-sections"),
    ).toBeInTheDocument();
  });
});
