import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockListApiKeys = jest.fn();
const mockGenerateApiKey = jest.fn();
const mockCheckRateLimit = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));

jest.mock("@/lib/api-keys/key-service", () => ({
  listApiKeys: mockListApiKeys,
  generateApiKey: mockGenerateApiKey,
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

describe("/api/api-keys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: { limit: 10, remaining: 9, resetAt: 2_000_000_000 },
    });
  });

  it("lists API keys for the current user", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    mockListApiKeys.mockResolvedValue([{ id: "key-1", name: "Primary" }]);

    const { GET } = await import("./route");
    const response = await GET({ headers: new Headers() } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.keys).toEqual([{ id: "key-1", name: "Primary" }]);
  });

  it("creates a new API key", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    mockGenerateApiKey.mockResolvedValue({
      rawKey: "ssk_example",
      record: {
        id: "key-1",
      },
    });

    const { POST } = await import("./route");
    const response = await POST({
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ name: "Primary" }),
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.rawKey).toBe("ssk_example");
    expect(mockGenerateApiKey).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Primary",
      rateLimit: undefined,
      expiresAt: null,
    });
  });

  it("rate-limits repeated API key creation", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: { limit: 10, remaining: 0, resetAt: 2_000_000_000 },
    });

    const { POST } = await import("./route");
    const response = await POST({
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ name: "Primary" }),
    } as any);

    expect(response.status).toBe(429);
    expect(mockGenerateApiKey).not.toHaveBeenCalled();
  });
});
