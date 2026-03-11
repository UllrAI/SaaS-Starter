import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/database";
import { apiKeys } from "@/database/schema";
import { MachineAuthError } from "@/lib/machine-auth/error";
import { RATE_LIMIT_WINDOW_MS } from "@/lib/machine-auth/constants";
import type { RateLimitInfo } from "./types";

export async function checkRateLimit(
  apiKeyId: string,
  maxPerMinute: number,
): Promise<RateLimitInfo> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const [resetRow] = await db
    .update(apiKeys)
    .set({
      requestCountInWindow: 1,
      windowStartedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(apiKeys.id, apiKeyId),
        or(
          isNull(apiKeys.windowStartedAt),
          lt(apiKeys.windowStartedAt, windowStart),
        ),
      ),
    )
    .returning({ windowStartedAt: apiKeys.windowStartedAt });

  if (resetRow) {
    return {
      limit: maxPerMinute,
      remaining: Math.max(maxPerMinute - 1, 0),
      resetAt: Math.ceil((now.getTime() + RATE_LIMIT_WINDOW_MS) / 1000),
    };
  }

  const [incrementRow] = await db
    .update(apiKeys)
    .set({
      requestCountInWindow: sql`${apiKeys.requestCountInWindow} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(apiKeys.id, apiKeyId),
        lt(apiKeys.requestCountInWindow, maxPerMinute),
      ),
    )
    .returning({
      requestCountInWindow: apiKeys.requestCountInWindow,
      windowStartedAt: apiKeys.windowStartedAt,
    });

  if (incrementRow) {
    return {
      limit: maxPerMinute,
      remaining: Math.max(maxPerMinute - incrementRow.requestCountInWindow, 0),
      resetAt: Math.ceil(
        (incrementRow.windowStartedAt!.getTime() + RATE_LIMIT_WINDOW_MS) / 1000,
      ),
    };
  }

  const row = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, apiKeyId),
    columns: {
      windowStartedAt: true,
    },
  });

  if (!row) {
    throw new MachineAuthError({
      code: "API_KEY_NOT_FOUND",
      message: "API key not found.",
      status: 401,
    });
  }

  throw new MachineAuthError({
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Please try again later.",
    status: 429,
    details: {
      limit: maxPerMinute,
      resetAt: Math.ceil(
        ((row.windowStartedAt?.getTime() ?? now.getTime()) + RATE_LIMIT_WINDOW_MS)
          / 1000,
      ),
    },
  });
}

