import { NextRequest } from "next/server";
import { z } from "zod";
import env from "@/env";
import { createDeviceCode } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";

const deviceCodeSchema = z.object({
  clientName: z.string().max(100).optional(),
  clientVersion: z.string().max(50).optional(),
  deviceOs: z.string().max(100).optional(),
  deviceHostname: z.string().max(100).optional(),
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
    return handleApiError(error);
  }
}

