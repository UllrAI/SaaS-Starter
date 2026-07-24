import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCheckUploadRateLimit = jest.fn();
const mockCancelUploadIntent = jest.fn();
const mockReadJsonBodyWithLimit = jest.fn();
class MockRequestBodyTooLargeError extends Error {}

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/upload-rate-limit", () => ({
  checkUploadRateLimit: mockCheckUploadRateLimit,
}));
jest.mock("@/lib/uploads/upload-intents", () => ({
  cancelUploadIntent: mockCancelUploadIntent,
}));
jest.mock("@/lib/http/request-body", () => ({
  readJsonBodyWithLimit: mockReadJsonBodyWithLimit,
  RequestBodyTooLargeError: MockRequestBodyTooLargeError,
}));

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/upload/cancel", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/upload/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockCheckUploadRateLimit.mockResolvedValue({
      allowed: true,
      retryAfter: 0,
    });
    mockCancelUploadIntent.mockResolvedValue(true);
  });

  it("cancels an owned upload intent idempotently", async () => {
    const intentId = "11111111-1111-4111-8111-111111111111";
    mockReadJsonBodyWithLimit.mockResolvedValue({ intentId });
    const { POST } = await import("./route");
    const response = await POST(createRequest({ intentId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCancelUploadIntent).toHaveBeenCalledWith(intentId, "user-1");
  });

  it("rejects unauthenticated callers", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        intentId: "11111111-1111-4111-8111-111111111111",
      }),
    );

    expect(response.status).toBe(401);
    expect(mockCancelUploadIntent).not.toHaveBeenCalled();
  });

  it("rejects malformed intent IDs", async () => {
    mockReadJsonBodyWithLimit.mockResolvedValue({ intentId: "invalid" });
    const { POST } = await import("./route");
    const response = await POST(createRequest({ intentId: "invalid" }));

    expect(response.status).toBe(400);
    expect(mockCancelUploadIntent).not.toHaveBeenCalled();
  });
});
