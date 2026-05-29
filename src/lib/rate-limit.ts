import { and, eq, lt, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/database";
import { rateLimitBuckets } from "@/database/schema";
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

function toResetAt(windowStartedAt: Date, windowMs: number): number {
  return Math.ceil((windowStartedAt.getTime() + windowMs) / 1000);
}

export async function checkPersistentRateLimit({
  key,
  limit,
  scope,
  windowMs,
}: CheckRateLimitParams): Promise<RateLimitResult> {
  const now = new Date();
  const expiredBefore = new Date(now.getTime() - windowMs);

  const [resetRow] = await db
    .update(rateLimitBuckets)
    .set({
      count: 1,
      windowStartedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(rateLimitBuckets.scope, scope),
        eq(rateLimitBuckets.key, key),
        lt(rateLimitBuckets.windowStartedAt, expiredBefore),
      ),
    )
    .returning({ windowStartedAt: rateLimitBuckets.windowStartedAt });

  if (resetRow) {
    return {
      allowed: true,
      info: {
        limit,
        remaining: Math.max(limit - 1, 0),
        resetAt: toResetAt(resetRow.windowStartedAt, windowMs),
      },
    };
  }

  const [insertRow] = await db
    .insert(rateLimitBuckets)
    .values({
      scope,
      key,
      count: 1,
      windowStartedAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [rateLimitBuckets.scope, rateLimitBuckets.key],
    })
    .returning({ windowStartedAt: rateLimitBuckets.windowStartedAt });

  if (insertRow) {
    return {
      allowed: true,
      info: {
        limit,
        remaining: Math.max(limit - 1, 0),
        resetAt: toResetAt(insertRow.windowStartedAt, windowMs),
      },
    };
  }

  const [incrementRow] = await db
    .update(rateLimitBuckets)
    .set({
      count: sql`${rateLimitBuckets.count} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(rateLimitBuckets.scope, scope),
        eq(rateLimitBuckets.key, key),
        lt(rateLimitBuckets.count, limit),
      ),
    )
    .returning({
      count: rateLimitBuckets.count,
      windowStartedAt: rateLimitBuckets.windowStartedAt,
    });

  if (incrementRow) {
    return {
      allowed: true,
      info: {
        limit,
        remaining: Math.max(limit - incrementRow.count, 0),
        resetAt: toResetAt(incrementRow.windowStartedAt, windowMs),
      },
    };
  }

  const row = await db.query.rateLimitBuckets.findFirst({
    where: and(
      eq(rateLimitBuckets.scope, scope),
      eq(rateLimitBuckets.key, key),
    ),
    columns: {
      windowStartedAt: true,
    },
  });

  return {
    allowed: false,
    info: {
      limit,
      remaining: 0,
      resetAt: toResetAt(row?.windowStartedAt ?? now, windowMs),
    },
  };
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
