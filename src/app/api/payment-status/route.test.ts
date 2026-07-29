type CheckoutResult = {
  status: "success" | "failed" | "pending" | "cancelled";
  ownerId: string | null;
  paymentMode: "subscription" | "one_time" | null;
};

const mockGetCheckoutStatus = jest.fn<
  Promise<CheckoutResult>,
  [checkoutId: string]
>();
const mockCheckRateLimit = jest.fn();
const mockGetClientRateLimitKey = jest.fn();
const mockGetAuthSessionFromHeaders = jest.fn();

beforeAll(() => {
  jest.resetModules();
  jest.doMock("@/lib/billing", () => ({
    billing: {
      getCheckoutStatus: mockGetCheckoutStatus,
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
    expect(mockGetCheckoutStatus).not.toHaveBeenCalled();
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
    expect(mockGetCheckoutStatus).not.toHaveBeenCalled();
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
    expect(mockGetCheckoutStatus).not.toHaveBeenCalled();
  });

  it("returns owned checkout status without exposing its identifier", async () => {
    mockGetCheckoutStatus.mockResolvedValue({
      status: "success",
      ownerId: "user-1",
      paymentMode: null,
    });

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockGetCheckoutStatus).toHaveBeenCalledWith("checkout-1");
    expect(data).toEqual({
      status: "success",
      paymentMode: null,
    });
    expect(data).not.toHaveProperty("sessionId");
  });

  it("returns an allowlisted one-time payment mode", async () => {
    mockGetCheckoutStatus.mockResolvedValue({
      status: "success",
      ownerId: "user-1",
      paymentMode: "one_time",
    });

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );

    expect(await response.json()).toEqual(
      expect.objectContaining({ paymentMode: "one_time" }),
    );
  });

  it.each(["pending", "cancelled", "failed"] as const)(
    "returns normalized provider state %s",
    async (status) => {
      mockGetCheckoutStatus.mockResolvedValue({
        status,
        ownerId: "user-1",
        paymentMode: null,
      });

      const response = await GET(
        createRequest(
          "http://localhost:3000/api/payment-status?session_id=checkout-1",
        ),
      );

      expect(await response.json()).toEqual(
        expect.objectContaining({ status }),
      );
    },
  );

  it.each([
    {
      status: "success" as const,
      ownerId: "other-user",
      paymentMode: null,
    },
    { status: "success" as const, ownerId: null, paymentMode: null },
  ])("hides foreign or unowned checkouts", async (checkout) => {
    mockGetCheckoutStatus.mockResolvedValue(checkout);

    const response = await GET(
      createRequest(
        "http://localhost:3000/api/payment-status?checkout_id=checkout-1",
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Checkout not found" });
  });

  it("returns a controlled gateway error and ignores URL status claims", async () => {
    mockGetCheckoutStatus.mockRejectedValue(
      new Error("Payment provider unavailable"),
    );

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
