import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { NextRequest } from "next/server";

// Type definitions for mock responses
type MockResponseInit = { status?: number };

// Mock NextResponse
const mockJson = jest.fn() as any;

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: mockJson,
  },
}));

// Type definitions for mocked functions
type SessionFunction = (...args: any[]) => Promise<any>;
type BillingFunction = (...args: any[]) => Promise<any>;
type SubscriptionFunction = (...args: any[]) => Promise<any>;

// Mock dependencies
const mockGetSession = jest.fn() as jest.MockedFunction<SessionFunction>;
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const mockCreateCustomerPortalUrl = jest.fn() as jest.MockedFunction<BillingFunction>;
jest.mock("@/lib/billing", () => ({
  billing: {
    createCustomerPortalUrl: mockCreateCustomerPortalUrl,
  },
}));

const mockGetUserSubscription = jest.fn() as jest.MockedFunction<SubscriptionFunction>;
jest.mock("@/lib/database/subscription", () => ({
  getUserSubscription: mockGetUserSubscription,
}));

describe("Billing Portal API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockImplementation((data: any, init: MockResponseInit = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
    }));
  });

  const createMockRequest = () => {
    return {
      headers: { get: () => '', has: () => false, set: () => {}, entries: () => [] },
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: '/api/billing/portal' },
      url: 'http://localhost:3000/api/billing/portal',
    } as unknown as NextRequest;
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
        customerId: null,
        status: "active",
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
        customerId: "",
        status: "active",
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
        customerId: "cus-123",
        status: "active",
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
        customerId: "cus-123",
        status: "active",
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
        customerId: "cus-123",
        status: "active",
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
        customerId: "cus-123",
        status: "active",
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
        customerId: "cus-123",
        status: "active",
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