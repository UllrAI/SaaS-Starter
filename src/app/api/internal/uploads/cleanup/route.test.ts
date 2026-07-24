import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    UPLOAD_CLEANUP_SECRET: "cleanup-secret-at-least-32-characters",
  },
}));

const mockCleanupExpiredUploadIntents = jest.fn() as any;
const mockRecoverStaleUploadCleanupClaims = jest.fn() as any;
jest.mock("@/lib/uploads/upload-intents", () => ({
  cleanupExpiredUploadIntents: mockCleanupExpiredUploadIntents,
  recoverStaleUploadCleanupClaims: mockRecoverStaleUploadCleanupClaims,
}));

function createRequest(secret?: string): NextRequest {
  const headers = new Headers();
  if (secret) {
    headers.set("authorization", `Bearer ${secret}`);
  }
  return { headers } as NextRequest;
}

describe("upload cleanup endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecoverStaleUploadCleanupClaims.mockResolvedValue(2);
    mockCleanupExpiredUploadIntents.mockResolvedValue({
      scanned: 4,
      deleted: 3,
      failed: 1,
    });
  });

  it("rejects a missing cleanup credential", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mockCleanupExpiredUploadIntents).not.toHaveBeenCalled();
  });

  it("rejects an incorrect cleanup credential", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest("wrong-secret"));

    expect(response.status).toBe(401);
  });

  it("recovers stale claims before cleaning expired intents", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest("cleanup-secret-at-least-32-characters"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      recovered: 2,
      scanned: 4,
      deleted: 3,
      failed: 1,
    });
    expect(
      mockRecoverStaleUploadCleanupClaims.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockCleanupExpiredUploadIntents.mock.invocationCallOrder[0]!,
    );
  });

  it("returns a controlled error when cleanup fails", async () => {
    mockRecoverStaleUploadCleanupClaims.mockRejectedValue(
      new Error("database unavailable"),
    );
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { POST } = await import("./route");
    const response = await POST(
      createRequest("cleanup-secret-at-least-32-characters"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Upload cleanup failed.",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
