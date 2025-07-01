import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { NextRequest } from "next/server"; // Import actual types

// Mock external dependencies
const mockGetSession = jest.fn();
const mockGetUserSubscription = jest.fn();
const mockRetrieveCheckout = jest.fn();

jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

jest.mock("@/lib/database/subscription", () => ({
  getUserSubscription: mockGetUserSubscription,
}));

// Mock the dynamic import for Creem client
jest.mock("@/lib/billing/creem/client", () => ({
  __esModule: true,
  creemClient: {
    retrieveCheckout: mockRetrieveCheckout,
  },
  creemApiKey: "test-api-key",
}));

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: () => Promise.resolve(body),
      status: init?.status || 200,
    })),
    // Add other methods if used in the route, e.g., redirect, next
  },
  NextRequest: jest.fn((url, init) => ({
    url: url,
    nextUrl: new URL(url),
    headers: new Headers(init?.headers),
    cookies: {
      get: jest.fn(),
      // Add other cookie methods if needed, e.g., set, delete
    },
    // Add other properties/methods if used in the route, e.g., body
  })),
}));

// Import the actual GET handler after mocks are set up
import { GET } from "./route";

describe("Payment Status API", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 400 if no sessionId is provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Session ID is required",
    });
  });

  it("should return success when user has active subscription", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "active",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      subscription: mockSubscription,
      message: "Payment successful and subscription is active",
    });
    expect(mockGetUserSubscription).toHaveBeenCalledWith("user-123");
  });

  it("should return success when user has trialing subscription", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "trialing",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      subscription: mockSubscription,
      message: "Payment successful and subscription is active",
    });
  });

  it("should return failed when user has past_due subscription", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "past_due",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      subscription: mockSubscription,
      message: "Payment failed or subscription is past due",
    });
  });

  it("should return failed when user has unpaid subscription", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "unpaid",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      subscription: mockSubscription,
      message: "Payment failed or subscription is past due",
    });
  });

  it("should return pending when user has canceled subscription with sessionId", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "canceled",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed",
      sessionId: "test-session-id",
    });
  });

  it("should return cancelled when user has canceled subscription without sessionId", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status");
    
    const mockSession = {
      user: { id: "user-123" }
    };
    const mockSubscription = {
      id: "sub-123",
      status: "canceled",
      userId: "user-123"
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    // This should trigger the "Session ID is required" error before checking subscription
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Session ID is required",
    });
  });

  it("should check with Creem when no subscription found and sessionId provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    const mockSession = {
      user: { id: "user-123" }
    };

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(null); // No subscription

    // Mock Creem client response
    mockRetrieveCheckout.mockResolvedValue({
      status: "completed"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      message: "Payment completed successfully",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem failed status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with failed status
    mockRetrieveCheckout.mockResolvedValue({
      status: "failed"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      message: "Payment failed",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem canceled status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with canceled status
    mockRetrieveCheckout.mockResolvedValue({
      status: "canceled"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "cancelled",
      message: "Payment was cancelled",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem pending status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with pending status
    mockRetrieveCheckout.mockResolvedValue({
      status: "pending"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem processing status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with processing status
    mockRetrieveCheckout.mockResolvedValue({
      status: "processing"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
      sessionId: "test-session-id",
    });
  });

  it("should handle unknown Creem status as pending", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with unknown status
    mockRetrieveCheckout.mockResolvedValue({
      status: "unknown-status"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem response without status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with no status
    mockRetrieveCheckout.mockResolvedValue({});

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
      sessionId: "test-session-id",
    });
  });

  it("should handle Creem API error gracefully", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client to throw error
    mockRetrieveCheckout.mockRejectedValue(new Error("Creem API error"));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment status is being verified. Please wait a moment.",
      sessionId: "test-session-id",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Error checking Creem payment status:",
      expect.any(Error)
    );
  });

  it("should use checkout_id parameter as sessionId", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?checkout_id=checkout-123");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response
    mockRetrieveCheckout.mockResolvedValue({
      status: "completed"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe("checkout-123");
  });

  it("should handle non-logged-in user checking payment status", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    mockGetSession.mockResolvedValue(null); // No user session
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response
    mockRetrieveCheckout.mockResolvedValue({
      status: "completed"
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      message: "Payment completed successfully",
      sessionId: "test-session-id",
    });
    expect(mockGetUserSubscription).not.toHaveBeenCalled();
  });

  it("should handle general API error", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status?sessionId=test-session-id");
    
    // Force an error in the main try block
    mockGetSession.mockRejectedValue(new Error("Database connection error"));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Failed to check payment status",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[Payment Status API Error]",
      expect.any(Error)
    );
  });

  it("should return default pending status when no sessionId and no subscription", async () => {
    const request = new NextRequest("http://localhost:3000/api/payment-status");
    
    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment status is being verified",
    });
  });
});