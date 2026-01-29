import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { NextRequest } from "next/server";

// Mock NextResponse
const mockJson = jest.fn();

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: mockJson,
  },
}));

// Mock dependencies with proper Jest mock functions
const mockGetSession = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockCreateCustomerPortalUrl = jest.fn();
const mockGetUserSubscription = jest.fn();

jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

jest.mock("@/lib/billing", () => ({
  billing: {
    createCheckoutSession: mockCreateCheckoutSession,
    createCustomerPortalUrl: mockCreateCustomerPortalUrl,
  },
}));

jest.mock("@/lib/database/subscription", () => ({
  getUserSubscription: mockGetUserSubscription,
}));

// Mock environment variable
const originalEnv = process.env;

describe("Billing Checkout API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockJson.mockImplementation((data: any, init?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }));

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: "https://example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (body: any) => {
    return {
      headers: {
        get: () => "",
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      json: jest.fn().mockResolvedValue(body),
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: "/api/billing/checkout" },
      url: "http://localhost:3000/api/billing/checkout",
    };
  };

  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  describe("POST /api/billing/checkout", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import("./route");
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid request body", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest({
        invalidField: "invalid",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
      expect(data.details).toBeDefined();
    });

    it("should return 409 when user has active subscription", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        customerId: "cus-123",
        status: "active",
      });
      mockCreateCustomerPortalUrl.mockResolvedValue({
        portalUrl: "https://portal.creem.io/customer-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain("already have an active subscription");
      expect(data.managementUrl).toBe("https://portal.creem.io/customer-123");
    });

    it("should return 409 when user has trialing subscription", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        customerId: "cus-123",
        status: "trialing",
      });
      mockCreateCustomerPortalUrl.mockResolvedValue({
        portalUrl: "https://portal.creem.io/customer-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.managementUrl).toBe("https://portal.creem.io/customer-123");
    });

    it("should proceed when user has canceled subscription", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        customerId: "cus-123",
        status: "canceled",
      });
      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkoutUrl).toBe("https://checkout.creem.io/session-123");
    });

    it("should proceed with one-time payment regardless of subscription status", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue({
        customerId: "cus-123",
        status: "active",
      });
      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "one_time",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkoutUrl).toBe("https://checkout.creem.io/session-123");
      expect(mockGetUserSubscription).not.toHaveBeenCalled();
    });

    it("should create checkout session with correct parameters", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);
      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-premium",
        paymentMode: "subscription",
        billingCycle: "yearly",
      });

      const response = await POST(request);

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: "user-123",
        userEmail: "test@example.com",
        userName: "Test User",
        tierId: "tier-premium",
        paymentMode: "subscription",
        billingCycle: "yearly",
        successUrl: "https://example.com/payment-status?status=success",
        cancelUrl: "https://example.com/payment-status?status=cancelled",
        failureUrl: "https://example.com/payment-status?status=failed",
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.checkoutUrl).toBe("https://checkout.creem.io/session-123");
    });

    it("should handle optional billingCycle parameter", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);
      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        // billingCycle omitted
      });

      const response = await POST(request);

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          billingCycle: undefined,
        }),
      );
      expect(response.status).toBe(200);
    });

    it("should return 500 when NEXT_PUBLIC_APP_URL is not set", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "";
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create checkout session");
    });

    it("should return 500 when checkout session creation fails", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);
      mockCreateCheckoutSession.mockRejectedValue(new Error("Billing error"));

      const { POST } = await import("./route");
      const request = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create checkout session");
    });

    it("should handle auth.api.getSession failure", async () => {
      mockGetSession.mockRejectedValue(new Error("Auth error"));

      const { POST } = await import("./route");
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create checkout session");
    });

    it("should handle request.json() failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const request = {
        headers: {
          get: () => "",
          has: () => false,
          set: () => {},
          entries: () => [],
        },
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")) as any,
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: "/api/billing/checkout" },
        url: "http://localhost:3000/api/billing/checkout",
      } as any as NextRequest;

      const { POST } = await import("./route");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create checkout session");
    });

    it("should validate checkoutSchema with all valid enum values", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetUserSubscription.mockResolvedValue(null);
      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      const { POST } = await import("./route");

      // Test monthly billing cycle
      const monthlyRequest = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "monthly",
      });

      let response = await POST(monthlyRequest);
      expect(response.status).toBe(200);

      // Test yearly billing cycle
      const yearlyRequest = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "yearly",
      });

      response = await POST(yearlyRequest);
      expect(response.status).toBe(200);

      // Test one_time payment mode
      const oneTimeRequest = createMockRequest({
        tierId: "tier-1",
        paymentMode: "one_time",
      });

      response = await POST(oneTimeRequest);
      expect(response.status).toBe(200);
    });

    it("should validate checkoutSchema with invalid enum values", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");

      // Test invalid payment mode
      const invalidModeRequest = createMockRequest({
        tierId: "tier-1",
        paymentMode: "invalid_mode",
        billingCycle: "monthly",
      });

      let response = await POST(invalidModeRequest);
      expect(response.status).toBe(400);

      // Test invalid billing cycle
      const invalidCycleRequest = createMockRequest({
        tierId: "tier-1",
        paymentMode: "subscription",
        billingCycle: "invalid_cycle",
      });

      response = await POST(invalidCycleRequest);
      expect(response.status).toBe(400);
    });
  });
});
