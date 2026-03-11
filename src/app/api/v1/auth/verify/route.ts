import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { users } from "@/database/schema";
import { listApiKeys } from "@/lib/api-keys/key-service";
import { requireAuth } from "@/lib/api-keys/require-auth";
import { apiSuccess, handleApiError } from "@/lib/machine-auth/api-response";
import { MachineAuthError } from "@/lib/machine-auth/error";
import type { AuthVerifyResponse } from "@/lib/machine-auth/types";

export async function GET(request: NextRequest) {
  let rateLimitInfo;

  try {
    const context = await requireAuth(request);
    rateLimitInfo = context.rateLimitInfo;

    const user = await db.query.users.findFirst({
      where: eq(users.id, context.userId),
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new MachineAuthError({
        code: "USER_NOT_FOUND",
        message: "User not found.",
        status: 404,
      });
    }

    let apiKeyName: string | null = null;
    if (context.authMethod === "api_key" && context.apiKeyId) {
      const keys = await listApiKeys(context.userId);
      apiKeyName = keys.find((key) => key.id === context.apiKeyId)?.name ?? null;
    }

    const response: AuthVerifyResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      authMethod: context.authMethod,
      apiKey: {
        name: apiKeyName,
        rateLimit: context.rateLimit ?? null,
      },
    };

    return apiSuccess(response, 200, rateLimitInfo);
  } catch (error) {
    return handleApiError(error, rateLimitInfo);
  }
}
