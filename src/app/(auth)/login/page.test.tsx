import { render, screen } from "@testing-library/react";
import type React from "react";

const mockAuthForm = jest.fn(
  ({
    mode,
    availableProviders,
    callbackURL,
    initialFeedback,
  }: {
    mode: "login" | "signup";
    availableProviders?: string[];
    callbackURL?: string;
    initialFeedback?: {
      key: string;
      banReason?: string | null;
    } | null;
  }) => (
    <div
      data-testid="auth-form"
      data-mode={mode}
      data-provider-count={availableProviders?.length ?? 0}
      data-callback-url={callbackURL}
      data-feedback-key={initialFeedback?.key ?? ""}
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

const mockCreateMetadata = jest.fn(() => ({}));
jest.mock("@/lib/metadata", () => ({
  createMetadata: (config: unknown) => mockCreateMetadata(config),
}));

const mockGetRequestLocale = jest.fn(async () => "en");
jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: () => mockGetRequestLocale(),
}));

const mockResolveAuthFeedback = jest.fn();
jest.mock("@/lib/auth/feedback", () => ({
  AUTH_BANNED_MESSAGE: "AUTH_BANNED",
  resolveAuthFeedback: (params: unknown) => mockResolveAuthFeedback(params),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockResolveAuthFeedback.mockReturnValue(null);
  });

  it("creates localized metadata from login page copy", async () => {
    const pageModule = await import("./page");

    await expect(pageModule.generateMetadata()).resolves.toMatchObject({
      title: "Sign In",
      description: "Sign in to your account with magic link",
    });
    expect(mockCreateMetadata).toHaveBeenCalledWith({});
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

  it("passes auth feedback from search params to AuthForm", async () => {
    mockResolveAuthFeedback.mockReturnValueOnce({
      key: "banned",
      banReason: null,
    });
    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({
        error: "banned",
        error_description: "AUTH_BANNED",
      }),
    });

    render(element);

    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        initialFeedback: {
          key: "banned",
          banReason: null,
        },
      }),
    );
  });

  it("normalizes array search params before resolving callback and feedback", async () => {
    mockResolveAuthFeedback.mockReturnValueOnce({
      key: "session_expired",
    });

    const pageModule = await import("./page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({
        callbackUrl: ["/dashboard/team", "/ignored"],
        authError: ["session_expired", "banned"],
        error: ["INVALID_TOKEN", "EXPIRED_TOKEN"],
        error_description: ["AUTH_BANNED", "ignored"],
      }),
    });

    render(element);

    expect(mockResolveAuthFeedback).toHaveBeenCalledWith({
      authError: "session_expired",
      error: "INVALID_TOKEN",
      errorDescription: "AUTH_BANNED",
    });
    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "/dashboard/team",
        initialFeedback: {
          key: "session_expired",
        },
      }),
    );
  });

  it("uses defaults when search params are omitted", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default({});

    render(element);

    expect(mockResolveAuthFeedback).toHaveBeenCalledWith({
      authError: undefined,
      error: undefined,
      errorDescription: undefined,
    });
    expect(mockAuthForm).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "/dashboard",
        initialFeedback: null,
      }),
    );
  });
});
