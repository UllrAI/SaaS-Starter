import { NextRequest } from "next/server";
import { z } from "zod";
import { pollDeviceCode } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";

const deviceTokenSchema = z.object({
  deviceCode: z
    .string()
    .regex(/^[0-9a-f]{40}$/, "Invalid device code format."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      throw new MachineAuthError({
        code: "INVALID_BODY",
        message: "Request body must be valid JSON.",
        status: 400,
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

