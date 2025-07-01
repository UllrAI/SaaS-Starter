import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
  },
}));

// Mock dependencies
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const mockCreatePresignedUrl = jest.fn();
jest.mock("@/lib/r2", () => ({
  createPresignedUrl: mockCreatePresignedUrl,
}));

const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockResolvedValue(undefined),
  }),
};
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  uploads: "uploads-table",
}));

const mockIsFileTypeAllowed = jest.fn();
const mockIsFileSizeAllowed = jest.fn();
const mockFormatFileSize = jest.fn();
const mockPresignedUrlRequestSchema = {
  safeParse: jest.fn(),
};

jest.mock("@/lib/config/upload", () => ({
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10485760, // 10MB
  },
  formatFileSize: mockFormatFileSize,
  presignedUrlRequestSchema: mockPresignedUrlRequestSchema,
}));

describe("Upload Presigned URL API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: unknown) => {
    return {
      headers: { get: () => '', has: () => false, set: () => {}, entries: () => [] },
      json: jest.fn().mockResolvedValue(body),
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: '/api/upload/presigned-url' },
      url: 'http://localhost:3000/api/upload/presigned-url',
    } as unknown as import('next/server').NextRequest;
  };

  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  const validRequestBody = {
    fileName: "test-image.jpg",
    contentType: "image/jpeg",
    size: 1048576, // 1MB
  };

  describe("POST /api/upload/presigned-url", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null);
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when session exists but user.id is missing", async () => {
      mockGetSession.mockResolvedValue({ user: { id: null } });
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid request body", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          flatten: () => ({
            fieldErrors: {
              fileName: ["Required"],
              contentType: ["Invalid content type"],
            },
          }),
        },
      });
      
      const { POST } = await import("./route");
      const request = createMockRequest({ invalid: "data" });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toEqual({
        fileName: ["Required"],
        contentType: ["Invalid content type"],
      });
    });

    it("should return 400 for disallowed file type", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(false);
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("File type 'image/jpeg' is not allowed.");
      expect(mockIsFileTypeAllowed).toHaveBeenCalledWith("image/jpeg");
    });

    it("should return 400 for file size exceeding limit", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(false);
      mockFormatFileSize.mockImplementation((size) => `${size} bytes`);
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("File size of 1048576 bytes exceeds the limit of 10485760 bytes.");
      expect(mockIsFileSizeAllowed).toHaveBeenCalledWith(1048576);
    });

    it("should return 400 when createPresignedUrl fails", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockCreatePresignedUrl.mockResolvedValue({
        success: false,
        error: "S3 service unavailable",
      });
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("S3 service unavailable");
    });

    it("should successfully create presigned URL and store upload record", async () => {
      const mockResult = {
        success: true,
        presignedUrl: "https://s3.example.com/presigned",
        publicUrl: "https://cdn.example.com/file.jpg",
        key: "uploads/user-123/file.jpg",
      };
      
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockCreatePresignedUrl.mockResolvedValue(mockResult);
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        presignedUrl: mockResult.presignedUrl,
        publicUrl: mockResult.publicUrl,
        key: mockResult.key,
      });
      
      expect(mockCreatePresignedUrl).toHaveBeenCalledWith({
        userId: "user-123",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1048576,
      });
      
      expect(mockDb.insert).toHaveBeenCalledWith("uploads-table");
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        userId: "user-123",
        fileKey: "uploads/user-123/file.jpg",
        url: "https://cdn.example.com/file.jpg",
        fileName: "test-image.jpg",
        fileSize: 1048576,
        contentType: "image/jpeg",
      });
    });

    it("should skip database insert when result missing key or publicUrl", async () => {
      const mockResult = {
        success: true,
        presignedUrl: "https://s3.example.com/presigned",
        publicUrl: null, // Missing publicUrl
        key: "uploads/user-123/file.jpg",
      };
      
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockCreatePresignedUrl.mockResolvedValue(mockResult);
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        presignedUrl: mockResult.presignedUrl,
        publicUrl: mockResult.publicUrl,
        key: mockResult.key,
      });
      
      // Database insert should not be called
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("should handle request.json() failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      
      const request = {
        headers: { get: () => '', has: () => false, set: () => {}, entries: () => [] },
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: '/api/upload/presigned-url' },
        url: 'http://localhost:3000/api/upload/presigned-url',
      } as unknown as import('next/server').NextRequest;
      
      const { POST } = await import("./route");
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error. Please try again later.");
    });

    it("should handle auth.api.getSession failure", async () => {
      mockGetSession.mockRejectedValue(new Error("Auth service down"));
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error. Please try again later.");
    });

    it("should handle database insert failure", async () => {
      const mockResult = {
        success: true,
        presignedUrl: "https://s3.example.com/presigned",
        publicUrl: "https://cdn.example.com/file.jpg",
        key: "uploads/user-123/file.jpg",
      };
      
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockCreatePresignedUrl.mockResolvedValue(mockResult);
      mockDb.insert().values.mockRejectedValue(new Error("Database error"));
      
      const { POST } = await import("./route");
      const request = createMockRequest(validRequestBody);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error. Please try again later.");
    });

    it("should handle different file types correctly", async () => {
      const pdfRequest = {
        fileName: "document.pdf",
        contentType: "application/pdf",
        size: 2097152, // 2MB
      };
      
      const mockResult = {
        success: true,
        presignedUrl: "https://s3.example.com/presigned",
        publicUrl: "https://cdn.example.com/document.pdf",
        key: "uploads/user-123/document.pdf",
      };
      
      // Ensure mocks are properly configured
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: pdfRequest,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(true);
      mockCreatePresignedUrl.mockResolvedValue(mockResult);
      mockDb.insert().values.mockResolvedValue(undefined);
      
      const { POST } = await import("./route");
      const request = createMockRequest(pdfRequest);
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockIsFileTypeAllowed).toHaveBeenCalledWith("application/pdf");
      expect(mockIsFileSizeAllowed).toHaveBeenCalledWith(2097152);
      expect(data).toEqual({
        presignedUrl: mockResult.presignedUrl,
        publicUrl: mockResult.publicUrl,
        key: mockResult.key,
      });
    });
  });
});