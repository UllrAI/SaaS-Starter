jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { checkUploadRateLimit } from "./upload-rate-limit";

const mockedCheckRateLimit = jest.mocked(checkRateLimit);

describe("upload rate limit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    mockedCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: {
        limit: 20,
        remaining: 19,
        resetAt: 61,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["presign", "complete", "server"] as const)(
    "uses an independent %s scope",
    async (scope) => {
      await expect(checkUploadRateLimit("user-1", scope)).resolves.toEqual({
        allowed: true,
        limit: 20,
        remaining: 19,
        resetAt: 61_000,
        retryAfter: 0,
      });
      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "user-1",
          scope: `upload:${scope}`,
        }),
      );
    },
  );

  it("returns a retry delay for exhausted buckets", async () => {
    mockedCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: 20,
        remaining: 0,
        resetAt: 61,
      },
    });

    await expect(
      checkUploadRateLimit("user-1", "presign"),
    ).resolves.toMatchObject({
      allowed: false,
      retryAfter: 60,
    });
  });
});
