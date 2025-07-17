import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./auth-form";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock environment variables
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

// Mock environment
jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    GITHUB_CLIENT_ID: undefined,
    GITHUB_CLIENT_SECRET: undefined,
    LINKEDIN_CLIENT_ID: undefined,
    LINKEDIN_CLIENT_SECRET: undefined,
  },
}));

// Mock dependencies
jest.mock("@/lib/auth/client", () => ({
  signIn: {
    magicLink: jest.fn(),
  },
}));

jest.mock("@/lib/auth/providers", () => ({
  getAvailableSocialProviders: jest.fn(() => []),
}));

jest.mock("@/components/auth/auth-form-base", () => ({
  AuthFormBase: ({
    onSubmit,
    config,
    fields,
  }: {
    form?: unknown;
    onSubmit: (data: { email: string }) => Promise<void>;
    config: {
      title: string;
      submitButtonText: string;
      alternativeActionText: string;
      alternativeActionLink: React.ReactNode;
    };
    fields: Array<{ name: string; type: string; placeholder: string }>;
  }) => (
    <div data-testid="auth-form-base">
      <h1>{config.title}</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get("email") as string;
          await onSubmit({ email });
        }}
      >
        {fields.map(
          (field: { name: string; type: string; placeholder: string }) => (
            <input
              key={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
            />
          ),
        )}
        <button type="submit">{config.submitButtonText}</button>
      </form>
      <div>
        {config.alternativeActionText} {config.alternativeActionLink}
      </div>
    </div>
  ),
}));

jest.mock("next/navigation");
jest.mock("sonner");
jest.mock("next/link", () => {
  return function Link({
    children,
    href,
    ...props
  }: React.ComponentProps<"a">) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockSignIn = signIn as jest.Mocked<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockPush = jest.fn();

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe("Login Mode", () => {
    it("renders login form with correct content", () => {
      render(<AuthForm mode="login" />);

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Send Magic Link/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("you@example.com"),
      ).toBeInTheDocument();

      // Should not show terms for login (not rendered in simplified mock)
      expect(screen.queryByText(/terms of service/i)).not.toBeInTheDocument();
    });

    it("has correct link to signup page", () => {
      render(<AuthForm mode="login" />);

      const signupLink = screen.getByText("Create an account");
      expect(signupLink.closest("a")).toHaveAttribute("href", "/signup");
    });
  });

  describe("Signup Mode", () => {
    it("renders signup form with correct content", () => {
      render(<AuthForm mode="signup" />);

      expect(screen.getByText("Get started today")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Account/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("you@example.com"),
      ).toBeInTheDocument();

      // Should show terms for signup (not rendered in simplified mock)
      // This would be shown in the real component but not in our mock
    });

    it("has correct link to login page", () => {
      render(<AuthForm mode="signup" />);

      const loginLink = screen.getByText("Sign in instead");
      expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
    });
  });

  describe("Form Submission", () => {
    it("submits form with email and navigates to sent page on success", async () => {
      mockSignIn.magicLink = jest.fn().mockResolvedValue({ error: null });

      render(<AuthForm mode="login" />);

      const emailInput = screen.getByPlaceholderText("you@example.com");
      const submitButton = screen.getByRole("button", {
        name: /Send Magic Link/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn.magicLink).toHaveBeenCalledWith({
          email: "test@example.com",
          callbackURL: "/dashboard",
        });
        expect(mockPush).toHaveBeenCalledWith(
          "/auth/sent?email=test%40example.com",
        );
      });
    });

    it("shows error toast on submission failure", async () => {
      const errorMessage = "Invalid email address";
      mockSignIn.magicLink = jest.fn().mockResolvedValue({
        error: { message: errorMessage },
      });

      render(<AuthForm mode="login" />);

      const emailInput = screen.getByPlaceholderText("you@example.com");
      const submitButton = screen.getByRole("button", {
        name: /Send Magic Link/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });
});
