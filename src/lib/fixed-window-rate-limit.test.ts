import { FixedWindowRateLimiter } from "./fixed-window-rate-limit";

describe("FixedWindowRateLimiter", () => {
  it("allows requests until the fixed window limit is reached", () => {
    const limiter = new FixedWindowRateLimiter();

    expect(
      limiter.check({ key: "client", limit: 2, now: 1_000, windowMs: 60_000 }),
    ).toMatchObject({
      allowed: true,
      remaining: 1,
      resetAt: 61_000,
      retryAfter: 0,
    });
    expect(
      limiter.check({ key: "client", limit: 2, now: 2_000, windowMs: 60_000 }),
    ).toMatchObject({
      allowed: true,
      remaining: 0,
      resetAt: 61_000,
      retryAfter: 0,
    });
    expect(
      limiter.check({ key: "client", limit: 2, now: 3_000, windowMs: 60_000 }),
    ).toMatchObject({
      allowed: false,
      remaining: 0,
      resetAt: 61_000,
      retryAfter: 58,
    });
  });

  it("resets and cleans up expired buckets", () => {
    const limiter = new FixedWindowRateLimiter();

    limiter.check({ key: "expired", limit: 1, now: 1_000, windowMs: 1_000 });
    expect(limiter.size()).toBe(1);

    const result = limiter.check({
      key: "fresh",
      limit: 1,
      now: 62_000,
      windowMs: 1_000,
    });

    expect(result.allowed).toBe(true);
    expect(limiter.size()).toBe(1);
  });
});
