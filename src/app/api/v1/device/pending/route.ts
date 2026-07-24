import { NextRequest } from "next/server";
import { z } from "zod";

import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { getPendingDeviceInfo } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";

const DEVICE_PENDING_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEVICE_PENDING_RATE_LIMIT_MAX_REQUESTS = 30;
const userCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid device code format.");

export async function GET(request: NextRequest) {
  let rateLimit: Awaited<ReturnType<typeof checkRateLimit>> | undefined;

  try {
    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user?.id) {
      throw new MachineAuthError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to inspect a device request.",
        status: 401,
      });
    }

    rateLimit = await checkRateLimit({
      scope: "device_pending",
      key: `user:${session.user.id}:ip:${getClientRateLimitKey(request)}`,
      limit: DEVICE_PENDING_RATE_LIMIT_MAX_REQUESTS,
      windowMs: DEVICE_PENDING_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      throw new MachineAuthError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many device review requests. Please try again later.",
        status: 429,
        details: { resetAt: rateLimit.info.resetAt },
      });
    }

    const parsed = userCodeSchema.safeParse(
      request.nextUrl.searchParams.get("user_code"),
    );
    if (!parsed.success) {
      throw new MachineAuthError({
        code: "VALIDATION_FAILED",
        message: "Invalid device code format.",
        status: 400,
      });
    }

    const device = await getPendingDeviceInfo(parsed.data);
    if (!device) {
      throw new MachineAuthError({
        code: "DEVICE_CODE_NOT_FOUND",
        message: "Device code is invalid or expired.",
        status: 404,
      });
    }

    return apiSuccess({ device }, 200, rateLimit.info);
  } catch (error) {
    return handleApiError(error, rateLimit?.info);
  }
}
