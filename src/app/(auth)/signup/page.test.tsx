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

const mockProviders = ["linkedin"];
const mockGetAvailableSocialProviders = jest.fn(() => mockProviders);
jest.mock("@/lib/auth/providers", () => ({
  getAvailableSocialProviders: () => mockGetAvailableSocialProviders(),
}));

const mockMetadata = { title: "mock signup metadata" };
const mockCreateMetadata = jest.fn(() => mockMetadata);
jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => mockCreateMetadata(config),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("exports metadata created from signup copy", async () => {
    const pageModule = await import("./page");

    expect(pageModule.metadata).toBe(mockMetadata);
    expect(mockCreateMetadata).toHaveBeenCalledWith({
      title: "Sign Up",
      description: "Create your account with magic link",
    });
  });

  it("renders AuthForm in signup mode with providers", async () => {
    const pageModule = await import("./page");

    render(pageModule.default());

    expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    expect(mockAuthForm).toHaveBeenCalledTimes(1);
    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "signup",
        availableProviders: mockProviders,
      }),
    );
    expect(mockGetAvailableSocialProviders).toHaveBeenCalledTimes(1);
  });
});
