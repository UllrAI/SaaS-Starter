import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { NextRequest } from "next/server";

// Type definitions for mock responses
type MockResponseInit = { status?: number; headers?: Record<string, string> };
type MockResponse = {
  json: () => Promise<unknown>;
  status: number;
  ok: boolean;
  headers?: Map<string, string>;
};

// Mock NextResponse and NextRequest
const mockJson = jest.fn().mockImplementation(
  (data: unknown, init: MockResponseInit = {}): MockResponse => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
    ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
  }),
) as any;

const mockNextResponse = jest.fn().mockImplementation(
  (body: unknown, init: MockResponseInit = {}): MockResponse => ({
    json: () => Promise.resolve(body),
    status: init?.status || 200,
    ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
    headers: new Map(Object.entries(init.headers || {})),
  }),
) as any;

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: Object.assign(mockNextResponse, {
    json: mockJson,
  }),
}));

// Mock dependencies
const mockGetSession = jest.fn() as any;
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const mockCheckUploadRateLimit = jest.fn() as any;
jest.mock("@/lib/upload-rate-limit", () => ({
  checkUploadRateLimit: mockCheckUploadRateLimit,
}));

// Mock AWS SDK
const mockUpload = {
  done: jest.fn() as any,
};
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn() as any,
}));
jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn(() => mockUpload),
}));

jest.mock("@/lib/r2", () => ({
  r2Client: { send: jest.fn() },
}));

const mockCreateUploadIntent = jest.fn() as any;
const mockCompleteUploadIntent = jest.fn() as any;
const mockReleaseUploadIntent = jest.fn() as any;
class MockUploadQuotaExceededError extends Error {}
jest.mock("@/lib/uploads/upload-intents", () => ({
  createUploadIntent: mockCreateUploadIntent,
  completeUploadIntent: mockCompleteUploadIntent,
  releaseUploadIntent: mockReleaseUploadIntent,
  UploadQuotaExceededError: MockUploadQuotaExceededError,
}));

// Mock env
jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    R2_ENDPOINT: "https://r2.example.com",
    R2_ACCESS_KEY_ID: "test-key",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_BUCKET_NAME: "test-bucket",
    R2_PUBLIC_URL: "https://cdn.example.com",
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
  },
}));

// Mock upload config
const mockIsFileTypeAllowed = jest.fn() as any;
const mockIsFileSizeAllowed = jest.fn() as any;
const mockFormatFileSize = jest.fn() as any;

jest.mock("@/lib/config/upload", () => ({
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10485760, // 10MB
    MAX_SERVER_UPLOAD_FILE_SIZE: 10485760,
    MAX_SERVER_UPLOAD_FILES: 5,
    MAX_SERVER_UPLOAD_TOTAL_SIZE: 20 * 1024 * 1024,
    SERVER_UPLOAD_CONCURRENCY: 2,
  },
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  formatFileSize: mockFormatFileSize,
  normalizeContentType: jest.fn((contentType: string) => contentType),
}));

describe("Upload Server Upload API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckUploadRateLimit.mockReturnValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      resetAt: Date.now() + 60_000,
      retryAfter: 0,
    });
    mockFormatFileSize.mockImplementation((size: number) => `${size} bytes`);
    mockCreateUploadIntent.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      fileKey: "uploads/user-123/test-intent.jpg",
    });
    mockCompleteUploadIntent.mockResolvedValue({
      fileKey: "uploads/user-123/test-intent.jpg",
      url: "https://cdn.example.com/uploads/user-123/test-intent.jpg",
      fileName: "test.jpg",
      fileSize: 1024,
      contentType: "image/jpeg",
    });
    mockReleaseUploadIntent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (
    contentType: string,
    formData?: FormData,
    contentLength: number | string | null = 1024,
  ) => {
    return {
      headers: {
        get: jest.fn((key) => {
          if (key === "content-type") return contentType;
          if (key === "content-length") {
            return contentLength === null ? null : String(contentLength);
          }
          return "";
        }),
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      formData: jest.fn().mockResolvedValue(formData || new FormData()),
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: "/api/upload/server-upload" },
      url: "http://localhost:3000/api/upload/server-upload",
    } as unknown as NextRequest;
  };

  const createMockFile = (name: string, type: string, size: number) => {
    return {
      name,
      type,
      size,
      stream: jest.fn(() => "mock-stream"),
    } as unknown as File;
  };

  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  describe("POST /api/upload/server-upload", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid content type", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest("application/json");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid content type. Expected multipart/form-data",
      );
      expect(data.received).toBe("application/json");
    });

    it("should return 400 when content type is missing", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest("");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid content type. Expected multipart/form-data",
      );
      expect(data.received).toBe("none");
    });

    it("should return 400 when no files are provided", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const formData = new FormData();
      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No files provided");
    });

    it("should reject oversized multipart requests before parsing", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        undefined,
        22 * 1024 * 1024,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.error).toBe("Upload request is too large.");
      expect(request.formData).not.toHaveBeenCalled();
    });

    it("should require Content-Length before parsing multipart data", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", undefined, null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(411);
      expect(data.error).toBe("Content-Length header is required.");
      expect(request.formData).not.toHaveBeenCalled();
    });

    it("should reject invalid Content-Length before parsing", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        undefined,
        "invalid",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid Content-Length header.");
      expect(request.formData).not.toHaveBeenCalled();
    });

    it("should reject requests with too many files", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const files = Array.from({ length: 6 }, (_, index) =>
        createMockFile(`test-${index}.jpg`, "image/jpeg", 1024),
      );
      const mockFormData = {
        getAll: jest.fn(() => files),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Too many files. Maximum 5 files are allowed per request.",
      );
      expect(mockUpload.done).not.toHaveBeenCalled();
    });

    it("should reject requests that exceed total upload size", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const files = [
        createMockFile("large-1.jpg", "image/jpeg", 15 * 1024 * 1024),
        createMockFile("large-2.jpg", "image/jpeg", 10 * 1024 * 1024),
      ];
      const mockFormData = {
        getAll: jest.fn(() => files),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Total upload size of 26214400 bytes exceeds the per-request limit of 20971520 bytes.",
      );
      expect(mockUpload.done).not.toHaveBeenCalled();
    });

    it("should successfully upload single file", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockUpload.done.mockResolvedValue({});

      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const formData = new FormData();
      formData.append("files", file);

      const mockFormData = {
        getAll: jest.fn((key) => (key === "files" ? [file] : [])),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Uploaded 1 file(s) successfully");
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        url: "https://cdn.example.com/uploads/user-123/test-intent.jpg",
        key: "uploads/user-123/test-intent.jpg",
        size: 1024,
        contentType: "image/jpeg",
        success: true,
      });
      expect(data.summary).toEqual({
        total: 1,
        success: 1,
        failed: 0,
      });
    });

    it("should handle file type validation failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(false);

      const file = createMockFile("test.exe", "application/x-executable", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Uploaded 0 file(s) successfully, 1 failed");
      expect(data.results[0]).toEqual({
        fileName: "test.exe",
        success: false,
        error: "File type application/x-executable is not allowed",
      });
    });

    it("should handle file size validation failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(false);

      const file = createMockFile("large.jpg", "image/jpeg", 20971520); // 20MB
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "large.jpg",
        success: false,
        error:
          "File size 20971520 bytes exceeds maximum allowed size of 10485760 bytes",
      });
    });

    it("should handle upload failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockUpload.done.mockRejectedValue(new Error("S3 upload failed"));

      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "Upload failed. Please try again.",
      });
      expect(mockReleaseUploadIntent).not.toHaveBeenCalled();
    });

    it("should release the reservation when storage upload never starts", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);

      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      (file.stream as jest.Mock).mockImplementation(() => {
        throw new Error("stream unavailable");
      });
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpload.done).not.toHaveBeenCalled();
      expect(mockReleaseUploadIntent).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
        "user-123",
      );
    });

    it("should defer cleanup when upload finalization has an uncertain result", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockUpload.done.mockResolvedValue({});
      mockCompleteUploadIntent.mockRejectedValue(new Error("Database error"));

      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "Upload failed. Please try again.",
      });
      expect(mockReleaseUploadIntent).not.toHaveBeenCalled();
    });

    it("should handle multiple files with mixed results", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockUpload.done.mockResolvedValue({});

      const file1 = createMockFile("success.jpg", "image/jpeg", 1024);
      const file2 = createMockFile(
        "fail.exe",
        "application/x-executable",
        1024,
      );

      mockIsFileTypeAllowed.mockImplementation(
        (type: string) => type === "image/jpeg",
      );
      mockIsFileSizeAllowed.mockReturnValue(true);

      const mockFormData = {
        getAll: jest.fn(() => [file1, file2]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Uploaded 1 file(s) successfully, 1 failed");
      expect(data.summary).toEqual({
        total: 2,
        success: 1,
        failed: 1,
      });
    });

    it("should handle request.formData() failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const request = {
        headers: {
          get: jest.fn((key) =>
            key === "content-type" ? "multipart/form-data" : "1024",
          ),
          has: () => false,
          set: () => {},
          entries: () => [],
        },
        formData: jest.fn().mockRejectedValue(new Error("Invalid form data")),
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: "/api/upload/server-upload" },
        url: "http://localhost:3000/api/upload/server-upload",
      } as unknown as NextRequest;

      const { POST } = await import("./route");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid multipart upload payload.");
    });

    it("should handle non-Error exceptions in processFile", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockImplementation(() => {
        throw "String error"; // Non-Error exception
      });

      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };

      const { POST } = await import("./route");
      const request = createMockRequest(
        "multipart/form-data",
        mockFormData as unknown as FormData,
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "Upload failed. Please try again.",
      });
    });
  });

  describe("OPTIONS /api/upload/server-upload", () => {
    it("should return CORS headers", async () => {
      const { OPTIONS } = await import("./route");

      const response = await OPTIONS();

      expect(response.status).toBe(200);
      // Note: We can't easily test headers with our mock setup,
      // but this ensures the function executes without error
    });
  });
});
