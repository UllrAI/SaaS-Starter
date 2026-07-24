import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init: { status?: number } = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status ?? 200,
      ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
    })),
  },
}));

const mockGetSession = jest.fn() as any;
jest.mock("@/lib/auth/server", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

const mockGetObjectMetadata = jest.fn() as any;
jest.mock("@/lib/r2", () => ({
  getObjectMetadata: mockGetObjectMetadata,
}));

const mockCheckUploadRateLimit = jest.fn() as any;
jest.mock("@/lib/upload-rate-limit", () => ({
  checkUploadRateLimit: mockCheckUploadRateLimit,
}));

const mockCompleteUploadIntent = jest.fn() as any;
const mockCompleteLegacyUpload = jest.fn() as any;
class MockUploadIntentUnavailableError extends Error {}
class MockUploadMetadataMismatchError extends Error {}
class MockUploadQuotaExceededError extends Error {}
jest.mock("@/lib/uploads/upload-intents", () => ({
  completeLegacyUpload: mockCompleteLegacyUpload,
  completeUploadIntent: mockCompleteUploadIntent,
  UploadIntentUnavailableError: MockUploadIntentUnavailableError,
  UploadMetadataMismatchError: MockUploadMetadataMismatchError,
  UploadQuotaExceededError: MockUploadQuotaExceededError,
}));

const mockReadJsonBodyWithLimit = jest.fn() as any;
class MockRequestBodyTooLargeError extends Error {}
jest.mock("@/lib/http/request-body", () => ({
  readJsonBodyWithLimit: mockReadJsonBodyWithLimit,
  RequestBodyTooLargeError: MockRequestBodyTooLargeError,
}));

const mockIsFileTypeAllowed = jest.fn() as any;
const mockIsFileSizeAllowed = jest.fn() as any;
const mockUploadCompleteRequestSchema = { safeParse: jest.fn() as any };
jest.mock("@/lib/config/upload", () => ({
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    MAX_JSON_BODY_SIZE: 4096,
  },
  formatFileSize: jest.fn((size: number) => `${size} bytes`),
  normalizeContentType: jest.fn((contentType: string) =>
    contentType.toLowerCase(),
  ),
  uploadCompleteRequestSchema: mockUploadCompleteRequestSchema,
}));

const validRequestBody = {
  intentId: "11111111-1111-4111-8111-111111111111",
  fileName: "test-image.jpg",
  contentType: "image/jpeg",
  size: 1024,
  key: "uploads/user-123/test-image.jpg",
  url: "https://cdn.example.com/uploads/user-123/test-image.jpg",
};

const createMockRequest = (body: unknown): NextRequest =>
  ({
    headers: new Headers(),
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

describe("Upload Complete API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckUploadRateLimit.mockResolvedValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      resetAt: Date.now() + 60_000,
      retryAfter: 0,
    });
    mockReadJsonBodyWithLimit.mockImplementation((request: NextRequest) =>
      request.json(),
    );
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: validRequestBody,
    });
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockGetObjectMetadata.mockResolvedValue({
      contentLength: 1024,
      contentType: "image/jpeg",
    });
    mockCompleteUploadIntent.mockResolvedValue({
      fileKey: validRequestBody.key,
      url: validRequestBody.url,
      fileName: validRequestBody.fileName,
      fileSize: validRequestBody.size,
      contentType: validRequestBody.contentType,
    });
    mockCompleteLegacyUpload.mockResolvedValue(null);
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(401);
    expect(mockGetObjectMetadata).not.toHaveBeenCalled();
  });

  it("rejects invalid request data", async () => {
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { key: ["Required"] } }) },
    });

    const { POST } = await import("./route");
    const response = await POST(createMockRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request data",
      details: { key: ["Required"] },
    });
  });

  it("rejects oversized JSON before parsing", async () => {
    mockReadJsonBodyWithLimit.mockRejectedValue(
      new MockRequestBodyTooLargeError(),
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(413);
    expect(mockGetObjectMetadata).not.toHaveBeenCalled();
  });

  it("returns 409 when the object is not available", async () => {
    mockGetObjectMetadata.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(409);
    expect(mockCompleteUploadIntent).not.toHaveBeenCalled();
  });

  it("rejects another user's key before querying object storage", async () => {
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        ...validRequestBody,
        key: "uploads/another-user/test-image.jpg",
      },
    });

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(403);
    expect(mockGetObjectMetadata).not.toHaveBeenCalled();
  });

  it("rejects an unsafe object type", async () => {
    mockIsFileTypeAllowed.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(400);
    expect(mockCompleteUploadIntent).not.toHaveBeenCalled();
  });

  it("completes the reserved upload using verified R2 metadata", async () => {
    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(200);
    expect(mockCompleteUploadIntent).toHaveBeenCalledWith({
      intentId: validRequestBody.intentId,
      userId: "user-123",
      key: validRequestBody.key,
      contentLength: 1024,
      contentType: "image/jpeg",
      declaration: {
        fileName: validRequestBody.fileName,
        fileSize: validRequestBody.size,
        contentType: validRequestBody.contentType,
        url: validRequestBody.url,
      },
    });
    await expect(response.json()).resolves.toEqual({
      file: {
        key: validRequestBody.key,
        url: validRequestBody.url,
        fileName: validRequestBody.fileName,
        size: validRequestBody.size,
        contentType: validRequestBody.contentType,
      },
    });
  });

  it("returns 409 for an expired or consumed intent", async () => {
    mockCompleteUploadIntent.mockRejectedValue(
      new MockUploadIntentUnavailableError("Upload intent expired."),
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(409);
  });

  it("completes an in-flight legacy upload during the rollout window", async () => {
    const legacyRequest = { ...validRequestBody, intentId: undefined };
    const legacyUpload = {
      fileKey: legacyRequest.key,
      url: legacyRequest.url,
      fileName: legacyRequest.fileName,
      fileSize: legacyRequest.size,
      contentType: legacyRequest.contentType,
    };
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: legacyRequest,
    });
    mockCompleteUploadIntent.mockRejectedValue(
      new MockUploadIntentUnavailableError("Upload intent unavailable."),
    );
    mockCompleteLegacyUpload.mockResolvedValue(legacyUpload);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(legacyRequest));

    expect(response.status).toBe(200);
    expect(mockCompleteLegacyUpload).toHaveBeenCalledWith({
      userId: "user-123",
      key: legacyRequest.key,
      contentLength: 1024,
      contentType: "image/jpeg",
      declaration: {
        fileName: legacyRequest.fileName,
        fileSize: legacyRequest.size,
        contentType: legacyRequest.contentType,
        url: legacyRequest.url,
      },
    });
  });

  it("does not bypass a rejected v2 intent through legacy completion", async () => {
    mockCompleteUploadIntent.mockRejectedValue(
      new MockUploadIntentUnavailableError("Upload intent unavailable."),
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(409);
    expect(mockCompleteLegacyUpload).not.toHaveBeenCalled();
  });

  it("returns a controlled quota response for a legacy completion", async () => {
    const legacyRequest = { ...validRequestBody, intentId: undefined };
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: legacyRequest,
    });
    mockCompleteUploadIntent.mockRejectedValue(
      new MockUploadIntentUnavailableError("Upload intent unavailable."),
    );
    mockCompleteLegacyUpload.mockRejectedValue(
      new MockUploadQuotaExceededError("Daily upload quota reached."),
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(legacyRequest));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "UPLOAD_QUOTA_EXCEEDED",
      error: "Daily upload quota reached.",
    });
  });

  it("returns 400 when the reservation metadata does not match", async () => {
    mockCompleteUploadIntent.mockRejectedValue(
      new MockUploadMetadataMismatchError("mismatch"),
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));

    expect(response.status).toBe(400);
  });
});
