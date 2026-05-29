import type { NextRequest } from "next/server";
import type { RateLimitInfo } from "@/lib/machine-auth/types";

export type RateLimitResult =
  | {
      allowed: true;
      info: RateLimitInfo;
    }
  | {
      allowed: false;
      info: RateLimitInfo;
    };

type CheckRateLimitParams = {
  key: string;
  limit: number;
  scope: string;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getBucketKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

export function checkRateLimit({
  key,
  limit,
  scope,
  windowMs,
}: CheckRateLimitParams): Promise<RateLimitResult> {
  const now = Date.now();
  const bucketKey = getBucketKey(scope, key);
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });

    return Promise.resolve({
      allowed: true,
      info: {
        limit,
        remaining: Math.max(limit - 1, 0),
        resetAt: Math.ceil(resetAt / 1000),
      },
    });
  }

  if (existing.count >= limit) {
    return Promise.resolve({
      allowed: false,
      info: {
        limit,
        remaining: 0,
        resetAt: Math.ceil(existing.resetAt / 1000),
      },
    });
  }

  existing.count += 1;

  return Promise.resolve({
    allowed: true,
    info: {
      limit,
      remaining: Math.max(limit - existing.count, 0),
      resetAt: Math.ceil(existing.resetAt / 1000),
    },
  });
}

export function getClientRateLimitKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown-ip";
  const userAgent =
    request.headers.get("user-agent")?.trim() || "unknown-agent";

  return `${clientIp}:${userAgent}`;
}

export function clearRateLimitForTests(): void {
  buckets.clear();
}
