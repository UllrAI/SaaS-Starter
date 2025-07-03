import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock all external dependencies
const mockAuth = {
  api: {
    getSession: jest.fn(),
  },
};

const mockRedirect = jest.fn();
const mockHeaders = jest.fn();
const mockCheckRole = jest.fn();

// Mock next/navigation
jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// Mock next/headers  
jest.mock("next/headers", () => ({
  headers: mockHeaders,
}));

// Mock auth server
jest.mock("./server", () => ({
  auth: mockAuth,
}));

// Mock roles config
jest.mock("@/lib/config/roles", () => ({
  hasRole: mockCheckRole,
}));

describe("Auth Permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockHeaders.mockResolvedValue(new Map());
    mockCheckRole.mockImplementation((userRole, requiredRole) => {
      const roleHierarchy = { user: 0, admin: 1, super_admin: 2 };
      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    });
    
    // Mock redirect to throw an error to simulate Next.js behavior
    mockRedirect.mockImplementation((url) => {
      throw new Error(`NEXT_REDIRECT: ${url}`);
    });
  });

  describe("getCurrentUser", () => {
    it("should return user data when session exists", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          image: "https://example.com/avatar.jpg",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result).toEqual({
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        image: "https://example.com/avatar.jpg",
      });
      
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Map),
      });
    });

    it("should return null when no session exists", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it("should return null when session has no user", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: null });
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it("should default role to 'user' when not specified", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          // role is missing
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result?.role).toBe("user");
    });

    it("should handle missing image field", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          // image is missing
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result?.image).toBeUndefined();
    });

    it("should handle client-side context errors", async () => {
      mockAuth.api.getSession.mockRejectedValue(new Error("Not in server context"));
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it("should handle headers import errors", async () => {
      // Mock the dynamic import to fail
      jest.doMock("next/headers", () => {
        throw new Error("Headers not available in this context");
      });
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should delegate to checkRole function", async () => {
      mockCheckRole.mockReturnValue(true);
      
      const { hasRole } = await import("./permissions");
      
      const result = hasRole("admin", "user");
      
      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "user");
    });

    it("should return false when checkRole returns false", async () => {
      mockCheckRole.mockReturnValue(false);
      
      const { hasRole } = await import("./permissions");
      
      const result = hasRole("user", "admin");
      
      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "admin");
    });

    it("should pass through all role combinations correctly", async () => {
      const { hasRole } = await import("./permissions");
      
      // Test various role combinations
      hasRole("user", "user");
      hasRole("admin", "admin");
      hasRole("super_admin", "super_admin");
      hasRole("admin", "user");
      hasRole("super_admin", "admin");
      
      expect(mockCheckRole).toHaveBeenCalledTimes(5);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "user");
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "super_admin");
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "user");
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "admin");
    });
  });

  describe("requireAuth", () => {
    it("should return user when authenticated and has required role", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(true);
      
      const { requireAuth } = await import("./permissions");
      
      const result = await requireAuth("user");
      
      expect(result).toEqual({
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        image: undefined,
      });
    });

    it("should redirect to login when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);
      
      const { requireAuth } = await import("./permissions");
      
      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to dashboard when lacking required role", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(false);
      
      const { requireAuth } = await import("./permissions");
      
      await expect(requireAuth("admin")).rejects.toThrow("NEXT_REDIRECT: /dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should allow access without role requirement", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import("./permissions");
      
      const result = await requireAuth();
      
      expect(result).toEqual({
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        image: undefined,
      });
      
      // Should not call hasRole when no required role specified
      expect(mockCheckRole).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("should return user when user is admin", async () => {
      const mockSession = {
        user: {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(true);
      
      const { requireAdmin } = await import("./permissions");
      
      const result = await requireAdmin();
      
      expect(result).toEqual({
        id: "admin1",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        image: undefined,
      });
      
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
    });

    it("should redirect when user is not admin", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "Regular User",
          email: "user@example.com",
          role: "user",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(false);
      
      const { requireAdmin } = await import("./permissions");
      
      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /dashboard");
    });
  });

  describe("requireSuperAdmin", () => {
    it("should return user when user is super admin", async () => {
      const mockSession = {
        user: {
          id: "superadmin1",
          name: "Super Admin",
          email: "superadmin@example.com",
          role: "super_admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(true);
      
      const { requireSuperAdmin } = await import("./permissions");
      
      const result = await requireSuperAdmin();
      
      expect(result).toEqual({
        id: "superadmin1",
        name: "Super Admin",
        email: "superadmin@example.com",
        role: "super_admin",
        image: undefined,
      });
      
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "super_admin");
    });

    it("should redirect when user is not super admin", async () => {
      const mockSession = {
        user: {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(false);
      
      const { requireSuperAdmin } = await import("./permissions");
      
      await expect(requireSuperAdmin()).rejects.toThrow("NEXT_REDIRECT: /dashboard");
    });
  });

  describe("isAdmin", () => {
    it("should return true when user is admin", async () => {
      const mockSession = {
        user: {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(true);
      
      const { isAdmin } = await import("./permissions");
      
      const result = await isAdmin();
      
      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
    });

    it("should return false when user is not admin", async () => {
      const mockSession = {
        user: {
          id: "user1",
          name: "Regular User",
          email: "user@example.com",
          role: "user",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(false);
      
      const { isAdmin } = await import("./permissions");
      
      const result = await isAdmin();
      
      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "admin");
    });

    it("should return false when no user", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);
      
      const { isAdmin } = await import("./permissions");
      
      const result = await isAdmin();
      
      expect(result).toBe(false);
      expect(mockCheckRole).not.toHaveBeenCalled();
    });
  });

  describe("isSuperAdmin", () => {
    it("should return true when user is super admin", async () => {
      const mockSession = {
        user: {
          id: "superadmin1",
          name: "Super Admin",
          email: "superadmin@example.com",
          role: "super_admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(true);
      
      const { isSuperAdmin } = await import("./permissions");
      
      const result = await isSuperAdmin();
      
      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "super_admin");
    });

    it("should return false when user is not super admin", async () => {
      const mockSession = {
        user: {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
      };
      
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockCheckRole.mockReturnValue(false);
      
      const { isSuperAdmin } = await import("./permissions");
      
      const result = await isSuperAdmin();
      
      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "super_admin");
    });

    it("should return false when no user", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);
      
      const { isSuperAdmin } = await import("./permissions");
      
      const result = await isSuperAdmin();
      
      expect(result).toBe(false);
      expect(mockCheckRole).not.toHaveBeenCalled();
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle session API errors in requireAuth", async () => {
      mockAuth.api.getSession.mockRejectedValue(new Error("Session API error"));
      
      const { requireAuth } = await import("./permissions");
      
      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
    });

    it("should handle malformed session data", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          // Missing required fields
          id: "user1",
          // name, email missing
        },
      });
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result?.id).toBe("user1");
      expect(result?.role).toBe("user"); // Default role
    });

    it("should handle null/undefined user roles", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: "user1",
          name: "Test User",
          email: "test@example.com",
          role: null,
        },
      });
      
      const { getCurrentUser } = await import("./permissions");
      
      const result = await getCurrentUser();
      
      expect(result?.role).toBe("user");
    });
  });

  describe("Type exports and module structure", () => {
    it("should export all required functions", async () => {
      const permissions = await import("./permissions");
      
      expect(typeof permissions.getCurrentUser).toBe("function");
      expect(typeof permissions.hasRole).toBe("function");
      expect(typeof permissions.requireAuth).toBe("function");
      expect(typeof permissions.requireAdmin).toBe("function");
      expect(typeof permissions.requireSuperAdmin).toBe("function");
      expect(typeof permissions.isAdmin).toBe("function");
      expect(typeof permissions.isSuperAdmin).toBe("function");
    });

    it("should have consistent function signatures", async () => {
      const permissions = await import("./permissions");
      
      // Test parameter counts
      expect(permissions.hasRole.length).toBe(2);
      expect(permissions.getCurrentUser.length).toBe(0);
      expect(permissions.requireAuth.length).toBe(1);
      expect(permissions.requireAdmin.length).toBe(0);
      expect(permissions.requireSuperAdmin.length).toBe(0);
      expect(permissions.isAdmin.length).toBe(0);
      expect(permissions.isSuperAdmin.length).toBe(0);
    });
  });
});