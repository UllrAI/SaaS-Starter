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
      deferred: 0,
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
      deferred: 0,
      failed: 1,
      batches: 1,
    });
    expect(
      mockRecoverStaleUploadCleanupClaims.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockCleanupExpiredUploadIntents.mock.invocationCallOrder[0]!,
    );
    expect(mockCleanupExpiredUploadIntents).toHaveBeenCalledWith(100);
  });

  it("aggregates batches until the queue is shorter than the batch size", async () => {
    mockCleanupExpiredUploadIntents
      .mockResolvedValueOnce({
        scanned: 100,
        deleted: 20,
        deferred: 75,
        failed: 5,
      })
      .mockResolvedValueOnce({
        scanned: 50,
        deleted: 10,
        deferred: 38,
        failed: 2,
      });

    const { POST } = await import("./route");
    const response = await POST(
      createRequest("cleanup-secret-at-least-32-characters"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      recovered: 2,
      scanned: 150,
      deleted: 30,
      deferred: 113,
      failed: 7,
      batches: 2,
    });
    expect(mockCleanupExpiredUploadIntents).toHaveBeenCalledTimes(2);
    expect(mockCleanupExpiredUploadIntents).toHaveBeenNthCalledWith(1, 100);
    expect(mockCleanupExpiredUploadIntents).toHaveBeenNthCalledWith(2, 100);
  });

  it("stops after five full batches", async () => {
    mockCleanupExpiredUploadIntents.mockResolvedValue({
      scanned: 100,
      deleted: 0,
      deferred: 100,
      failed: 0,
    });

    const { POST } = await import("./route");
    const response = await POST(
      createRequest("cleanup-secret-at-least-32-characters"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      scanned: 500,
      deferred: 500,
      batches: 5,
    });
    expect(mockCleanupExpiredUploadIntents).toHaveBeenCalledTimes(5);
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
