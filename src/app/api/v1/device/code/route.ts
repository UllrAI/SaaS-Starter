import { NextRequest } from "next/server";
import { z } from "zod";
import env from "@/env";
import { createDeviceCode } from "@/lib/device-auth/device-service";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const DEVICE_CODE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEVICE_CODE_RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_DEVICE_CODE_BODY_BYTES = 2 * 1024;

const deviceCodeSchema = z.object({
  clientName: z.string().max(100).optional(),
  clientVersion: z.string().max(50).optional(),
  deviceOs: z.string().max(100).optional(),
  deviceHostname: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    scope: "device_code",
    key: getClientRateLimitKey(request),
    limit: DEVICE_CODE_RATE_LIMIT_MAX_REQUESTS,
    windowMs: DEVICE_CODE_RATE_LIMIT_WINDOW_MS,
  });

  try {
    if (!rateLimit.allowed) {
      throw new MachineAuthError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many device code requests. Please try again later.",
        status: 429,
        details: {
          resetAt: rateLimit.info.resetAt,
        },
      });
    }

    let body: unknown;
    try {
      body = await readJsonBodyWithLimit(request, MAX_DEVICE_CODE_BODY_BYTES);
    } catch (error) {
      throw new MachineAuthError({
        code:
          error instanceof RequestBodyTooLargeError
            ? "BODY_TOO_LARGE"
            : "INVALID_BODY",
        message:
          error instanceof RequestBodyTooLargeError
            ? "Request body is too large."
            : "Request body must be valid JSON.",
        status: error instanceof RequestBodyTooLargeError ? 413 : 400,
      });
    }

    const parsed = deviceCodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new MachineAuthError({
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        status: 400,
        details: { issues: parsed.error.issues },
      });
    }

    const result = await createDeviceCode({
      ...parsed.data,
      verificationBaseUri: env.NEXT_PUBLIC_APP_URL,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, rateLimit.info);
  }
}
