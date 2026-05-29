import { UPLOAD_CONFIG } from "@/lib/config/upload";
import { FixedWindowRateLimiter } from "@/lib/fixed-window-rate-limit";

interface UploadRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

const uploadRateLimiter = new FixedWindowRateLimiter();

export function checkUploadRateLimit(userId: string): UploadRateLimitResult {
  return uploadRateLimiter.check({
    key: userId,
    limit: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    windowMs: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_WINDOW_MS,
  });
}

export function clearUploadRateLimitForTests(): void {
  uploadRateLimiter.clear();
}
