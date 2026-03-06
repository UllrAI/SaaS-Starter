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

const mockMetadata = { title: "mock signup metadata" };
const mockCreatePageMetadata = jest.fn(() => mockMetadata);
jest.mock("@/lib/i18n/page-metadata", () => ({
  createPageMetadata: (config: unknown) => mockCreatePageMetadata(config),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("creates localized metadata from signup page copy", async () => {
    const pageModule = await import("./page");

    expect(await pageModule.generateMetadata()).toBe(mockMetadata);
    expect(mockCreatePageMetadata).toHaveBeenCalledWith({
      title: expect.any(Function),
      description: expect.any(Function),
    });
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
});
