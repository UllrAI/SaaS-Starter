const mockLimit = jest.fn();
const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));
const mockFrom = jest.fn(() => ({
  where: mockWhere,
}));
const mockSelect = jest.fn(() => ({
  from: mockFrom,
}));
const mockEq = jest.fn();

jest.mock("@/database", () => ({
  db: {
    select: mockSelect,
  },
}));

jest.mock("@/database/schema", () => ({
  users: {
    banned: "users.banned",
    banReason: "users.banReason",
    email: "users.email",
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: mockEq,
}));

jest.mock("@/lib/auth/feedback", () => ({
  resolveAuthFeedback: jest.fn(
    ({ banReason }: { banReason?: string | null }) => ({
      key: "banned",
      banReason: banReason ?? null,
    }),
  ),
}));

describe("GET /api/auth/account-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns active when email is missing", async () => {
    const { GET } = await import("./route");
    const response = await GET({
      url: "http://localhost/api/auth/account-status",
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "active" });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns active when user is not banned", async () => {
    const { GET } = await import("./route");
    mockLimit.mockResolvedValue([{ banned: false }]);

    const response = await GET({
      url: "http://localhost/api/auth/account-status?email=test%40example.com",
    } as any);

    await expect(response.json()).resolves.toEqual({ status: "active" });
    expect(mockEq).toHaveBeenCalledWith("users.email", "test@example.com");
  });

  it("returns banned state with message when user is disabled", async () => {
    const { GET } = await import("./route");
    mockLimit.mockResolvedValue([{ banned: true, banReason: "Manual review" }]);

    const response = await GET({
      url: "http://localhost/api/auth/account-status?email=test%40example.com",
    } as any);

    await expect(response.json()).resolves.toEqual({
      status: "banned",
      feedback: {
        key: "banned",
        banReason: "Manual review",
      },
    });
  });
});
