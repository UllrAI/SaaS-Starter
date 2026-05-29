import { UPLOAD_CONFIG } from "@/lib/config/upload";
import { checkPersistentRateLimit } from "@/lib/rate-limit";

interface UploadRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

export async function checkUploadRateLimit(
  userId: string,
): Promise<UploadRateLimitResult> {
  const result = await checkPersistentRateLimit({
    scope: "upload",
    key: userId,
    limit: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    windowMs: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_WINDOW_MS,
  });
  const now = Math.ceil(Date.now() / 1000);

  return {
    allowed: result.allowed,
    limit: result.info.limit,
    remaining: result.info.remaining,
    resetAt: result.info.resetAt * 1000,
    retryAfter: result.allowed ? 0 : Math.max(result.info.resetAt - now, 1),
  };
}
