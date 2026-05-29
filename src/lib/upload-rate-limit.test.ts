import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { UPLOAD_CONFIG } from "@/lib/config/upload";

const mockCheckPersistentRateLimit = jest.fn();

jest.mock("@/lib/rate-limit", () => ({
  checkPersistentRateLimit: mockCheckPersistentRateLimit,
}));

describe("upload rate limit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("delegates to the persistent rate limiter", async () => {
    const limit = UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS;
    mockCheckPersistentRateLimit.mockResolvedValue({
      allowed: true,
      info: {
        limit,
        remaining: limit - 1,
        resetAt: 61,
      },
    });
    const { checkUploadRateLimit } = await import("./upload-rate-limit");

    await expect(checkUploadRateLimit("user-1")).resolves.toMatchObject({
      allowed: true,
      remaining: limit - 1,
    });

    expect(mockCheckPersistentRateLimit).toHaveBeenCalledWith({
      scope: "upload",
      key: "user-1",
      limit,
      windowMs: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_WINDOW_MS,
    });
  });

  it("returns retry metadata for blocked requests", async () => {
    mockCheckPersistentRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS,
        remaining: 0,
        resetAt: 61,
      },
    });
    const { checkUploadRateLimit } = await import("./upload-rate-limit");

    await expect(checkUploadRateLimit("user-1")).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfter: 60,
    });
  });
});
