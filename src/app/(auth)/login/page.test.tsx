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
const mockCreateLocalizedMetadata = jest.fn(() => mockMetadata);
jest.mock("@/lib/i18n/page-metadata", () => ({
  createLocalizedMetadata: (config: unknown) =>
    mockCreateLocalizedMetadata(config),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("creates localized metadata from login page copy", async () => {
    const pageModule = await import("./page");

    expect(await pageModule.generateMetadata()).toBe(mockMetadata);
    expect(mockCreateLocalizedMetadata).toHaveBeenCalledWith({
      en: {
        title: "Sign In",
        description: "Sign in to your account with magic link",
      },
      "zh-Hans": {
        title: "登录",
        description: "使用魔法链接登录您的账户",
      },
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
