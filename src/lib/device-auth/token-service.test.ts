import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockInsertValues = jest.fn();
const mockInsert = jest.fn(() => ({
  values: mockInsertValues,
}));
const mockUpdateWhere = jest.fn();
const mockUpdateSet = jest.fn(() => ({
  where: mockUpdateWhere,
}));
const mockUpdate = jest.fn(() => ({
  set: mockUpdateSet,
}));
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockIsMachineAuthUserActive = jest.fn();

jest.mock("@/database", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    query: {
      cliTokens: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
  },
}));

jest.mock("@/lib/machine-auth/user-access", () => ({
  isMachineAuthUserActive: mockIsMachineAuthUserActive,
}));

describe("token-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockIsMachineAuthUserActive.mockResolvedValue(true);
  });

  it("creates hashed CLI tokens", async () => {
    const { createCliToken } = await import("./token-service");
    const result = await createCliToken({
      userId: "user-1",
      name: "CLI Device",
      deviceOs: "darwin",
      deviceHostname: "devbox",
      cliVersion: "0.1.0",
    });

    expect(result.accessToken.startsWith("sst_")).toBe(true);
    expect(result.refreshToken.startsWith("ssr_")).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        name: "CLI Device",
        tokenHash: expect.any(String),
        refreshTokenHash: expect.any(String),
        deviceOs: "darwin",
        deviceHostname: "devbox",
        cliVersion: "0.1.0",
      }),
    );
  });

  it("validates an active CLI token", async () => {
    mockFindFirst.mockResolvedValue({
      id: "cli-1",
      userId: "user-1",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const { validateCliToken } = await import("./token-service");
    const result = await validateCliToken("sst_token_123");

    expect(result).toEqual({
      userId: "user-1",
      cliTokenId: "cli-1",
    });
  });

  it("refreshes a CLI token with the current refresh token", async () => {
    mockFindFirst.mockResolvedValue({
      id: "cli-1",
      userId: "user-1",
      isActive: true,
      refreshExpiresAt: new Date(Date.now() + 60_000),
    });

    const { refreshCliToken } = await import("./token-service");
    const result = await refreshCliToken("ssr_refresh_123");

    expect(result).toEqual({
      accessToken: expect.stringMatching(/^sst_/),
      refreshToken: expect.stringMatching(/^ssr_/),
      expiresIn: expect.any(Number),
    });
    expect(mockUpdate).toHaveBeenCalled();
  });
});

