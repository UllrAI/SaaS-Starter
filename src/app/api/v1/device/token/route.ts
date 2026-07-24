import { NextRequest } from "next/server";
import { z } from "zod";
import { pollDeviceCode } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const MAX_DEVICE_TOKEN_BODY_BYTES = 1024;
const deviceTokenSchema = z.object({
  deviceCode: z.string().regex(/^[0-9a-f]{40}$/, "Invalid device code format."),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await readJsonBodyWithLimit(request, MAX_DEVICE_TOKEN_BODY_BYTES);
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

    const parsed = deviceTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw new MachineAuthError({
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        status: 400,
        details: { issues: parsed.error.issues },
      });
    }

    const result = await pollDeviceCode(parsed.data.deviceCode);
    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
