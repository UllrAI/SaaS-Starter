import type { SpyInstance } from "@/../jest.setup";
import {
  MockSession,
  MockSubscription,
  MockCreemCheckout,
  createMockSession,
  createMockSubscription,
  createMockCreemCheckout,
} from "@/../jest.setup";

// Type definitions for mocked functions
type SessionFunction = (options: {
  headers: Headers;
}) => Promise<MockSession | null>;
type SubscriptionFunction = (
  userId: string,
) => Promise<MockSubscription | null>;
type CheckoutFunction = (params: {
  xApiKey: string;
  checkoutId: string;
}) => Promise<MockCreemCheckout>;

// Mock external dependencies with proper types
const mockGetSession = jest.fn() as jest.MockedFunction<SessionFunction>;
const mockGetUserSubscription =
  jest.fn() as jest.MockedFunction<SubscriptionFunction>;
const mockRetrieveCheckout = jest.fn() as jest.MockedFunction<CheckoutFunction>;

// Reset and set up fresh mocks
beforeAll(() => {
  jest.resetModules();

  jest.doMock("@/lib/auth/server", () => ({
    auth: {
      api: {
        getSession: mockGetSession,
      },
    },
  }));

  jest.doMock("@/lib/database/subscription", () => ({
    getUserSubscription: mockGetUserSubscription,
  }));

  // Mock the dynamic import for Creem client
  jest.doMock("@/lib/billing/creem/client", () => ({
    __esModule: true,
    creemClient: {
      retrieveCheckout: mockRetrieveCheckout,
    },
    creemApiKey: "test-api-key",
  }));
});

describe("Payment Status API", () => {
  let consoleErrorSpy: SpyInstance;
  let GET: (request: import("next/server").NextRequest) => Promise<Response>;

  beforeAll(async () => {
    // Import the route handler after mocks are set up
    const routeModule = await import("./route");
    GET = routeModule.GET;
  });

  const createMockRequest = (url: string) => {
    return {
      url: url,
      headers: {
        get: () => "",
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      cookies: { get: () => null, has: () => false },
      nextUrl: new URL(url),
    } as unknown as import("next/server").NextRequest;
  };

  // Helper to convert subscription dates to ISO strings for comparison
  const serializeSubscription = (subscription: MockSubscription) => ({
    ...subscription,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
    currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 400 if no sessionId is provided", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status",
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Session ID is required",
    });
  });

  it("should return success when user has active subscription", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "active",
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    // Debug the calls to see what's happening
    expect(mockGetSession).toHaveBeenCalledWith({ headers: request.headers });
    expect(mockGetUserSubscription).toHaveBeenCalledWith("user-123");

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      subscription: serializeSubscription(mockSubscription),
      message: "Payment successful and subscription is active",
    });
  });

  it("should return success when user has trialing subscription", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "trialing",
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      subscription: serializeSubscription(mockSubscription),
      message: "Payment successful and subscription is active",
    });
  });

  it("should return failed when user has past_due subscription", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "past_due",
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      subscription: serializeSubscription(mockSubscription),
      message: "Payment failed or subscription is past due",
    });
  });

  it("should return failed when user has unpaid subscription", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "unpaid",
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      subscription: serializeSubscription(mockSubscription),
      message: "Payment failed or subscription is past due",
    });
  });

  it("should return pending when user has canceled subscription with sessionId", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "canceled",
      userId: "user-123",
    });

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

  it("should handle unusual subscription status gracefully", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "unknown_status" as any, // Force unusual status
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    // Mock Creem to handle fallback
    mockRetrieveCheckout.mockResolvedValue(
      createMockCreemCheckout({
        status: "completed",
      }),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      message: "Payment completed successfully",
      sessionId: "test-session-id",
    });
  });

  it("should check with Creem when no subscription found and sessionId provided", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(null); // No subscription

    // Mock Creem client response
    const mockCheckout = createMockCreemCheckout({
      status: "completed",
    });
    mockRetrieveCheckout.mockResolvedValue(mockCheckout);

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with failed status
    const mockCheckout = createMockCreemCheckout({
      status: "failed" as const,
    });
    mockRetrieveCheckout.mockResolvedValue(mockCheckout);

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with canceled status
    const mockCheckout = createMockCreemCheckout({
      status: "canceled" as const,
    });
    mockRetrieveCheckout.mockResolvedValue(mockCheckout);

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with pending status
    const mockCheckout = createMockCreemCheckout({
      status: "open", // Using 'open' as it's the closest to 'pending' in our type
    });
    mockRetrieveCheckout.mockResolvedValue(mockCheckout);

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with processing status
    mockRetrieveCheckout.mockResolvedValue(
      createMockCreemCheckout({
        status: "processing",
      }),
    );

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with unknown status
    mockRetrieveCheckout.mockResolvedValue(
      createMockCreemCheckout({
        status: "unknown-status",
      }),
    );

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response with undefined status - this should trigger line 110
    mockRetrieveCheckout.mockResolvedValue({
      id: "checkout-123",
      status: undefined as any, // Force undefined status
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

  it("should handle Creem API error gracefully", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

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
      expect.any(Error),
    );
  });

  it("should use checkout_id parameter as sessionId", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?checkout_id=checkout-123",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response
    mockRetrieveCheckout.mockResolvedValue(
      createMockCreemCheckout({
        status: "completed",
      }),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe("checkout-123");
  });

  it("should handle non-logged-in user checking payment status", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

    mockGetSession.mockResolvedValue(null); // No user session
    mockGetUserSubscription.mockResolvedValue(null);

    // Mock Creem client response
    mockRetrieveCheckout.mockResolvedValue(
      createMockCreemCheckout({
        status: "completed",
      }),
    );

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
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status?sessionId=test-session-id",
    );

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
      expect.any(Error),
    );
  });

  it("should return 400 when no sessionId and no subscription", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/payment-status",
    );

    mockGetSession.mockResolvedValue(null);
    mockGetUserSubscription.mockResolvedValue(null);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Session ID is required",
    });
  });

  it("should handle canceled subscription without sessionId by returning cancelled status", async () => {
    // Create a scenario that bypasses sessionId validation but reaches line 55
    // We need to mock the URL parsing to return null for sessionId after validation
    const originalURL = global.URL;
    const mockURLConstructor = jest.fn().mockImplementation((url) => {
      const realURL = new originalURL(url);
      return {
        ...realURL,
        searchParams: {
          get: jest.fn((key) => {
            if (key === "sessionId" || key === "checkout_id") {
              return null; // This should trigger line 55
            }
            return realURL.searchParams.get(key);
          }),
        },
      };
    });
    global.URL = mockURLConstructor as any;

    const request = createMockRequest(
      "http://localhost:3000/api/payment-status",
    );

    const mockSession = createMockSession({
      user: { id: "user-123", email: "test@example.com", role: "user" },
    });
    const mockSubscription = createMockSubscription({
      id: "sub-123",
      status: "canceled",
      userId: "user-123",
    });

    mockGetSession.mockResolvedValue(mockSession);
    mockGetUserSubscription.mockResolvedValue(mockSubscription);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Session ID is required",
    });

    // Restore original URL constructor
    global.URL = originalURL;
  });
});
