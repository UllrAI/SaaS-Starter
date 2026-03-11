import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockValidateApiKey = jest.fn();
const mockUpdateLastUsedAt = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockValidateCliToken = jest.fn();
const mockUpdateCliTokenLastUsed = jest.fn();

jest.mock("./key-service", () => ({
  validateApiKey: mockValidateApiKey,
  updateLastUsedAt: mockUpdateLastUsedAt,
}));

jest.mock("./rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

jest.mock("@/lib/device-auth/token-service", () => ({
  validateCliToken: mockValidateCliToken,
  updateCliTokenLastUsed: mockUpdateCliTokenLastUsed,
}));

describe("requireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateLastUsedAt.mockResolvedValue(undefined);
    mockUpdateCliTokenLastUsed.mockResolvedValue(undefined);
  });

  it("throws when authorization header is missing", async () => {
    const { requireAuth } = await import("./require-auth");

    await expect(
      requireAuth({
        headers: {
          get: () => null,
        },
      } as any),
    ).rejects.toMatchObject({
      code: "MISSING_AUTH",
      status: 401,
    });
  });

  it("authenticates API keys and returns rate limit metadata", async () => {
    mockValidateApiKey.mockResolvedValue({
      userId: "user-1",
      apiKeyId: "key-1",
      rateLimit: 60,
    });
    mockCheckRateLimit.mockResolvedValue({
      limit: 60,
      remaining: 59,
      resetAt: 123,
    });

    const { requireAuth } = await import("./require-auth");
    const result = await requireAuth({
      headers: {
        get: () => "Bearer ssk_test_123",
      },
    } as any);

    expect(result).toEqual({
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
    expect(mockUpdateLastUsedAt).toHaveBeenCalledWith("key-1");
  });

  it("authenticates CLI tokens", async () => {
    mockValidateCliToken.mockResolvedValue({
      userId: "user-2",
      cliTokenId: "cli-1",
    });

    const { requireAuth } = await import("./require-auth");
    const result = await requireAuth({
      headers: {
        get: () => "Bearer sst_test_123",
      },
    } as any);

    expect(result).toEqual({
      userId: "user-2",
      authMethod: "cli_token",
      cliTokenId: "cli-1",
    });
    expect(mockUpdateCliTokenLastUsed).toHaveBeenCalledWith("cli-1");
  });

  it("rejects unknown token prefixes", async () => {
    const { requireAuth } = await import("./require-auth");

    await expect(
      requireAuth({
        headers: {
          get: () => "Bearer nope_123",
        },
      } as any),
    ).rejects.toMatchObject({
      code: "INVALID_AUTH",
      status: 401,
    });
  });
});
