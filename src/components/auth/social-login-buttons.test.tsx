import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { SocialLoginButtons } from "./social-login-buttons";
import { signIn } from "@/lib/auth/client";
import { redirectBrowserTo } from "@/lib/browser-redirect";

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/lib/auth/client", () => ({
  signIn: {
    social: jest.fn(),
  },
}));

jest.mock("@/lib/browser-redirect", () => ({
  redirectBrowserTo: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockSignIn = signIn as jest.Mocked<typeof signIn>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockRedirectBrowserTo = redirectBrowserTo as jest.MockedFunction<
  typeof redirectBrowserTo
>;

describe("SocialLoginButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the redirecting state until navigation starts", async () => {
    const handleLoadingChange = jest.fn();

    mockSignIn.social = jest.fn().mockResolvedValue({
      data: {
        url: "https://accounts.google.com/o/oauth2/auth",
      },
      error: null,
    });

    render(
      <SocialLoginButtons
        availableProviders={["google"]}
        onLoadingChange={handleLoadingChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Continue with Google/i }),
    );

    await waitFor(() => {
      expect(mockSignIn.social).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?callbackUrl=%2Fdashboard",
        disableRedirect: true,
      });
    });

    expect(handleLoadingChange).toHaveBeenCalledWith(true);
    expect(handleLoadingChange).not.toHaveBeenCalledWith(false);
    expect(mockRedirectBrowserTo).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/auth",
    );
  });

  it("clears loading and shows an error when provider initialization fails", async () => {
    const handleLoadingChange = jest.fn();

    mockSignIn.social = jest.fn().mockResolvedValue({
      data: null,
      error: {
        message: "OAuth provider is unavailable.",
      },
    });

    render(
      <SocialLoginButtons
        availableProviders={["github"]}
        onLoadingChange={handleLoadingChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Continue with GitHub/i }),
    );

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Something went wrong. Contact support if the issue persists",
      );
    });

    expect(handleLoadingChange).toHaveBeenCalledWith(true);
    expect(handleLoadingChange).toHaveBeenCalledWith(false);
    expect(mockRedirectBrowserTo).not.toHaveBeenCalled();
  });
});
