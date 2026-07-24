jest.mock("@/database", () => ({
  db: {
    insert: jest.fn(),
  },
}));

import { db } from "@/database";
import { checkRateLimit, getClientRateLimitKey } from "./rate-limit";

const mockInsert = jest.mocked(db.insert);
let mockReturning: jest.Mock;
let mockOnConflictDoUpdate: jest.Mock;
let mockValues: jest.Mock;

describe("database rate limit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReturning = jest.fn();
    mockOnConflictDoUpdate = jest.fn(() => ({
      returning: mockReturning,
    }));
    mockValues = jest.fn(() => ({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    }));
    mockInsert.mockReturnValue({ values: mockValues } as never);
    mockReturning.mockResolvedValue([
      {
        count: 1,
        resetAt: new Date("2026-07-24T00:01:00.000Z"),
      },
    ]);
  });

  it("atomically upserts a hashed bucket", async () => {
    const result = await checkRateLimit({
      key: "203.0.113.1",
      scope: "login",
      limit: 2,
      windowMs: 60_000,
    });

    expect(result).toEqual({
      allowed: true,
      info: {
        limit: 2,
        remaining: 1,
        resetAt: 1784851260,
      },
    });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "login",
        keyHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        count: 1,
      }),
    );
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("denies a bucket whose atomic count exceeds the limit", async () => {
    mockReturning.mockResolvedValue([
      {
        count: 3,
        resetAt: new Date("2026-07-24T00:01:00.000Z"),
      },
    ]);

    await expect(
      checkRateLimit({
        key: "203.0.113.1",
        scope: "login",
        limit: 2,
        windowMs: 60_000,
      }),
    ).resolves.toEqual({
      allowed: false,
      info: {
        limit: 2,
        remaining: 0,
        resetAt: 1784851260,
      },
    });
  });

  it("uses only the trusted proxy IP header, not user-agent", () => {
    const request = {
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "user-agent": "attacker-controlled",
      }),
    } as import("next/server").NextRequest;

    expect(getClientRateLimitKey(request)).toBe("10.0.0.1");
  });

  it("fails closed when the trusted proxy header is missing", () => {
    const request = {
      headers: new Headers({ "user-agent": "attacker-controlled" }),
    } as import("next/server").NextRequest;

    expect(() => getClientRateLimitKey(request)).toThrow(
      'Trusted client IP header "x-forwarded-for" is missing.',
    );
  });
});
