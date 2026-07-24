import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockGetPendingDeviceInfo = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockGetClientRateLimitKey = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: (...args: unknown[]) =>
    mockGetAuthSessionFromHeaders(...args),
}));

jest.mock("@/lib/device-auth/device-service", () => ({
  getPendingDeviceInfo: (...args: unknown[]) =>
    mockGetPendingDeviceInfo(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientRateLimitKey: (...args: unknown[]) =>
    mockGetClientRateLimitKey(...args),
}));

import { GET } from "./route";

describe("GET /api/v1/device/pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockGetClientRateLimitKey.mockReturnValue("203.0.113.10");
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: {
        limit: 30,
        remaining: 29,
        resetAt: 1_800_000_000,
      },
    });
    mockGetPendingDeviceInfo.mockResolvedValue({
      clientName: "SaaS CLI",
      clientVersion: "0.1.0",
      deviceOs: "macOS",
      deviceHostname: "builder",
    });
  });

  it("returns bounded device metadata for a pending code", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/v1/device/pending?user_code=ABCD-EFGH",
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      success: true,
      data: {
        device: {
          clientName: "SaaS CLI",
          clientVersion: "0.1.0",
          deviceOs: "macOS",
          deviceHostname: "builder",
        },
      },
    });
    expect(body.meta).toEqual({
      requestId: expect.any(String),
      timestamp: expect.any(String),
    });
    expect(mockCheckRateLimit).toHaveBeenCalledWith({
      scope: "device_pending",
      key: "user:user-1:ip:203.0.113.10",
      limit: 30,
      windowMs: 60_000,
    });
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("29");
    expect(mockGetPendingDeviceInfo).toHaveBeenCalledWith("ABCD-EFGH");
  });

  it("does not disclose device metadata to signed-out callers", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/v1/device/pending?user_code=ABCD-EFGH",
      ),
    );

    expect(response.status).toBe(401);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockGetPendingDeviceInfo).not.toHaveBeenCalled();
  });

  it("rate limits repeated device metadata requests", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: 30,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + 60,
      },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/v1/device/pending?user_code=ABCD-EFGH",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(body).toMatchObject({
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED" },
    });
    expect(mockGetPendingDeviceInfo).not.toHaveBeenCalled();
  });
});
