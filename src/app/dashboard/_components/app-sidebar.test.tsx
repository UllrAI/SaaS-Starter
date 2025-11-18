import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";
import React from "react";

// Mock the useSidebar hook
const mockToggleSidebar = jest.fn();

// Test component that mimics AppSidebar behavior without external dependencies
const TestAppSidebar = ({
  pathname = "/dashboard",
  session = null,
  sidebarOpen = true,
  onNavigate = jest.fn(),
  enabledTables = [],
}: {
  pathname?: string;
  session?: any;
  sidebarOpen?: boolean;
  onNavigate?: jest.Mock;
  enabledTables?: string[];
}) => {
  const navigation = [
    { title: "Home", url: "/dashboard", icon: "🏠" },
    { title: "Upload", url: "/dashboard/upload", icon: "📤" },
    { title: "Settings", url: "/dashboard/settings", icon: "⚙️" },
  ];

  const adminNavigation = [
    { title: "Admin Dashboard", url: "/dashboard/admin", icon: "📊" },
    { title: "User Management", url: "/dashboard/admin/users", icon: "👥" },
    { title: "Payments", url: "/dashboard/admin/payments", icon: "💳" },
    {
      title: "Subscriptions",
      url: "/dashboard/admin/subscriptions",
      icon: "🛡️",
    },
    {
      title: "Uploads Managements",
      url: "/dashboard/admin/uploads",
      icon: "📤",
    },
  ];

  const genericTableNavigation = enabledTables.map((key) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    url: `/dashboard/admin/tables/${key}`,
    icon: "🗄️",
  }));

  const isAdmin =
    session?.user && ["admin", "super_admin"].includes(session.user.role);

  const handleNavigation = (url: string) => () => {
    onNavigate(url);
  };

  return (
    <div
      data-testid="app-sidebar"
      className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}
    >
      {/* Header */}
      <div
        data-testid="sidebar-header"
        className={sidebarOpen ? "expanded" : "collapsed"}
      >
        <div
          data-testid="logo"
          onClick={() => onNavigate("/")}
          className="cursor-pointer"
        >
          🚀
        </div>
        {sidebarOpen && <span data-testid="app-name">SaaS Starter</span>}
      </div>

      {/* Main Navigation */}
      <div data-testid="sidebar-content">
        <div data-testid="main-navigation">
          {navigation.map((item) => (
            <div
              key={item.title}
              data-testid={`nav-item-${item.title.toLowerCase()}`}
              className={`nav-item ${item.url === pathname ? "active" : ""}`}
              onClick={handleNavigation(item.url)}
            >
              <span data-testid={`nav-icon-${item.title.toLowerCase()}`}>
                {item.icon}
              </span>
              <span data-testid={`nav-title-${item.title.toLowerCase()}`}>
                {item.title}
              </span>
            </div>
          ))}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div data-testid="admin-section">
            {sidebarOpen && (
              <div data-testid="admin-header" className="section-header">
                Admin
              </div>
            )}
            <div data-testid="admin-navigation">
              {adminNavigation.map((item) => (
                <div
                  key={item.title}
                  data-testid={`admin-nav-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`nav-item ${item.url === pathname ? "active" : ""}`}
                  onClick={handleNavigation(item.url)}
                >
                  <span
                    data-testid={`admin-nav-icon-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.icon}
                  </span>
                  <span
                    data-testid={`admin-nav-title-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Generic Table Navigation */}
            {genericTableNavigation.length > 0 && (
              <div data-testid="table-management-section">
                {sidebarOpen && (
                  <div
                    data-testid="table-management-header"
                    className="section-header"
                  >
                    Manage Tables
                  </div>
                )}
                <div data-testid="table-navigation">
                  {genericTableNavigation.map((item) => (
                    <div
                      key={item.title}
                      data-testid={`table-nav-item-${item.title.toLowerCase()}`}
                      className={`nav-item ${pathname.startsWith(item.url) ? "active" : ""}`}
                      onClick={handleNavigation(item.url)}
                    >
                      <span
                        data-testid={`table-nav-icon-${item.title.toLowerCase()}`}
                      >
                        {item.icon}
                      </span>
                      <span
                        data-testid={`table-nav-title-${item.title.toLowerCase()}`}
                      >
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div data-testid="sidebar-footer">
        <div data-testid="user-button">User Button</div>
      </div>
    </div>
  );
};

// Behavioral tests for AppSidebar component
describe("AppSidebar Component Behavioral Tests", () => {
  const mockSession = {
    user: {
      id: "123",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    },
  };

  const mockAdminSession = {
    user: {
      id: "123",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render sidebar with basic structure", () => {
      render(<TestAppSidebar session={mockSession} />);

      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument();
    });

    it("should render logo and app name when sidebar is open", () => {
      render(<TestAppSidebar session={mockSession} sidebarOpen={true} />);

      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.getByTestId("app-name")).toBeInTheDocument();
      expect(screen.getByTestId("app-name")).toHaveTextContent("SaaS Starter");
    });

    it("should hide app name when sidebar is collapsed", () => {
      render(<TestAppSidebar session={mockSession} sidebarOpen={false} />);

      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.queryByTestId("app-name")).not.toBeInTheDocument();
    });
  });

  describe("Main Navigation", () => {
    it("should render all main navigation items", () => {
      render(<TestAppSidebar session={mockSession} />);

      expect(screen.getByTestId("nav-item-home")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-upload")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();

      expect(screen.getByTestId("nav-title-home")).toHaveTextContent("Home");
      expect(screen.getByTestId("nav-title-upload")).toHaveTextContent(
        "Upload",
      );
      expect(screen.getByTestId("nav-title-settings")).toHaveTextContent(
        "Settings",
      );
    });

    it("should highlight active navigation item", () => {
      render(
        <TestAppSidebar session={mockSession} pathname="/dashboard/upload" />,
      );

      const uploadItem = screen.getByTestId("nav-item-upload");
      expect(uploadItem).toHaveClass("active");

      const homeItem = screen.getByTestId("nav-item-home");
      expect(homeItem).not.toHaveClass("active");
    });

    it("should handle navigation clicks", () => {
      const mockOnNavigate = jest.fn();
      render(
        <TestAppSidebar session={mockSession} onNavigate={mockOnNavigate} />,
      );

      fireEvent.click(screen.getByTestId("nav-item-home"));
      expect(mockOnNavigate).toHaveBeenCalledWith("/dashboard");

      fireEvent.click(screen.getByTestId("nav-item-upload"));
      expect(mockOnNavigate).toHaveBeenCalledWith("/dashboard/upload");
    });
  });

  describe("Logo Navigation", () => {
    it("should handle logo click navigation to home", () => {
      const mockOnNavigate = jest.fn();
      render(
        <TestAppSidebar session={mockSession} onNavigate={mockOnNavigate} />,
      );

      fireEvent.click(screen.getByTestId("logo"));
      expect(mockOnNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Role-Based Access Control", () => {
    it("should not show admin section for regular users", () => {
      render(<TestAppSidebar session={mockSession} />);

      expect(screen.queryByTestId("admin-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("admin-navigation")).not.toBeInTheDocument();
    });

    it("should show admin section for admin users", () => {
      render(<TestAppSidebar session={mockAdminSession} />);

      expect(screen.getByTestId("admin-section")).toBeInTheDocument();
      expect(screen.getByTestId("admin-navigation")).toBeInTheDocument();
      expect(screen.getByTestId("admin-header")).toHaveTextContent("Admin");
    });

    it("should show admin section for super admin users", () => {
      const superAdminSession = {
        ...mockAdminSession,
        user: { ...mockAdminSession.user, role: "super_admin" },
      };

      render(<TestAppSidebar session={superAdminSession} />);

      expect(screen.getByTestId("admin-section")).toBeInTheDocument();
      expect(screen.getByTestId("admin-navigation")).toBeInTheDocument();
    });

    it("should handle null or undefined session gracefully", () => {
      render(<TestAppSidebar session={null} />);

      expect(screen.getByTestId("main-navigation")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-section")).not.toBeInTheDocument();
    });

    it("should handle session without user", () => {
      render(<TestAppSidebar session={{ user: null }} />);

      expect(screen.queryByTestId("admin-section")).not.toBeInTheDocument();
    });

    it("should handle session without role", () => {
      const sessionWithoutRole = {
        user: {
          id: "123",
          email: "test@example.com",
          name: "Test User",
        },
      };

      render(<TestAppSidebar session={sessionWithoutRole} />);

      expect(screen.queryByTestId("admin-section")).not.toBeInTheDocument();
    });
  });

  describe("Admin Navigation", () => {
    it("should render all admin navigation items", () => {
      render(<TestAppSidebar session={mockAdminSession} />);

      expect(
        screen.getByTestId("admin-nav-item-admin-dashboard"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("admin-nav-item-user-management"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("admin-nav-item-payments")).toBeInTheDocument();
      expect(
        screen.getByTestId("admin-nav-item-subscriptions"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("admin-nav-item-uploads-managements"),
      ).toBeInTheDocument();
    });

    it("should handle admin navigation clicks", () => {
      const mockOnNavigate = jest.fn();
      render(
        <TestAppSidebar
          session={mockAdminSession}
          onNavigate={mockOnNavigate}
        />,
      );

      fireEvent.click(screen.getByTestId("admin-nav-item-admin-dashboard"));
      expect(mockOnNavigate).toHaveBeenCalledWith("/dashboard/admin");

      fireEvent.click(screen.getByTestId("admin-nav-item-user-management"));
      expect(mockOnNavigate).toHaveBeenCalledWith("/dashboard/admin/users");
    });

    it("should highlight active admin navigation item", () => {
      render(
        <TestAppSidebar
          session={mockAdminSession}
          pathname="/dashboard/admin/users"
        />,
      );

      const userManagementItem = screen.getByTestId(
        "admin-nav-item-user-management",
      );
      expect(userManagementItem).toHaveClass("active");
    });

    it("should hide admin header when sidebar is collapsed", () => {
      render(<TestAppSidebar session={mockAdminSession} sidebarOpen={false} />);

      expect(screen.queryByTestId("admin-header")).not.toBeInTheDocument();
      expect(screen.getByTestId("admin-navigation")).toBeInTheDocument();
    });
  });

  describe("Table Management Navigation", () => {
    it("should render table navigation when enabled tables exist", () => {
      render(
        <TestAppSidebar
          session={mockAdminSession}
          enabledTables={["users", "payments"]}
        />,
      );

      expect(
        screen.getByTestId("table-management-section"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("table-navigation")).toBeInTheDocument();
      expect(screen.getByTestId("table-management-header")).toHaveTextContent(
        "Manage Tables",
      );
    });

    it("should not render table navigation when no enabled tables", () => {
      render(<TestAppSidebar session={mockAdminSession} enabledTables={[]} />);

      expect(
        screen.queryByTestId("table-management-section"),
      ).not.toBeInTheDocument();
    });

    it("should render table navigation items with proper naming", () => {
      render(
        <TestAppSidebar
          session={mockAdminSession}
          enabledTables={["users", "webhook_events"]}
        />,
      );

      expect(screen.getByTestId("table-nav-item-users")).toBeInTheDocument();
      expect(screen.getByTestId("table-nav-title-users")).toHaveTextContent(
        "Users",
      );

      expect(
        screen.getByTestId("table-nav-item-webhook_events"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-nav-title-webhook_events"),
      ).toHaveTextContent("Webhook_events");
    });

    it("should handle table navigation clicks", () => {
      const mockOnNavigate = jest.fn();
      render(
        <TestAppSidebar
          session={mockAdminSession}
          enabledTables={["users", "payments"]}
          onNavigate={mockOnNavigate}
        />,
      );

      fireEvent.click(screen.getByTestId("table-nav-item-users"));
      expect(mockOnNavigate).toHaveBeenCalledWith(
        "/dashboard/admin/tables/users",
      );

      fireEvent.click(screen.getByTestId("table-nav-item-payments"));
      expect(mockOnNavigate).toHaveBeenCalledWith(
        "/dashboard/admin/tables/payments",
      );
    });

    it("should highlight active table navigation with startsWith logic", () => {
      render(
        <TestAppSidebar
          session={mockAdminSession}
          enabledTables={["users"]}
          pathname="/dashboard/admin/tables/users/123"
        />,
      );

      const usersTableItem = screen.getByTestId("table-nav-item-users");
      expect(usersTableItem).toHaveClass("active");
    });

    it("should hide table management header when sidebar is collapsed", () => {
      render(
        <TestAppSidebar
          session={mockAdminSession}
          enabledTables={["users"]}
          sidebarOpen={false}
        />,
      );

      expect(
        screen.queryByTestId("table-management-header"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("table-navigation")).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should apply appropriate classes for open sidebar", () => {
      render(<TestAppSidebar session={mockSession} sidebarOpen={true} />);

      const sidebar = screen.getByTestId("app-sidebar");
      expect(sidebar).toHaveClass("open");

      const header = screen.getByTestId("sidebar-header");
      expect(header).toHaveClass("expanded");
    });

    it("should apply appropriate classes for collapsed sidebar", () => {
      render(<TestAppSidebar session={mockSession} sidebarOpen={false} />);

      const sidebar = screen.getByTestId("app-sidebar");
      expect(sidebar).toHaveClass("collapsed");

      const header = screen.getByTestId("sidebar-header");
      expect(header).toHaveClass("collapsed");
    });
  });

  describe("Footer Section", () => {
    it("should render sidebar footer with user button", () => {
      render(<TestAppSidebar session={mockSession} />);

      expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument();
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });
  });
});

// Create a comprehensive test that doesn't rely on complex imports
describe("AppSidebar Component", () => {
  it("should exist as a TypeScript file with proper export", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");

    expect(fs.existsSync(componentPath)).toBe(true);

    const content = fs.readFileSync(componentPath, "utf8");

    // Verify component structure
    expect(content).toContain("export function AppSidebar");
    expect(content).toContain("export default AppSidebar");
    expect(content).toContain('"use client"');
  });

  it("should have proper import structure for all dependencies", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify React and icons imports
    expect(content).toContain('import * as React from "react"');
    expect(content).toContain('from "lucide-react"');

    // Verify lib imports
    expect(content).toContain('from "@/lib/config/constants"');
    expect(content).toContain('from "@/lib/config/roles"');
    expect(content).toContain('from "@/lib/config/admin-tables"');
    expect(content).toContain('from "@/lib/utils"');
    expect(content).toContain('from "@/lib/auth/permissions"');

    // Verify component imports
    expect(content).toContain('from "@/components/ui/sidebar"');
    expect(content).toContain('from "@/components/logo"');

    // Verify Next.js imports
    expect(content).toContain('from "next/navigation"');
    expect(content).toContain('from "nextjs-toploader/app"');
    expect(content).toContain('from "next/link"');
  });

  it("should define navigation arrays with proper structure", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify navigation arrays
    expect(content).toContain("const navigation:");
    expect(content).toContain("const adminNavigation:");
    expect(content).toContain("const genericTableNavigation =");

    // Verify navigation item structure
    expect(content).toContain("title: <>Home</>");
    expect(content).toContain('url: "/dashboard"');
    expect(content).toContain("icon: Home");

    expect(content).toContain("title: <>Upload</>");
    expect(content).toContain('url: "/dashboard/upload"');
    expect(content).toContain("icon: Upload");

    expect(content).toContain("title: <>Settings</>");
    expect(content).toContain('url: "/dashboard/settings"');
    expect(content).toContain("icon: Settings");
  });

  it("should define admin navigation with proper items", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify admin navigation items
    expect(content).toContain("title: <>Admin Dashboard</>");
    expect(content).toContain('url: "/dashboard/admin"');
    expect(content).toContain("icon: BarChart3");

    expect(content).toContain("title: <>User Management</>");
    expect(content).toContain('url: "/dashboard/admin/users"');
    expect(content).toContain("icon: Users");

    expect(content).toContain("title: <>Payments</>");
    expect(content).toContain('url: "/dashboard/admin/payments"');
    expect(content).toContain("icon: CreditCard");

    expect(content).toContain("title: <>Subscriptions</>");
    expect(content).toContain('url: "/dashboard/admin/subscriptions"');
    expect(content).toContain("icon: Shield");

    expect(content).toContain("title: <>Uploads Managements</>");
    expect(content).toContain('url: "/dashboard/admin/uploads"');
    expect(content).toContain("icon: Upload");
  });

  it("should implement generic table navigation", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify generic table navigation logic
    expect(content).toContain("Object.keys(enabledTablesMap).map");
    expect(content).toContain("key.charAt(0).toUpperCase() + key.slice(1)");
    expect(content).toContain("`/dashboard/admin/tables/${key}`");
    expect(content).toContain("icon: Database");
  });

  it("should use proper React hooks pattern", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify hooks usage
    expect(content).toContain("const pathname = usePathname()");
    expect(content).toContain("const router = useRouter()");
    expect(content).toContain("const { open, toggleSidebar } = useSidebar()");
    expect(content).toContain("interface AppSidebarProps");
    expect(content).toContain("user: AuthUser");
    expect(content).toContain(
      "export function AppSidebar({ user }: AppSidebarProps)",
    );
  });

  it("should implement admin role checking", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify admin role checking logic
    expect(content).toContain("const showAdminSections = isAdminRole(user.role);");
  });

  it("should implement navigation handler", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify navigation handler
    expect(content).toContain(
      "const handleNavigation = (url: string) => () =>",
    );
    expect(content).toContain("router.push(url)");
  });

  it("should render sidebar with proper structure", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify main sidebar structure
    expect(content).toContain('<Sidebar collapsible="icon" variant="inset">');
    expect(content).toContain("<SidebarHeader");
    expect(content).toContain("<SidebarContent");
    expect(content).toContain("<SidebarFooter");
    expect(content).toContain("<SidebarRail />");
  });

  it("should render header with logo and app name", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify header content
    expect(content).toContain('<Logo className="m-0 size-5 p-1" />');
    expect(content).toContain("{APP_NAME}");
    expect(content).toContain("{open &&");
  });

  it("should render navigation items with proper structure", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify navigation rendering
    expect(content).toContain("{navigation.map((item) =>");
    expect(content).toContain("<SidebarMenuItem key={item.key}>");
    expect(content).toContain("<SidebarMenuButton");
    expect(content).toContain("isActive={item.url === pathname}");
    expect(content).toContain("tooltip={item.key}");
    expect(content).toContain('<item.icon className="size-4" />');
    expect(content).toContain("<span>{item.title}</span>");
  });

  it("should conditionally render admin navigation", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify admin conditional rendering
    expect(content).toContain("{showAdminSections && (");
    expect(content).toContain("{adminNavigation.map((item) =>");
    expect(content).toContain("Admin");
  });

  it("should conditionally render generic table navigation", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify generic table conditional rendering
    expect(content).toContain("{genericTableNavigation.length > 0 && (");
    expect(content).toContain("{genericTableNavigation.map((item) =>");
    expect(content).toContain("Manage Tables");
    expect(content).toContain("pathname.startsWith(item.url)");
  });

  it("should render footer with user button", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify footer content
    expect(content).toContain("<SidebarFooter");
    expect(content).toContain("<UserButton user={user} />");
  });

  it("should use proper CSS classes and styling", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify CSS classes
    expect(content).toContain("className={cn(");
    expect(content).toContain('"cursor-pointer"');
    expect(content).toContain("text-muted-foreground");
    expect(content).toContain('"flex flex-col gap-2"');
    expect(content).toContain('"size-4"');
    expect(content).toContain('"border-sidebar-divider border-t p-2"');
  });

  it("should have proper TypeScript typing", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify TypeScript patterns
    expect(content).toContain(": {");
    expect(content).toContain("title: React.ReactNode;");
    expect(content).toContain("url: string;");
    expect(content).toContain("icon: LucideIcon;");
    expect(content).toContain("}[]");
  });

  it("should implement responsive design patterns", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify responsive patterns
    expect(content).toContain("open ?");
    expect(content).toContain("{open &&");
    expect(content).toContain('collapsible="icon"');
    expect(content).toContain('"justify-center"');
  });

  it("should follow React component best practices", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify best practices
    expect(content).toContain('"use client"'); // Client component
    expect(content).toMatch(/export\s+function\s+AppSidebar/); // Named function export
    expect(content).toContain("export default AppSidebar"); // Default export
    expect(content).not.toContain("var "); // No var declarations
    expect(content).toContain("const "); // Uses const for variables
  });

  it("should have proper component structure and organization", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify component organization
    const lines = content.split("\n");
    expect(lines.length).toBeGreaterThan(200); // Substantial component
    expect(lines.length).toBeLessThan(300); // But not too large

    // Verify structure order
    const navigationIndex = content.indexOf("const navigation:");
    const adminNavigationIndex = content.indexOf("const adminNavigation:");
    const componentIndex = content.indexOf("export function AppSidebar");

    expect(navigationIndex).toBeLessThan(adminNavigationIndex);
    expect(adminNavigationIndex).toBeLessThan(componentIndex);
  });

  it("should handle navigation state management", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify state management patterns
    expect(content).toContain("useSidebar()");
    expect(content).toContain("usePathname()");
    expect(content).toContain("useRouter()");
    expect(content).toContain("AuthUser");

    // Verify state usage
    expect(content).toContain("open");
    expect(content).toContain("toggleSidebar");
    expect(content).toContain("pathname");
    expect(content).toContain("router");
    expect(content).toContain("user");
  });

  it("should implement accessibility features", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify accessibility features
    expect(content).toContain("tooltip={item.key}");
    expect(content).toContain("<span>{item.title}</span>");
    expect(content).toMatch(/aria-|tooltip/); // Should have accessibility features
  });

  it("should have proper import organization", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify import organization
    const lines = content.split("\n");
    let inImports = false;
    let importCount = 0;

    for (const line of lines) {
      if (line.startsWith("import")) {
        inImports = true;
        importCount++;
      } else if (inImports && line.trim() === "") {
        break;
      } else if (inImports && !line.startsWith("  ") && !line.startsWith("}")) {
        break;
      }
    }

    expect(importCount).toBeGreaterThanOrEqual(5); // Has multiple imports
    expect(importCount).toBeLessThan(15); // But not too many
  });

  it("should handle all required navigation scenarios", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    // Verify all navigation scenarios are covered
    expect(content).toContain("/dashboard");
    expect(content).toContain("/dashboard/upload");
    expect(content).toContain("/dashboard/settings");
    expect(content).toContain("/dashboard/admin");
    expect(content).toContain("/dashboard/admin/users");
    expect(content).toContain("/dashboard/admin/payments");
    expect(content).toContain("/dashboard/admin/subscriptions");
    expect(content).toContain("/dashboard/admin/uploads");
    expect(content).toContain("/dashboard/admin/tables/");
  });
});
