import type { NextRequest } from "next/server";
import { FixedWindowRateLimiter } from "@/lib/fixed-window-rate-limit";
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

const rateLimiter = new FixedWindowRateLimiter();

function getBucketKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

export function checkRateLimit({
  key,
  limit,
  scope,
  windowMs,
}: CheckRateLimitParams): Promise<RateLimitResult> {
  const result = rateLimiter.check({
    key: getBucketKey(scope, key),
    limit,
    windowMs,
  });

  return Promise.resolve({
    allowed: result.allowed,
    info: {
      limit: result.limit,
      remaining: result.remaining,
      resetAt: Math.ceil(result.resetAt / 1000),
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
  rateLimiter.clear();
}
