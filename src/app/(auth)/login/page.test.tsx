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
      rawDescription?: string | null;
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

const mockMetadata = { title: "mock metadata" };
const mockCreatePageMetadata = jest.fn(() => mockMetadata);
jest.mock("@/lib/i18n/page-metadata", () => ({
  createPageMetadata: (config: unknown) => mockCreatePageMetadata(config),
}));

const mockGetRequestLocale = jest.fn(async () => "en");
jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: () => mockGetRequestLocale(),
}));

jest.mock("@/lib/auth/feedback", () => ({
  AUTH_BANNED_MESSAGE: "AUTH_BANNED",
  resolveAuthFeedback: jest.fn(() => ({
    key: "banned",
    banReason: null,
  })),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("creates localized metadata from login page copy", async () => {
    const pageModule = await import("./page");

    expect(await pageModule.generateMetadata()).toBe(mockMetadata);
    expect(mockCreatePageMetadata).toHaveBeenCalledWith({
      title: expect.any(Function),
      description: expect.any(Function),
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

  it("passes auth feedback from search params to AuthForm", async () => {
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
});
