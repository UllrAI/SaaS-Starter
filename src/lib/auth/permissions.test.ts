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

  describe("requireAuth", () => {
    it("should return user when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      const { requireAuth } = await import("./permissions");
      const result = await requireAuth();

      expect(result).toEqual(mockUser);
      expect(mockAuth.api.getSession).toHaveBeenCalled();
    });

    it("should redirect to login when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { requireAuth } = await import("./permissions");

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to login when session exists but no user", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: null,
      });

      const { requireAuth } = await import("./permissions");

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("should handle auth API errors gracefully", async () => {
      mockAuth.api.getSession.mockRejectedValue(
        new Error("Auth service unavailable"),
      );

      const { requireAuth } = await import("./permissions");

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("should handle network timeout gracefully", async () => {
      mockAuth.api.getSession.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const { requireAuth } = await import("./permissions");

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
    });
  });

  describe("requireAdmin", () => {
    it("should return admin user when authenticated with admin role", async () => {
      const mockAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        image: "https://example.com/admin.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "admin-123" },
        user: mockAdmin,
      });

      const { requireAdmin } = await import("./permissions");
      const result = await requireAdmin();

      expect(result).toEqual(mockAdmin);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
    });

    it("should return super_admin user when authenticated with super_admin role", async () => {
      const mockSuperAdmin = {
        id: "super-123",
        email: "super@example.com",
        role: "super_admin",
        name: "Super Admin",
        image: "https://example.com/super.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "super-123" },
        user: mockSuperAdmin,
      });

      const { requireAdmin } = await import("./permissions");
      const result = await requireAdmin();

      expect(result).toEqual(mockSuperAdmin);
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "admin");
    });

    it("should redirect to login when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { requireAdmin } = await import("./permissions");

      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to dashboard when authenticated as regular user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      mockCheckRole.mockReturnValue(false);

      const { requireAdmin } = await import("./permissions");

      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle role checking errors", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      mockCheckRole.mockImplementation(() => {
        throw new Error("Role check failed");
      });

      const { requireAdmin } = await import("./permissions");

      await expect(requireAdmin()).rejects.toThrow("Role check failed");
    });
  });

  describe("requireSuperAdmin", () => {
    it("should return super_admin user when authenticated with super_admin role", async () => {
      const mockSuperAdmin = {
        id: "super-123",
        email: "super@example.com",
        role: "super_admin",
        name: "Super Admin",
        image: "https://example.com/super.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "super-123" },
        user: mockSuperAdmin,
      });

      const { requireSuperAdmin } = await import("./permissions");
      const result = await requireSuperAdmin();

      expect(result).toEqual(mockSuperAdmin);
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "super_admin");
    });

    it("should redirect to dashboard when authenticated as admin", async () => {
      const mockAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        image: "https://example.com/admin.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "admin-123" },
        user: mockAdmin,
      });

      mockCheckRole.mockReturnValue(false);

      const { requireSuperAdmin } = await import("./permissions");

      await expect(requireSuperAdmin()).rejects.toThrow(
        "NEXT_REDIRECT: /dashboard",
      );
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should redirect to login when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { requireSuperAdmin } = await import("./permissions");

      await expect(requireSuperAdmin()).rejects.toThrow(
        "NEXT_REDIRECT: /login",
      );
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      const { getCurrentUser } = await import("./permissions");
      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { getCurrentUser } = await import("./permissions");
      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it("should return null when session exists but no user", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: null,
      });

      const { getCurrentUser } = await import("./permissions");
      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it("should handle auth API errors gracefully", async () => {
      mockAuth.api.getSession.mockRejectedValue(
        new Error("Auth service unavailable"),
      );

      const { getCurrentUser } = await import("./permissions");
      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should return true for user with required role", async () => {
      const { hasRole } = await import("./permissions");

      mockCheckRole.mockReturnValue(true);
      const result = hasRole("admin", "admin");

      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
    });

    it("should return false for user without required role", async () => {
      const { hasRole } = await import("./permissions");

      mockCheckRole.mockReturnValue(false);
      const result = hasRole("user", "admin");

      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "admin");
    });

    it("should handle role hierarchy correctly", async () => {
      const { hasRole } = await import("./permissions");

      mockCheckRole.mockImplementation((userRole, requiredRole) => {
        const roleHierarchy = { user: 0, admin: 1, super_admin: 2 };
        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
      });

      expect(hasRole("super_admin", "admin")).toBe(true);
      expect(hasRole("admin", "user")).toBe(true);
      expect(hasRole("user", "admin")).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", async () => {
      const mockAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        image: "https://example.com/admin.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "admin-123" },
        user: mockAdmin,
      });

      const { isAdmin } = await import("./permissions");
      const result = await isAdmin();

      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "admin");
    });

    it("should return true for super_admin user", async () => {
      const mockSuperAdmin = {
        id: "super-123",
        email: "super@example.com",
        role: "super_admin",
        name: "Super Admin",
        image: "https://example.com/super.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "super-123" },
        user: mockSuperAdmin,
      });

      const { isAdmin } = await import("./permissions");
      const result = await isAdmin();

      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "admin");
    });

    it("should return false for regular user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      mockCheckRole.mockReturnValue(false);

      const { isAdmin } = await import("./permissions");
      const result = await isAdmin();

      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "admin");
    });

    it("should return false when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { isAdmin } = await import("./permissions");
      const result = await isAdmin();

      expect(result).toBe(false);
    });
  });

  describe("isSuperAdmin", () => {
    it("should return true for super_admin user", async () => {
      const mockSuperAdmin = {
        id: "super-123",
        email: "super@example.com",
        role: "super_admin",
        name: "Super Admin",
        image: "https://example.com/super.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "super-123" },
        user: mockSuperAdmin,
      });

      const { isSuperAdmin } = await import("./permissions");
      const result = await isSuperAdmin();

      expect(result).toBe(true);
      expect(mockCheckRole).toHaveBeenCalledWith("super_admin", "super_admin");
    });

    it("should return false for admin user", async () => {
      const mockAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        image: "https://example.com/admin.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "admin-123" },
        user: mockAdmin,
      });

      mockCheckRole.mockReturnValue(false);

      const { isSuperAdmin } = await import("./permissions");
      const result = await isSuperAdmin();

      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("admin", "super_admin");
    });

    it("should return false for regular user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      mockCheckRole.mockReturnValue(false);

      const { isSuperAdmin } = await import("./permissions");
      const result = await isSuperAdmin();

      expect(result).toBe(false);
      expect(mockCheckRole).toHaveBeenCalledWith("user", "super_admin");
    });

    it("should return false when not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValue({ session: null, user: null });

      const { isSuperAdmin } = await import("./permissions");
      const result = await isSuperAdmin();

      expect(result).toBe(false);
    });
  });

  describe("Edge cases and security scenarios", () => {
    it("should handle malformed user data", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: {
          id: "user-123",
          email: null,
          role: "user",
          name: "Test",
          image: undefined,
        },
      });

      const { requireAuth } = await import("./permissions");

      const result = await requireAuth();
      expect(result.id).toBe("user-123");
    });

    it("should handle empty user ID", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "" },
        user: {
          id: "",
          email: "test@example.com",
          role: "user",
          name: "Test",
          image: undefined,
        },
      });

      const { requireAuth } = await import("./permissions");

      const result = await requireAuth();
      expect(result.id).toBe("");
    });

    it("should handle concurrent auth requests", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      mockAuth.api.getSession.mockResolvedValue({
        session: { userId: "user-123" },
        user: mockUser,
      });

      const { requireAuth } = await import("./permissions");

      const results = await Promise.all([
        requireAuth(),
        requireAuth(),
        requireAuth(),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((result) => result.id === "user-123")).toBe(true);
    });

    it("should handle session expiration during request", async () => {
      let callCount = 0;
      mockAuth.api.getSession.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            session: { userId: "user-123" },
            user: {
              id: "user-123",
              email: "user@example.com",
              role: "user",
              name: "Test User",
              image: "https://example.com/avatar.jpg",
            },
          });
        } else {
          return Promise.resolve({ session: null, user: null });
        }
      });

      const { requireAuth } = await import("./permissions");

      const firstResult = await requireAuth();
      expect(firstResult.id).toBe("user-123");

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT: /login");
    });
  });
});
