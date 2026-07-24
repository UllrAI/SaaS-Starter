import { createHash } from "crypto";
import { lt, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/database";
import { rateLimitBuckets } from "@/database/schema";
import env from "@/env";
import type { RateLimitInfo } from "@/lib/machine-auth/types";

export type RateLimitResult = {
  allowed: boolean;
  info: RateLimitInfo;
};

type CheckRateLimitParams = {
  key: string;
  limit: number;
  scope: string;
  windowMs: number;
};

const CLEANUP_EVERY_REQUESTS = 1000;
let requestsUntilCleanup = CLEANUP_EVERY_REQUESTS;

function hashRateLimitKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function cleanupExpiredBuckets(): Promise<void> {
  requestsUntilCleanup -= 1;
  if (requestsUntilCleanup > 0) {
    return;
  }

  requestsUntilCleanup = CLEANUP_EVERY_REQUESTS;
  try {
    await db
      .delete(rateLimitBuckets)
      .where(lt(rateLimitBuckets.resetAt, sql<Date>`now()`));
  } catch (error) {
    console.error("Failed to clean expired rate limit buckets:", error);
  }
}

export async function checkRateLimit({
  key,
  limit,
  scope,
  windowMs,
}: CheckRateLimitParams): Promise<RateLimitResult> {
  const keyHash = hashRateLimitKey(key);

  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({
      scope,
      keyHash,
      count: 1,
      resetAt: sql<Date>`now() + ${windowMs} * interval '1 millisecond'`,
      updatedAt: sql<Date>`now()`,
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.scope, rateLimitBuckets.keyHash],
      set: {
        count: sql<number>`case
          when ${rateLimitBuckets.resetAt} <= now() then 1
          else least(${rateLimitBuckets.count} + 1, ${limit + 1})
        end`,
        resetAt: sql<Date>`case
          when ${rateLimitBuckets.resetAt} <= now()
            then now() + ${windowMs} * interval '1 millisecond'
          else ${rateLimitBuckets.resetAt}
        end`,
        updatedAt: sql<Date>`now()`,
      },
    })
    .returning({
      count: rateLimitBuckets.count,
      resetAt: rateLimitBuckets.resetAt,
    });

  if (!bucket) {
    throw new Error("Rate limit bucket update returned no result.");
  }

  const resetAt = bucket.resetAt.getTime();
  const allowed = bucket.count <= limit;
  await cleanupExpiredBuckets();

  return {
    allowed,
    info: {
      limit,
      remaining: allowed ? Math.max(limit - bucket.count, 0) : 0,
      resetAt: Math.ceil(resetAt / 1000),
    },
  };
}

export function getClientRateLimitKey(request: NextRequest): string {
  const forwardedValue = request.headers.get(env.RATE_LIMIT_IP_HEADER);
  if (!forwardedValue) {
    throw new Error(
      `Trusted client IP header "${env.RATE_LIMIT_IP_HEADER}" is missing.`,
    );
  }

  const values = forwardedValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const clientIp =
    env.RATE_LIMIT_IP_HEADER === "x-forwarded-for" ? values.at(-1) : values[0];

  if (!clientIp) {
    throw new Error(
      `Trusted client IP header "${env.RATE_LIMIT_IP_HEADER}" is empty.`,
    );
  }

  return clientIp;
}
