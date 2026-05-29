type CheckFixedWindowRateLimitParams = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

type FixedWindowBucket = {
  count: number;
  resetAt: number;
};

export type FixedWindowRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const CLEANUP_INTERVAL_MS = 60 * 1000;

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, FixedWindowBucket>();
  private nextCleanupAt = 0;

  check({
    key,
    limit,
    now = Date.now(),
    windowMs,
  }: CheckFixedWindowRateLimitParams): FixedWindowRateLimitResult {
    this.cleanupExpiredBuckets(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        limit,
        remaining: Math.max(limit - 1, 0),
        resetAt,
        retryAfter: 0,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - existing.count, 0),
      resetAt: existing.resetAt,
      retryAfter: 0,
    };
  }

  clear(): void {
    this.buckets.clear();
    this.nextCleanupAt = 0;
  }

  size(): number {
    return this.buckets.size;
  }

  private cleanupExpiredBuckets(now: number): void {
    if (now < this.nextCleanupAt) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }

    this.nextCleanupAt = now + CLEANUP_INTERVAL_MS;
  }
}
