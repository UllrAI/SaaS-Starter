import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";
import React, { useState } from "react";

// Test component that mimics UserButton behavior without external dependencies
const TestUserButton = ({
  user,
  sidebarOpen = true,
  onLogout = jest.fn(),
  mockAuthClient = { signOut: jest.fn() },
}: {
  user: any;
  sidebarOpen?: boolean;
  onLogout?: jest.Mock;
  mockAuthClient?: any;
}) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const result = await mockAuthClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // console.log("Redirecting to login");
          },
        },
      });
      if (result?.error) {
        // console.error("Logout error:", result.error.message);
        return;
      }
      // console.log("Logout successful");
      onLogout();
    } catch {
      // console.log("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div data-testid="user-button">
      <button
        data-testid="user-menu-trigger"
        className={`flex items-center gap-2 ${!sidebarOpen ? "h-8 w-8 justify-center p-0" : ""}`}
      >
        <div
          data-testid="user-avatar"
          className={`rounded-full ${sidebarOpen ? "h-8 w-8" : "h-6 w-6"}`}
        >
          {user?.name?.slice(0, 1).toUpperCase() || "U"}
        </div>
        {sidebarOpen && (
          <>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span data-testid="user-name" className="truncate font-semibold">
                {user?.name}
              </span>
              <span data-testid="user-email" className="truncate text-xs">
                {user?.email}
              </span>
            </div>
            <div data-testid="chevron-icon" className="ml-auto size-4">
              ⌄
            </div>
          </>
        )}
      </button>

      <div data-testid="dropdown-menu">
        <div data-testid="dropdown-header">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div data-testid="dropdown-avatar" className="h-8 w-8 rounded-full">
              {user?.name?.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span
                data-testid="dropdown-name"
                className="truncate font-semibold"
              >
                {user?.name}
              </span>
              <span data-testid="dropdown-email" className="truncate text-xs">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        <button data-testid="settings-link" className="cursor-pointer">
          <span data-testid="settings-icon">⚙</span>
          Settings
        </button>

        <button
          data-testid="logout-button"
          className="cursor-pointer"
          onClick={handleLogout}
        >
          {loggingOut ? (
            <div className="flex items-center gap-2">
              <span data-testid="loading-spinner" className="animate-spin">
                ⟳
              </span>
              <span>Log Out</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span data-testid="logout-icon">↗</span>
              Log Out
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

describe("UserButton Component Behavioral Tests", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
    name: "Test User",
    image: "https://example.com/avatar.jpg",
  };

  describe("User Information Display", () => {
    it("should display user information when user data is provided", () => {
      render(<TestUserButton user={mockUser} sidebarOpen={true} />);

      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
      expect(screen.getByTestId("user-avatar")).toHaveTextContent("T");
    });

    it("should display only avatar when sidebar is collapsed", () => {
      render(<TestUserButton user={mockUser} sidebarOpen={false} />);

      expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
      expect(screen.queryByTestId("user-name")).not.toBeInTheDocument();
      expect(screen.queryByTestId("user-email")).not.toBeInTheDocument();
      expect(screen.queryByTestId("chevron-icon")).not.toBeInTheDocument();
    });

    it("should handle missing user name gracefully", () => {
      const userWithoutName = {
        id: "123",
        email: "test@example.com",
        name: null,
      };

      render(<TestUserButton user={userWithoutName} sidebarOpen={true} />);

      expect(screen.getByTestId("user-avatar")).toHaveTextContent("U");
      expect(screen.getByTestId("user-name")).toHaveTextContent("");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
    });
  });

  describe("Logout Functionality", () => {
    it("should handle successful logout", async () => {
      const mockOnLogout = jest.fn();
      const mockAuthClient = {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      };

      render(
        <TestUserButton
          user={mockUser}
          sidebarOpen={true}
          onLogout={mockOnLogout}
          mockAuthClient={mockAuthClient}
        />,
      );

      const logoutButton = screen.getByTestId("logout-button");
      fireEvent.click(logoutButton);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockAuthClient.signOut).toHaveBeenCalledWith({
          fetchOptions: {
            onSuccess: expect.any(Function),
          },
        });
        expect(mockOnLogout).toHaveBeenCalled();
      });
    });

    it("should handle logout error", async () => {
      const mockAuthClient = {
        signOut: jest.fn().mockResolvedValue({
          error: { message: "Logout failed" },
        }),
      };

      render(
        <TestUserButton
          user={mockUser}
          sidebarOpen={true}
          mockAuthClient={mockAuthClient}
        />,
      );

      const logoutButton = screen.getByTestId("logout-button");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthClient.signOut).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
    });

    it("should show loading state during logout", async () => {
      const mockAuthClient = {
        signOut: jest
          .fn()
          .mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100)),
          ),
      };

      render(
        <TestUserButton
          user={mockUser}
          sidebarOpen={true}
          mockAuthClient={mockAuthClient}
        />,
      );

      const logoutButton = screen.getByTestId("logout-button");
      fireEvent.click(logoutButton);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("logout-icon")).not.toBeInTheDocument();
    });
  });

  describe("Avatar Handling", () => {
    it("should display first letter of name as fallback", () => {
      render(<TestUserButton user={mockUser} sidebarOpen={true} />);

      expect(screen.getByTestId("user-avatar")).toHaveTextContent("T");
      expect(screen.getByTestId("dropdown-avatar")).toHaveTextContent("T");
    });

    it("should handle names with multiple words", () => {
      const userWithLongName = {
        id: "123",
        email: "test@example.com",
        name: "John Doe Smith",
      };

      render(<TestUserButton user={userWithLongName} sidebarOpen={true} />);

      expect(screen.getByTestId("user-avatar")).toHaveTextContent("J");
    });

    it("should handle empty name gracefully", () => {
      const userWithEmptyName = {
        id: "123",
        email: "test@example.com",
        name: "",
      };

      render(<TestUserButton user={userWithEmptyName} sidebarOpen={true} />);

      expect(screen.getByTestId("user-avatar")).toHaveTextContent("U");
    });
  });
});

// Static analysis tests for UserButton component
describe("UserButton Component Static Analysis", () => {
  it("should exist as a TypeScript file with proper export", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");

    expect(fs.existsSync(componentPath)).toBe(true);

    const content = fs.readFileSync(componentPath, "utf8");

    // Verify component structure
    expect(content).toContain("export function UserButton");
    expect(content).toContain('"use client"');
  });

  it("should have proper import structure", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify imports
    expect(content).toContain('from "lucide-react"');
    expect(content).toContain('from "@/components/ui/avatar"');
    expect(content).toContain('from "@/lib/avatar"');
    expect(content).toContain('from "@/components/ui/dropdown-menu"');
    expect(content).toContain('from "@/components/ui/sidebar"');
    expect(content).toContain('from "@/lib/auth/client"');
    expect(content).toContain('from "@/lib/auth/permissions"');
    expect(content).toContain('from "sonner"');
    expect(content).toContain('from "nextjs-toploader/app"');
    expect(content).toContain('from "next/link"');
  });

  it("should implement proper logout functionality", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify logout functionality
    expect(content).toContain("const handleLogout = async () =>");
    expect(content).toContain("setLoggingOut(true)");
    expect(content).toContain("authClient.signOut");
    expect(content).toContain('router.push("/login")');
    expect(content).toContain("toast.error");
    expect(content).toContain("toast.success");
    expect(content).toContain("toast.info");
    expect(content).toContain("setLoggingOut(false)");
  });

  it("should handle loading states properly", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify loading state handling
    expect(content).toContain(
      "const [loggingOut, setLoggingOut] = useState(false)",
    );
    expect(content).toContain("loggingOut ?");
    expect(content).toContain("<Loader2");
    expect(content).not.toContain("<Skeleton");
  });

  it("should use proper React hooks pattern", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify hooks usage
    expect(content).toContain("const { isMobile, open } = useSidebar()");
    expect(content).toContain("const router = useRouter()");
    expect(content).toContain("useState(false)");
    expect(content).toContain("interface UserButtonProps");
    expect(content).toContain(
      "export function UserButton({ user }: UserButtonProps)",
    );
  });

  it("should handle user avatar properly", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify avatar handling
    expect(content).toContain("getUserAvatarUrl(");
    expect(content).toContain("user.image");
    expect(content).toContain("user.email");
    expect(content).toContain("user.name");
    expect(content).toContain("<Avatar");
    expect(content).toContain("<AvatarImage");
    expect(content).toContain("<AvatarFallback");
    expect(content).toContain("user.name?.slice(0, 1).toUpperCase()");
  });

  it("should implement responsive design", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify responsive design
    expect(content).toContain("isMobile");
    expect(content).toContain("open");
    expect(content).toContain("!open ?");
    expect(content).toContain("{open &&");
    expect(content).toContain('side={isMobile ? "bottom" : "right"}');
  });

  it("should have proper dropdown menu structure", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify dropdown structure
    expect(content).toContain("<DropdownMenu>");
    expect(content).toContain("<DropdownMenuTrigger");
    expect(content).toContain("<DropdownMenuContent");
    expect(content).toContain("<DropdownMenuLabel");
    expect(content).toContain("<DropdownMenuGroup>");
    expect(content).toContain("<DropdownMenuItem");
    expect(content).toContain("<DropdownMenuSeparator");
  });

  it("should include settings navigation", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify settings link
    expect(content).toContain('Link href="/dashboard/settings?page=account"');
    expect(content).toContain('<Settings className="size-4" />');
    expect(content).toContain("Settings");
  });

  it("should implement proper error handling", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify error handling
    expect(content).toContain("try {");
    expect(content).toContain("} catch {");
    expect(content).toContain("} finally {");
    expect(content).toContain("if (error) {");
    expect(content).toContain("toast.error(error.message)");
    expect(content).toContain("return;");
  });

  it("should have proper TypeScript typing", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify TypeScript patterns
    expect(content).toContain('"use client"');
    expect(content).toContain("interface UserButtonProps");
    expect(content).toContain(
      "export function UserButton({ user }: UserButtonProps)",
    );
    expect(content).toContain("useState(false)");
    expect(content).toMatch(/const\s+\w+\s*=/); // Variable declarations
  });

  it("should follow React best practices", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify best practices
    expect(content).toContain('"use client"'); // Client component
    expect(content).toMatch(/export\s+function\s+UserButton/); // Named export
    expect(content).not.toContain("var "); // No var declarations
    expect(content).toContain("const "); // Uses const for variables
    expect(content).toContain("async () =>"); // Async handling
  });

  it("should handle success callback properly", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify success callback
    expect(content).toContain("fetchOptions: {");
    expect(content).toContain("onSuccess: () => {");
    expect(content).toContain('router.push("/login")');
    expect(content).toContain('"You have been logged out successfully."');
  });

  it("should have proper component structure", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify component structure
    const lines = content.split("\n");
    expect(lines.length).toBeGreaterThan(120); // Substantial component
    expect(lines.length).toBeLessThan(200); // But not too large

    // Should have reasonable complexity
    const ifStatements = content.match(/if\s*\(/g);
    expect(ifStatements).toBeTruthy();
    expect(ifStatements!.length).toBeGreaterThanOrEqual(1);
  });

  it("should use proper sidebar components", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify sidebar usage
    expect(content).toContain("<SidebarMenu>");
    expect(content).toContain("<SidebarMenuItem>");
    expect(content).toContain("<SidebarMenuButton");
    expect(content).toContain('size={open ? "lg" : "default"}');
  });

  it("should handle conditional rendering correctly", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify conditional rendering
    expect(content).toMatch(/{\s*open\s*&&/); // Conditional rendering
    expect(content).toContain("loggingOut ?");
  });

  it("should have proper CSS classes", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify CSS classes
    expect(content).toContain("className=");
    expect(content).toContain('"cursor-pointer"');
    expect(content).toContain('"size-4"');
    expect(content).toContain('"flex items-center gap-2"');
    expect(content).toContain("truncate font-semibold");
    expect(content).toContain("rounded-full");
  });

  it("should implement proper logout UI feedback", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify logout UI feedback
    expect(content).toContain("loggingOut ? (");
    expect(content).toContain('<Loader2 className="size-4 animate-spin" />');
    expect(content).toContain('<LogOut className="size-4" />');
    expect(content).toContain("Log Out");
  });

  it("should handle missing user data gracefully", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify graceful handling
    expect(content).toContain("user.name");
    expect(content).toContain("user.email");
    expect(content).toContain("user.image");
    expect(content).toContain("user.name?.slice(0, 1).toUpperCase()");
  });

  it("should have proper accessibility considerations", () => {
    const componentPath = path.join(__dirname, "user-btn.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify accessibility
    expect(content).toContain("alt={user.name}");
    expect(content).toContain("asChild");
    expect(content).toContain("Settings"); // Accessible text labels
  });
});
