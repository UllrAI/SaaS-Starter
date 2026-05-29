import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { UPLOAD_CONFIG } from "@/lib/config/upload";
import {
  checkUploadRateLimit,
  clearUploadRateLimitForTests,
} from "./upload-rate-limit";

describe("upload rate limit", () => {
  beforeEach(() => {
    clearUploadRateLimitForTests();
    jest.spyOn(Date, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("allows requests until the per-user window is exhausted", () => {
    const limit = UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS;

    expect(checkUploadRateLimit("user-1")).toMatchObject({
      allowed: true,
      remaining: limit - 1,
    });

    for (let count = 1; count < limit; count += 1) {
      expect(checkUploadRateLimit("user-1").allowed).toBe(true);
    }

    expect(checkUploadRateLimit("user-1")).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfter: 60,
    });
  });

  it("tracks users independently", () => {
    for (
      let count = 0;
      count < UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS;
      count += 1
    ) {
      checkUploadRateLimit("user-1");
    }

    expect(checkUploadRateLimit("user-2")).toMatchObject({
      allowed: true,
      remaining: UPLOAD_CONFIG.USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS - 1,
    });
  });
});
