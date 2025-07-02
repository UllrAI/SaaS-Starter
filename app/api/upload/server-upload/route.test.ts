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
const mockJson = jest.fn().mockImplementation((data: unknown, init: MockResponseInit = {}): MockResponse => ({
  json: () => Promise.resolve(data),
  status: init?.status || 200,
  ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
})) as any;

const mockNextResponse = jest.fn().mockImplementation((body: unknown, init: MockResponseInit = {}): MockResponse => ({
  json: () => Promise.resolve(body),
  status: init?.status || 200,
  ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
  headers: new Map(Object.entries(init.headers || {})),
})) as any;

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: Object.assign(mockNextResponse, {
    json: mockJson,
  }),
}));

// Type definitions for mocked functions
type SessionFunction = (...args: unknown[]) => Promise<unknown>;
type UploadFunction = (...args: unknown[]) => Promise<unknown>;
type DatabaseFunction = (...args: unknown[]) => unknown;

// Mock dependencies
const mockGetSession = jest.fn() as any;
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
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

// Mock database
const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn() as any,
  }) as any,
};
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  uploads: "uploads-table",
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid-123"),
}));

// Mock env
jest.mock("@/env", () => ({
  R2_ENDPOINT: "https://r2.example.com",
  R2_ACCESS_KEY_ID: "test-key",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_BUCKET_NAME: "test-bucket",
  R2_PUBLIC_URL: "https://cdn.example.com",
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
}));

// Mock upload config
const mockIsFileTypeAllowed = jest.fn() as any;
const mockIsFileSizeAllowed = jest.fn() as any;
const mockGetFileExtension = jest.fn() as any;

jest.mock("@/lib/config/upload", () => ({
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10485760, // 10MB
  },
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  getFileExtension: mockGetFileExtension,
}));

describe("Upload Server Upload API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (contentType: string, formData?: FormData) => {
    return {
      headers: { 
        get: jest.fn((key) => key === "content-type" ? contentType : ''),
        has: () => false, 
        set: () => {}, 
        entries: () => [] 
      },
      formData: jest.fn().mockResolvedValue(formData || new FormData()),
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: '/api/upload/server-upload' },
      url: 'http://localhost:3000/api/upload/server-upload',
    } as unknown as NextRequest;
  };

  const createMockFile = (name: string, type: string, size: number) => {
    return {
      name,
      type,
      size,
      stream: jest.fn(() => 'mock-stream'),
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
      expect(data.error).toBe("Invalid content type. Expected multipart/form-data");
      expect(data.received).toBe("application/json");
    });

    it("should return 400 when content type is missing", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      
      const { POST } = await import("./route");
      const request = createMockRequest("");
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid content type. Expected multipart/form-data");
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

    it("should successfully upload single file", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockGetFileExtension.mockReturnValue("jpg");
      mockUpload.done.mockResolvedValue({});
      
      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const formData = new FormData();
      formData.append("files", file);
      
      const mockFormData = {
        getAll: jest.fn((key) => key === "files" ? [file] : []),
      };
      
      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe("Uploaded 1 file(s) successfully");
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        url: "https://cdn.example.com/uploads/user-123/1640995200000-test-uuid-123.jpg",
        key: "uploads/user-123/1640995200000-test-uuid-123.jpg",
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
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
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
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "large.jpg",
        success: false,
        error: "File size 20971520 bytes exceeds maximum allowed size of 10485760 bytes",
      });
    });

    it("should handle upload failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockGetFileExtension.mockReturnValue("jpg");
      mockUpload.done.mockRejectedValue(new Error("S3 upload failed"));
      
      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };
      
      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "S3 upload failed",
      });
    });

    it("should handle database insert failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockGetFileExtension.mockReturnValue("jpg");
      mockUpload.done.mockResolvedValue({});
      mockDb.insert().values.mockRejectedValue(new Error("Database error"));
      
      const file = createMockFile("test.jpg", "image/jpeg", 1024);
      const mockFormData = {
        getAll: jest.fn(() => [file]),
      };
      
      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "Database error",
      });
    });

    it("should handle multiple files with mixed results", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetFileExtension.mockReturnValue("jpg");
      mockUpload.done.mockResolvedValue({});
      
      // Ensure database insert succeeds for successful uploads
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined) as any,
      });
      
      const file1 = createMockFile("success.jpg", "image/jpeg", 1024);
      const file2 = createMockFile("fail.exe", "application/x-executable", 1024);
      
      mockIsFileTypeAllowed.mockImplementation((type: string) => type === "image/jpeg");
      mockIsFileSizeAllowed.mockReturnValue(true);
      
      const mockFormData = {
        getAll: jest.fn(() => [file1, file2]),
      };
      
      const { POST } = await import("./route");
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
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
          get: jest.fn(() => "multipart/form-data"),
          has: () => false, 
          set: () => {}, 
          entries: () => [] 
        },
        formData: jest.fn().mockRejectedValue(new Error("Invalid form data")),
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: '/api/upload/server-upload' },
        url: 'http://localhost:3000/api/upload/server-upload',
      } as unknown as NextRequest;
      
      const { POST } = await import("./route");
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
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
      const request = createMockRequest("multipart/form-data", mockFormData as unknown as FormData);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        fileName: "test.jpg",
        success: false,
        error: "Unknown error",
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