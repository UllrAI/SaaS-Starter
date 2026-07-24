jest.mock("@/lib/device-auth/token-service", () => ({
  refreshCliToken: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(),
  getClientRateLimitKey: jest.fn(),
}));

jest.mock("@/lib/http/request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: jest.fn(),
  };
});

import { refreshCliToken } from "@/lib/device-auth/token-service";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { POST } from "./route";

const mockRefreshCliToken = jest.mocked(refreshCliToken);
const mockCheckRateLimit = jest.mocked(checkRateLimit);
const mockGetClientRateLimitKey = jest.mocked(getClientRateLimitKey);
const mockReadTextBodyWithLimit = jest.mocked(readTextBodyWithLimit);

describe("POST /api/v1/device/refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientRateLimitKey.mockReturnValue("127.0.0.1");
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: { limit: 20, remaining: 19, resetAt: 1_800_000_000 },
    });
    mockRefreshCliToken.mockResolvedValue({
      accessToken: `sst_${"b".repeat(32)}`,
      refreshToken: `ssr_${"c".repeat(32)}`,
      expiresIn: 3600,
    });
    mockReadTextBodyWithLimit.mockImplementation(async (request) =>
      request.text(),
    );
  });

  function createRequest(body: string, headers?: HeadersInit) {
    return {
      headers: new Headers({
        "content-type": "application/json",
        ...headers,
      }),
      text: async () => body,
    } as unknown as import("next/server").NextRequest;
  }

  it("rotates a strictly formatted refresh token", async () => {
    const refreshToken = `ssr_${"a".repeat(32)}`;

    const response = await POST(
      createRequest(JSON.stringify({ refreshToken })),
    );

    expect(response.status).toBe(200);
    expect(mockRefreshCliToken).toHaveBeenCalledWith(refreshToken);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: {
          accessToken: `sst_${"b".repeat(32)}`,
          refreshToken: `ssr_${"c".repeat(32)}`,
          tokenType: "bearer",
          expiresIn: 3600,
        },
      }),
    );
  });

  it("rejects malformed refresh tokens before database access", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ refreshToken: "ssr_too-short" })),
    );

    expect(response.status).toBe(400);
    expect(mockRefreshCliToken).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before parsing", async () => {
    mockReadTextBodyWithLimit.mockRejectedValue(new RequestBodyTooLargeError());
    const response = await POST(
      createRequest(JSON.stringify({ refreshToken: `ssr_${"a".repeat(32)}` }), {
        "content-length": "2048",
      }),
    );

    expect(response.status).toBe(413);
    expect(mockRefreshCliToken).not.toHaveBeenCalled();
  });

  it("rate limits refresh attempts before reading the body", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: { limit: 20, remaining: 0, resetAt: 1_800_000_000 },
    });

    const response = await POST(createRequest("not-json"));

    expect(response.status).toBe(429);
    expect(mockReadTextBodyWithLimit).not.toHaveBeenCalled();
    expect(mockRefreshCliToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the token lost a concurrent CAS race", async () => {
    mockRefreshCliToken.mockResolvedValue(null);

    const response = await POST(
      createRequest(JSON.stringify({ refreshToken: `ssr_${"a".repeat(32)}` })),
    );

    expect(response.status).toBe(401);
  });
});
