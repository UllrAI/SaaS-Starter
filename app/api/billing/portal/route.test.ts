import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
  },
}));

// Mock dependencies
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const mockCreateCustomerPortalUrl = jest.fn();
jest.mock("@/lib/billing", () => ({
  billing: {
    createCustomerPortalUrl: mockCreateCustomerPortalUrl,
  },
}));

const mockGetUserSubscription = jest.fn();
jest.mock("@/lib/database/subscription", () => ({
  getUserSubscription: mockGetUserSubscription,
}));

describe("Billing Portal API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = () => {
    return {
      headers: { get: () => '', has: () => false, set: () => {}, entries: () => [] },
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: '/api/billing/portal' },
      url: 'http://localhost:3000/api/billing/portal',
    } as unknown as import('next/server').NextRequest;
  };

  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  describe("GET /api/billing/portal", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null);
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when session exists but user is null", async () => {
      mockGetSession.mockResolvedValue({ user: null });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when user has no subscription", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe("No active subscription found for this user.");
    });

    it("should return 404 when subscription exists but has no customerId", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: null,
      });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe("No active subscription found for this user.");
    });

    it("should return 404 when subscription exists but has empty customerId", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "",
      });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe("No active subscription found for this user.");
    });

    it("should return portal URL when subscription exists", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "cus-123",
      });
      mockCreateCustomerPortalUrl.mockResolvedValue({
        portalUrl: "https://portal.example.com",
      });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.portalUrl).toBe("https://portal.example.com");
      expect(mockCreateCustomerPortalUrl).toHaveBeenCalledWith("cus-123");
    });

    it("should handle auth.api.getSession failure", async () => {
      mockGetSession.mockRejectedValue(new Error("Auth service unavailable"));
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Auth service unavailable");
    });

    it("should handle getUserSubscription failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockRejectedValue(new Error("Database error"));
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("should handle billing.createCustomerPortalUrl failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "cus-123",
      });
      mockCreateCustomerPortalUrl.mockRejectedValue(new Error("Billing service error"));
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Billing service error");
    });

    it("should handle non-Error exceptions", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "cus-123",
      });
      mockCreateCustomerPortalUrl.mockRejectedValue("String error");
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should call getUserSubscription with correct user ID", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "cus-123",
      });
      mockCreateCustomerPortalUrl.mockResolvedValue({
        portalUrl: "https://portal.example.com",
      });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      await GET(request);
      
      expect(mockGetUserSubscription).toHaveBeenCalledWith("user-123");
    });

    it("should pass request headers to auth.api.getSession", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        id: "sub-123",
        customerId: "cus-123",
      });
      mockCreateCustomerPortalUrl.mockResolvedValue({
        portalUrl: "https://portal.example.com",
      });
      
      const { GET } = await import("./route");
      const request = createMockRequest();
      
      await GET(request);
      
      expect(mockGetSession).toHaveBeenCalledWith({ headers: request.headers });
    });
  });
});