import { NextRequest } from "next/server";
import { validateApiKey, updateLastUsedAt } from "./key-service";
import { checkRateLimit } from "./rate-limit";
import {
  validateCliToken,
  updateCliTokenLastUsed,
} from "@/lib/device-auth/token-service";
import { checkRateLimit as checkUserRateLimit } from "@/lib/rate-limit";
import {
  API_KEY_PREFIX,
  CLI_TOKEN_PREFIX,
  DEFAULT_API_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/machine-auth/constants";
import { MachineAuthError } from "@/lib/machine-auth/error";
import type { RateLimitInfo } from "./types";

export type ApiAuthContext = {
  userId: string;
  authMethod: "api_key" | "cli_token";
  apiKeyId?: string;
  cliTokenId?: string;
  rateLimit?: number;
  rateLimitInfo?: RateLimitInfo;
};

async function limitMachineUser(userId: string) {
  const result = await checkUserRateLimit({
    scope: "machine_user",
    key: userId,
    limit: DEFAULT_API_RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!result.allowed)
    throw new MachineAuthError({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Rate limit exceeded. Please try again later.",
      status: 429,
      details: result.info,
    });
  return result.info;
}

export async function requireAuth(
  request: NextRequest,
): Promise<ApiAuthContext> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new MachineAuthError({
      code: "MISSING_AUTH",
      message:
        "Missing or invalid Authorization header. Expected: Bearer ssk_... or Bearer sst_...",
      status: 401,
    });
  }

  const rawToken = authorization.slice(7);

  if (rawToken.startsWith(API_KEY_PREFIX)) {
    const result = await validateApiKey(rawToken);
    if (!result) {
      throw new MachineAuthError({
        code: "INVALID_API_KEY",
        message: "Invalid or expired API key.",
        status: 401,
      });
    }

    await limitMachineUser(result.userId);
    const rateLimitInfo = await checkRateLimit(
      result.apiKeyId,
      result.rateLimit,
    );
    void Promise.resolve(updateLastUsedAt(result.apiKeyId)).catch((error) => {
      console.error("Failed to update API key usage timestamp:", error);
    });

    return {
      userId: result.userId,
      authMethod: "api_key",
      apiKeyId: result.apiKeyId,
      rateLimit: result.rateLimit,
      rateLimitInfo,
    };
  }

  if (rawToken.startsWith(CLI_TOKEN_PREFIX)) {
    const result = await validateCliToken(rawToken);
    if (!result) {
      throw new MachineAuthError({
        code: "INVALID_CLI_TOKEN",
        message: "Invalid or expired CLI token.",
        status: 401,
      });
    }

    const rateLimitInfo = await limitMachineUser(result.userId);
    void Promise.resolve(updateCliTokenLastUsed(result.cliTokenId)).catch(
      (error) =>
        console.error("Failed to update CLI token usage timestamp:", error),
    );

    return {
      userId: result.userId,
      authMethod: "cli_token",
      cliTokenId: result.cliTokenId,
      rateLimitInfo,
    };
  }

  throw new MachineAuthError({
    code: "INVALID_AUTH",
    message: "Unrecognized token format. Expected ssk_... or sst_... prefix.",
    status: 401,
  });
}
