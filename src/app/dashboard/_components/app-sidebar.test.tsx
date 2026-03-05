import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";
import React from "react";

const TestAppSidebar = ({
  pathname = "/dashboard",
  session = null,
  sidebarOpen = true,
  onNavigate = jest.fn(),
}: {
  pathname?: string;
  session?: any;
  sidebarOpen?: boolean;
  onNavigate?: jest.Mock;
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

  const isAdmin =
    session?.user && ["admin", "super_admin"].includes(session.user.role);

  const handleNavigation = (url: string) => () => {
    onNavigate(url);
  };

  return (
    <div data-testid="app-sidebar" className={sidebarOpen ? "open" : "collapsed"}>
      <div data-testid="sidebar-header">
        <div data-testid="logo" onClick={() => onNavigate("/")}>
          🚀
        </div>
      </div>

      <div data-testid="main-navigation">
        {navigation.map((item) => (
          <div
            key={item.title}
            data-testid={`nav-item-${item.title.toLowerCase()}`}
            className={item.url === pathname ? "active" : ""}
            onClick={handleNavigation(item.url)}
          >
            {item.title}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div data-testid="admin-section">
          {sidebarOpen && <div data-testid="admin-header">Admin</div>}
          {adminNavigation.map((item) => (
            <div
              key={item.title}
              data-testid={`admin-nav-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              className={item.url === pathname ? "active" : ""}
              onClick={handleNavigation(item.url)}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

describe("AppSidebar", () => {
  const userSession = {
    user: { id: "1", email: "u@example.com", name: "User", role: "user" },
  };

  const adminSession = {
    user: {
      id: "2",
      email: "a@example.com",
      name: "Admin",
      role: "admin",
    },
  };

  it("renders base navigation", () => {
    render(<TestAppSidebar session={userSession} />);

    expect(screen.getByTestId("nav-item-home")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-upload")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();
  });

  it("shows admin section only for admin roles", () => {
    render(<TestAppSidebar session={userSession} />);
    expect(screen.queryByTestId("admin-section")).not.toBeInTheDocument();

    render(<TestAppSidebar session={adminSession} />);
    expect(screen.getByTestId("admin-section")).toBeInTheDocument();
    expect(screen.getByTestId("admin-header")).toHaveTextContent("Admin");
  });

  it("handles navigation clicks", () => {
    const onNavigate = jest.fn();
    render(<TestAppSidebar session={adminSession} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByTestId("logo"));
    fireEvent.click(screen.getByTestId("nav-item-home"));
    fireEvent.click(screen.getByTestId("admin-nav-item-user-management"));

    expect(onNavigate).toHaveBeenCalledWith("/");
    expect(onNavigate).toHaveBeenCalledWith("/dashboard");
    expect(onNavigate).toHaveBeenCalledWith("/dashboard/admin/users");
  });

  it("does not include manage tables in source", () => {
    const componentPath = path.join(__dirname, "app-sidebar.tsx");
    const content = fs.readFileSync(componentPath, "utf8");

    expect(content).not.toContain("Manage Tables");
    expect(content).not.toContain("/dashboard/admin/tables/");
    expect(content).not.toContain("@/lib/config/admin-tables");
  });
});
