import { UPLOAD_CONFIG } from "@/lib/config/upload";

interface UploadRateLimitBucket {
  count: number;
  resetAt: number;
}

interface UploadRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

const buckets = new Map<string, UploadRateLimitBucket>();

export function checkUploadRateLimit(userId: string): UploadRateLimitResult {
  const now = Date.now();
  const windowMs = UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_WINDOW_MS;
  const limit = UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS;
  const existing = buckets.get(userId);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(userId, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
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
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfter: 0,
  };
}

export function clearUploadRateLimitForTests(): void {
  buckets.clear();
}
