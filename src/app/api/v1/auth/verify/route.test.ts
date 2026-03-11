import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRequireAuth = jest.fn();
const mockListApiKeys = jest.fn();
const mockFindUser = jest.fn();

jest.mock("@/lib/api-keys/require-auth", () => ({
  requireAuth: mockRequireAuth,
}));

jest.mock("@/lib/api-keys/key-service", () => ({
  listApiKeys: mockListApiKeys,
}));

jest.mock("@/database", () => ({
  db: {
    query: {
      users: {
        findFirst: mockFindUser,
      },
    },
  },
}));

describe("GET /api/v1/auth/verify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the authenticated user and current API key metadata", async () => {
    mockRequireAuth.mockResolvedValue({
      userId: "user-1",
      authMethod: "api_key",
      apiKeyId: "key-1",
      rateLimit: 60,
      rateLimitInfo: {
        limit: 60,
        remaining: 59,
        resetAt: 123,
      },
    });
    mockFindUser.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });
    mockListApiKeys.mockResolvedValue([
      {
        id: "key-1",
        name: "Production",
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET({ headers: new Headers() } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
      authMethod: "api_key",
      apiKey: {
        name: "Production",
        rateLimit: 60,
      },
    });
  });
});

