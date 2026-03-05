import { render, screen } from "@testing-library/react";
import type React from "react";

const mockAuthForm = jest.fn(
  ({
    mode,
    availableProviders,
    callbackURL,
  }: {
    mode: "login" | "signup";
    availableProviders?: string[];
    callbackURL?: string;
  }) => (
    <div
      data-testid="auth-form"
      data-mode={mode}
      data-provider-count={availableProviders?.length ?? 0}
      data-callback-url={callbackURL}
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
    const element = await pageModule.default({
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    expect(mockAuthForm).toHaveBeenCalledTimes(1);
    expect(mockAuthForm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mode: "login",
        availableProviders: mockProviders,
        callbackURL: "/dashboard",
      }),
    );
    expect(mockGetAvailableSocialProviders).toHaveBeenCalledTimes(1);
  });

  it("passes callbackUrl from search params to AuthForm", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({
        callbackUrl: "/dashboard/billing",
      }),
    });

    render(element);

    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "login",
        callbackURL: "/dashboard/billing",
      }),
    );
  });
});
