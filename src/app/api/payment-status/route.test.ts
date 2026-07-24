type CheckoutResult = {
  status?: string;
  metadata?: Record<string, unknown>;
};

const mockRetrieveCheckout = jest.fn<
  Promise<CheckoutResult>,
  [checkoutId: string]
>();
const mockCheckRateLimit = jest.fn();
const mockGetClientRateLimitKey = jest.fn();
const mockGetAuthSessionFromHeaders = jest.fn();

beforeAll(() => {
  jest.resetModules();
  jest.doMock("@/lib/billing/creem/client", () => ({
    creemClient: {
      checkouts: {
        retrieve: mockRetrieveCheckout,
      },
    },
  }));
  jest.doMock("@/lib/rate-limit", () => ({
    checkRateLimit: mockCheckRateLimit,
    getClientRateLimitKey: mockGetClientRateLimitKey,
  }));
  jest.doMock("@/lib/auth/session", () => ({
    getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
  }));
});

describe("Payment Status API", () => {
  let GET: (request: import("next/server").NextRequest) => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import("./route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientRateLimitKey.mockReturnValue("127.0.0.1");
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: { limit: 30, remaining: 29, resetAt: 1_800_000_000 },
    });
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: { id: "user-1" },
    });
  });

  function createRequest(url: string) {
    return {
      url,
      headers: new Headers(),
    } as import("next/server").NextRequest;
  }

  it("requires a bounded checkout reference", async () => {
    const missing = await GET(
      createRequest("http://localhost:3000/api/payment-status"),
    );
    const oversized = await GET(
      createRequest(
        `http://localhost:3000/api/payment-status?checkout_id=${"x".repeat(256)}`,
      ),
    );

    expect(missing.status).toBe(400);
    expect(oversized.status).toBe(400);
    expect(mockGetAuthSessionFromHeaders).not.toHaveBeenCalled();
    expect(mockRetrieveCheckout).not.toHaveBeenCalled();
  });

  it("rate limits before authentication or provider calls", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: 30,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + 60,
      },
    });

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockGetAuthSessionFromHeaders).not.toHaveBeenCalled();
    expect(mockRetrieveCheckout).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required",
    });
    expect(mockRetrieveCheckout).not.toHaveBeenCalled();
  });

  it("returns owned checkout status without exposing its identifier", async () => {
    mockRetrieveCheckout.mockResolvedValue({
      status: "completed",
      metadata: { userId: "user-1" },
    });

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockRetrieveCheckout).toHaveBeenCalledWith("checkout-1");
    expect(data).toEqual({
      status: "success",
      message: "Payment completed successfully",
    });
    expect(data).not.toHaveProperty("sessionId");
  });

  it.each([
    [{ status: "open", metadata: { userId: "user-1" } }, "pending"],
    [{ status: "canceled", metadata: { userId: "user-1" } }, "cancelled"],
    [{ status: "expired", metadata: { userId: "user-1" } }, "failed"],
  ])("maps provider state %#", async (checkout, expectedStatus) => {
    mockRetrieveCheckout.mockResolvedValue(checkout);

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?session_id=checkout-1",
      ),
    );

    expect(await response.json()).toEqual(
      expect.objectContaining({ status: expectedStatus }),
    );
  });

  it.each([
    { status: "completed", metadata: { userId: "other-user" } },
    { status: "completed" },
  ])("hides foreign or unowned checkouts", async (checkout) => {
    mockRetrieveCheckout.mockResolvedValue(checkout);

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Checkout not found" });
  });

  it("returns a controlled gateway error and ignores URL status claims", async () => {
    mockRetrieveCheckout.mockRejectedValue(new Error("Creem unavailable"));

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1&status=success",
      ),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Unable to verify payment status",
    });
  });
});
