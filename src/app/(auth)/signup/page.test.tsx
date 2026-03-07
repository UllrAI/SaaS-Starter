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

const mockProviders = ["linkedin"];
const mockGetAvailableSocialProviders = jest.fn(() => mockProviders);
jest.mock("@/lib/auth/providers", () => ({
  getAvailableSocialProviders: () => mockGetAvailableSocialProviders(),
}));

const mockCreateMetadata = jest.fn(() => ({}));
jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => mockCreateMetadata(config),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("creates localized metadata from signup page copy", async () => {
    const pageModule = await import("./page");

    await expect(pageModule.generateMetadata()).resolves.toMatchObject({
      title: "Sign Up",
      description: "Create your account with magic link",
    });
    expect(mockCreateMetadata).toHaveBeenCalledWith({});
  });

  it("renders AuthForm in signup mode with providers", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    expect(mockAuthForm).toHaveBeenCalledTimes(1);
    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "signup",
        availableProviders: mockProviders,
        callbackURL: "/dashboard",
      }),
    );
    expect(mockGetAvailableSocialProviders).toHaveBeenCalledTimes(1);
  });

  it("passes callbackUrl from search params to signup AuthForm", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({
        callbackUrl: "/dashboard/upload",
      }),
    });

    render(element);

    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "signup",
        callbackURL: "/dashboard/upload",
      }),
    );
  });

  it("uses the first callbackUrl when search params contain repeated values", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({
        callbackUrl: ["/dashboard/team", "/dashboard/ignored"],
      }),
    });

    render(element);

    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "signup",
        callbackURL: "/dashboard/team",
      }),
    );
  });

  it("falls back to the default callback when search params are omitted", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({});

    render(element);

    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "signup",
        callbackURL: "/dashboard",
      }),
    );
  });
});
