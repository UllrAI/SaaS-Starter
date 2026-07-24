import { NextRequest } from "next/server";
import { z } from "zod";
import env from "@/env";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { authorizeDeviceCode } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const MAX_DEVICE_APPROVAL_BODY_BYTES = 1024;
const approveDeviceSchema = z.object({
  userCode: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid device code format."),
});

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  return origin === new URL(env.NEXT_PUBLIC_APP_URL).origin;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!isAllowedOrigin(origin)) {
      throw new MachineAuthError({
        code: "CSRF_REJECTED",
        message: "Invalid request origin.",
        status: 403,
      });
    }

    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user?.id) {
      throw new MachineAuthError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to authorize a device.",
        status: 401,
      });
    }

    let body: unknown;
    try {
      body = await readJsonBodyWithLimit(
        request,
        MAX_DEVICE_APPROVAL_BODY_BYTES,
      );
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

    const parsed = approveDeviceSchema.safeParse(body);
    if (!parsed.success) {
      throw new MachineAuthError({
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        status: 400,
        details: { issues: parsed.error.issues },
      });
    }

    const result = await authorizeDeviceCode(
      parsed.data.userCode,
      session.user.id,
    );
    if (!result.success) {
      throw new MachineAuthError({
        code: "DEVICE_AUTH_FAILED",
        message: result.error ?? "Failed to authorize device.",
        status: 400,
      });
    }

    return apiSuccess({ authorized: true });
  } catch (error) {
    return handleApiError(error);
  }
}
