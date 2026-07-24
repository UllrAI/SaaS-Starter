import { NextRequest } from "next/server";
import { z } from "zod";
import { refreshCliToken } from "@/lib/device-auth/token-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const REFRESH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const REFRESH_RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_REFRESH_BODY_BYTES = 1024;

const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .regex(/^ssr_[0-9a-f]{32}$/, "Invalid refresh token format."),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    scope: "device_refresh",
    key: getClientRateLimitKey(request),
    limit: REFRESH_RATE_LIMIT_MAX_REQUESTS,
    windowMs: REFRESH_RATE_LIMIT_WINDOW_MS,
  });

  try {
    if (!rateLimit.allowed) {
      throw new MachineAuthError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many refresh attempts. Please try again later.",
        status: 429,
        details: { resetAt: rateLimit.info.resetAt },
      });
    }

    let body: unknown;
    try {
      const rawBody = await readTextBodyWithLimit(
        request,
        MAX_REFRESH_BODY_BYTES,
      );
      body = JSON.parse(rawBody);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        throw new MachineAuthError({
          code: "BODY_TOO_LARGE",
          message: "Request body is too large.",
          status: 413,
        });
      }
      throw new MachineAuthError({
        code: "INVALID_BODY",
        message: "Request body must be valid JSON.",
        status: 400,
      });
    }

    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw new MachineAuthError({
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        status: 400,
        details: { issues: parsed.error.issues },
      });
    }

    const result = await refreshCliToken(parsed.data.refreshToken);
    if (!result) {
      throw new MachineAuthError({
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token. Please sign in again.",
        status: 401,
      });
    }

    return apiSuccess({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: "bearer" as const,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    return handleApiError(error, rateLimit.info);
  }
}
