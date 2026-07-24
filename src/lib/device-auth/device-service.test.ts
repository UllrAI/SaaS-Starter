import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockFindFirst = jest.fn();
const mockTransaction = jest.fn();
const mockTxReturning = jest.fn();
const mockTxWhere = jest.fn(() => ({ returning: mockTxReturning }));
const mockTxSet = jest.fn(() => ({ where: mockTxWhere }));
const mockTxUpdate = jest.fn(() => ({ set: mockTxSet }));
const mockCreateCliToken = jest.fn();
const mockSql = jest.fn();

const mockTx = {
  insert: jest.fn(),
  update: mockTxUpdate,
};

jest.mock("@/database", () => ({
  db: {
    query: {
      deviceCodes: {
        findFirst: mockFindFirst,
      },
    },
    transaction: mockTransaction,
  },
}));

jest.mock("@/database/schema", () => ({
  deviceCodes: {
    attempts: "deviceCodes.attempts",
    deviceCode: "deviceCodes.deviceCode",
    expiresAt: "deviceCodes.expiresAt",
    id: "deviceCodes.id",
    status: "deviceCodes.status",
    userCode: "deviceCodes.userCode",
  },
}));

jest.mock("drizzle-orm", () => ({
  and: jest.fn((...conditions: unknown[]) => conditions),
  eq: jest.fn((left: unknown, right: unknown) => [left, right]),
  lt: jest.fn((left: unknown, right: unknown) => [left, right]),
  sql: mockSql,
}));

jest.mock("./token-service", () => ({
  createCliToken: mockCreateCliToken,
}));

describe("pollDeviceCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue({
      id: "device-code-1",
      status: "authorized",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      deviceHostname: "workstation",
      clientName: "SaaS CLI",
      deviceOs: "darwin",
      clientVersion: "1.0.0",
    });
    mockTxReturning.mockResolvedValue([{ id: "device-code-1" }]);
    mockTransaction.mockImplementation(
      async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
        callback(mockTx),
    );
    mockCreateCliToken.mockResolvedValue({
      accessToken: "sst_access",
      refreshToken: "ssr_refresh",
      expiresIn: 3600,
    });
  });

  it("consumes the device code and creates its token in one transaction", async () => {
    const { pollDeviceCode } = await import("./device-service");

    await expect(pollDeviceCode("device-code")).resolves.toEqual({
      type: "token",
      data: {
        accessToken: "sst_access",
        refreshToken: "ssr_refresh",
        tokenType: "bearer",
        expiresIn: 3600,
      },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSql).toHaveBeenCalled();
    expect(mockCreateCliToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        name: "workstation - SaaS CLI",
      }),
      mockTx,
    );
  });

  it("does not issue a token when another poll consumed the code", async () => {
    mockTxReturning.mockResolvedValue([]);
    const { pollDeviceCode } = await import("./device-service");

    await expect(pollDeviceCode("device-code")).resolves.toEqual({
      type: "pending",
      data: {
        status: "authorization_pending",
      },
    });
    expect(mockCreateCliToken).not.toHaveBeenCalled();
  });

  it("keeps token creation failure inside the consuming transaction", async () => {
    mockCreateCliToken.mockRejectedValue(new Error("insert failed"));
    const { pollDeviceCode } = await import("./device-service");

    await expect(pollDeviceCode("device-code")).rejects.toThrow(
      "insert failed",
    );
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
