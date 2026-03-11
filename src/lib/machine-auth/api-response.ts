import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { toMachineAuthError } from "./error";
import type { RateLimitInfo } from "./types";

function createRequestId(): string {
  return randomBytes(8).toString("hex");
}

function buildRateLimitHeaders(
  info?: RateLimitInfo,
): Record<string, string> | undefined {
  if (!info) {
    return undefined;
  }

  return {
    "X-RateLimit-Limit": String(info.limit),
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": String(info.resetAt),
  };
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  rateLimitInfo?: RateLimitInfo,
) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId: createRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers: buildRateLimitHeaders(rateLimitInfo),
    },
  );
}

export function handleApiError(error: unknown, rateLimitInfo?: RateLimitInfo) {
  const normalizedError = toMachineAuthError(error);

  if (normalizedError.status >= 500) {
    console.error("[machine-auth] route error", {
      code: normalizedError.code,
      message: normalizedError.message,
      status: normalizedError.status,
      details: normalizedError.details,
      originalError: error,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
        details: normalizedError.details,
      },
      meta: {
        requestId: createRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: normalizedError.status,
      headers: buildRateLimitHeaders(rateLimitInfo),
    },
  );
}
