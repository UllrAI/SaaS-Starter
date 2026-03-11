import { NextRequest } from "next/server";
import { z } from "zod";
import env from "@/env";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { authorizeDeviceCode } from "@/lib/device-auth/device-service";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";

const approveDeviceSchema = z.object({
  userCode: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid device code format."),
});

function resolveAllowedOrigins(request: NextRequest): Set<string> {
  const allowedOrigins = new Set<string>([
    new URL(env.NEXT_PUBLIC_APP_URL).origin,
    request.nextUrl.origin,
  ]);
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(/:$/, "");

  if (host && protocol) {
    allowedOrigins.add(`${protocol}://${host}`);
  }

  return allowedOrigins;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const allowedOrigins = resolveAllowedOrigins(request);
    if (!origin || !allowedOrigins.has(origin)) {
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

    const body = await request.json().catch(() => null);
    if (!body) {
      throw new MachineAuthError({
        code: "INVALID_BODY",
        message: "Request body must be valid JSON.",
        status: 400,
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

    const result = await authorizeDeviceCode(parsed.data.userCode, session.user.id);
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
