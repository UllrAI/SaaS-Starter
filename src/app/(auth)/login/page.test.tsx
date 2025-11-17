import { render, screen } from "@testing-library/react";
import type React from "react";

const mockAuthForm = jest.fn(
  ({
    mode,
    availableProviders,
  }: {
    mode: "login" | "signup";
    availableProviders?: string[];
  }) => (
    <div
      data-testid="auth-form"
      data-mode={mode}
      data-provider-count={availableProviders?.length ?? 0}
    >
      Auth form
    </div>
  ),
);

jest.mock("@/components/forms/auth-form", () => ({
  AuthForm: (props: React.ComponentProps<any>) => mockAuthForm(props),
}));

const mockProviders = ["github", "google"];
const mockGetAvailableSocialProviders = jest.fn(() => mockProviders);
jest.mock("@/lib/auth/providers", () => ({
  getAvailableSocialProviders: () => mockGetAvailableSocialProviders(),
}));

const mockMetadata = { title: "mock metadata" };
const mockCreateMetadata = jest.fn(() => mockMetadata);
jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => mockCreateMetadata(config),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("exports metadata created from login specific copy", async () => {
    const pageModule = await import("./page");

    expect(pageModule.metadata).toBe(mockMetadata);
    expect(mockCreateMetadata).toHaveBeenCalledWith({
      title: "Sign In",
      description: "Sign in to your account with magic link",
    });
  });

  it("renders the AuthForm with login mode and available providers", async () => {
    const pageModule = await import("./page");

    render(pageModule.default());

    expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    expect(mockAuthForm).toHaveBeenCalledTimes(1);
    expect(mockAuthForm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mode: "login",
        availableProviders: mockProviders,
      }),
    );
    expect(mockGetAvailableSocialProviders).toHaveBeenCalledTimes(1);
  });
});
