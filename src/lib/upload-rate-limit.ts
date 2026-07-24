import { UPLOAD_CONFIG } from "@/lib/config/upload";
import { checkRateLimit } from "@/lib/rate-limit";

export type UploadRateLimitScope = "cancel" | "complete" | "presign" | "server";

export async function checkUploadRateLimit(
  userId: string,
  scope: UploadRateLimitScope,
) {
  const result = await checkRateLimit({
    key: userId,
    limit: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    scope: `upload:${scope}`,
    windowMs: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_WINDOW_MS,
  });
  const resetAtMs = result.info.resetAt * 1000;

  return {
    ...result.info,
    allowed: result.allowed,
    resetAt: resetAtMs,
    retryAfter: result.allowed
      ? 0
      : Math.max(Math.ceil((resetAtMs - Date.now()) / 1000), 1),
  };
}
