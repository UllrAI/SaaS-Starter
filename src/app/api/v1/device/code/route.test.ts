import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreateDeviceCode = jest.fn();
const mockCheckPersistentRateLimit = jest.fn();
const mockGetClientRateLimitKey = jest.fn();

jest.mock("@/lib/device-auth/device-service", () => ({
  createDeviceCode: mockCreateDeviceCode,
}));

jest.mock("@/lib/rate-limit", () => ({
  checkPersistentRateLimit: mockCheckPersistentRateLimit,
  getClientRateLimitKey: mockGetClientRateLimitKey,
}));

describe("POST /api/v1/device/code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientRateLimitKey.mockReturnValue("203.0.113.10:SaaS CLI test");
    mockCheckPersistentRateLimit.mockResolvedValue({
      allowed: true,
      info: {
        limit: 20,
        remaining: 19,
        resetAt: 1_800_000_000,
      },
    });
  });

  function createRequest(body: unknown, ip = "203.0.113.10") {
    return {
      headers: {
        get: (name: string) => {
          if (name === "x-forwarded-for") return ip;
          if (name === "user-agent") return "SaaS CLI test";
          return null;
        },
      },
      json: jest.fn().mockResolvedValue(body),
    } as any;
  }

  it("creates a device code for CLI login", async () => {
    mockCreateDeviceCode.mockResolvedValue({
      deviceCode: "0123456789abcdef0123456789abcdef01234567",
      userCode: "ABCD-EFGH",
      verificationUri: "http://localhost:3000/device",
      expiresIn: 900,
      interval: 5,
    });

    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        clientName: "SaaS CLI",
        clientVersion: "0.1.0",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.userCode).toBe("ABCD-EFGH");
  });

  it("rejects invalid request bodies", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        clientName: "x".repeat(101),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_FAILED");
  });

  it("rate limits repeated device code requests", async () => {
    mockCheckPersistentRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: 20,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + 60,
      },
    });

    const { POST } = await import("./route");
    const limitedResponse = await POST(
      createRequest({ clientName: "SaaS CLI" }),
    );
    const payload = await limitedResponse.json();

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.headers.get("Retry-After")).toBeTruthy();
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });
});
