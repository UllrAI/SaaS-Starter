import { NextRequest } from "next/server";
import { z } from "zod";
import { refreshCliToken } from "@/lib/device-auth/token-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import { CLI_REFRESH_PREFIX } from "@/lib/machine-auth/constants";

const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .startsWith(CLI_REFRESH_PREFIX, "Invalid refresh token format."),
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
    return handleApiError(error);
  }
}

