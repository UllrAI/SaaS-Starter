import type { SpyInstance } from "@/../jest.setup";

type CheckoutFunction = (checkoutId: string) => Promise<{ status?: string }>;

const mockRetrieveCheckout = jest.fn() as jest.MockedFunction<CheckoutFunction>;

beforeAll(() => {
  jest.resetModules();

  jest.doMock("@/lib/billing/creem/client", () => ({
    __esModule: true,
    creemClient: {
      checkouts: {
        retrieve: mockRetrieveCheckout,
      },
    },
  }));
});

describe("Payment Status API", () => {
  let consoleErrorSpy: SpyInstance;
  let GET: (request: import("next/server").NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const routeModule = await import("./route");
    GET = routeModule.GET;
  });

  const createMockRequest = (url: string) =>
    ({
      url,
      headers: {
        get: () => "",
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      cookies: { get: () => null, has: () => false },
      nextUrl: new URL(url),
    }) as unknown as import("next/server").NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when neither checkout id nor status is provided", async () => {
    const response = await GET(
      createMockRequest("http://localhost:3000/api/payment-status"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Checkout ID or status is required",
    });
  });

  it("maps direct failed status without trusting success URLs", async () => {
    const failedResponse = await GET(
      createMockRequest(
        "http://localhost:3000/api/payment-status?status=failed",
      ),
    );
    const failedData = await failedResponse.json();

    expect(failedResponse.status).toBe(200);
    expect(failedData).toEqual({
      status: "failed",
      message: "Payment failed",
    });

    const successResponse = await GET(
      createMockRequest(
        "http://localhost:3000/api/payment-status?status=success",
      ),
    );
    const successData = await successResponse.json();

    expect(successResponse.status).toBe(200);
    expect(successData).toEqual({
      status: "pending",
      message:
        "Payment completed, but we still need the checkout reference to verify it.",
    });
  });

  it("uses checkout_id to retrieve the authoritative payment state", async () => {
    mockRetrieveCheckout.mockResolvedValue({ status: "completed" });

    const response = await GET(
      createMockRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-123&status=failed",
      ),
    );
    const data = await response.json();

    expect(mockRetrieveCheckout).toHaveBeenCalledWith("checkout-123");
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "success",
      message: "Payment completed successfully",
      sessionId: "checkout-123",
    });
  });

  it("falls back to direct failure when checkout verification errors", async () => {
    mockRetrieveCheckout.mockRejectedValue(new Error("Creem API error"));

    const response = await GET(
      createMockRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-123&status=failed",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "failed",
      message: "Payment failed",
      sessionId: "checkout-123",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Error checking Creem payment status:",
      expect.any(Error),
    );
  });

  it("treats unknown provider states as pending", async () => {
    mockRetrieveCheckout.mockResolvedValue({ status: "unknown-status" });

    const response = await GET(
      createMockRequest(
        "http://localhost:3000/api/payment-status?sessionId=test-session-id",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
      sessionId: "test-session-id",
    });
  });
});
