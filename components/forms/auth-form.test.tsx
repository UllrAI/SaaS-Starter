import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./auth-form";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock environment variables
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

// Mock dependencies
jest.mock("@/lib/auth/client", () => ({
  signIn: {
    magicLink: jest.fn(),
  },
}));
jest.mock("next/navigation");
jest.mock("sonner");
jest.mock("next/link", () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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

      expect(
        screen.getByRole("button", { name: /send login link/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email address"),
      ).toBeInTheDocument();

      // Should not show terms for login
      expect(screen.queryByText(/terms of service/i)).not.toBeInTheDocument();
    });

    it("has correct link to signup page", () => {
      render(<AuthForm mode="login" />);

      const signupLink = screen.getByText("Create one now");
      expect(signupLink.closest("a")).toHaveAttribute("href", "/signup");
    });
  });

  describe("Signup Mode", () => {
    it("renders signup form with correct content", () => {
      render(<AuthForm mode="signup" />);

      expect(
        screen.getByRole("button", { name: /send signup link/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email address"),
      ).toBeInTheDocument();

      // Should show terms for signup
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    });

    it("has correct link to login page", () => {
      render(<AuthForm mode="signup" />);

      const loginLink = screen.getByText("Sign in here");
      expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
    });
  });

  describe("Form Submission", () => {
    it("submits form with email and navigates to sent page on success", async () => {
      mockSignIn.magicLink = jest.fn().mockResolvedValue({ error: null });

      render(<AuthForm mode="login" />);

      const emailInput = screen.getByPlaceholderText(
        "Enter your email address",
      );
      const submitButton = screen.getByRole("button", {
        name: /send login link/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn.magicLink).toHaveBeenCalledWith({
          email: "test@example.com",
          callbackURL: "/dashboard",
        });
        expect(mockPush).toHaveBeenCalledWith("/auth/sent");
      });
    });

    it("shows error toast on submission failure", async () => {
      const errorMessage = "Invalid email address";
      mockSignIn.magicLink = jest.fn().mockResolvedValue({
        error: { message: errorMessage },
      });

      render(<AuthForm mode="login" />);

      const emailInput = screen.getByPlaceholderText(
        "Enter your email address",
      );
      const submitButton = screen.getByRole("button", {
        name: /send login link/i,
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
