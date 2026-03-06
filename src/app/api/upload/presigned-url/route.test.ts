import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init: { status?: number } = {}) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
    })),
  },
}));

const mockGetSession = jest.fn() as any;
jest.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const mockCreatePresignedUrl = jest.fn() as any;
jest.mock("@/lib/r2", () => ({
  createPresignedUrl: mockCreatePresignedUrl,
}));

const mockIsFileTypeAllowed = jest.fn() as any;
const mockIsFileSizeAllowed = jest.fn() as any;
const mockFormatFileSize = jest.fn() as any;
const mockPresignedUrlRequestSchema = {
  safeParse: jest.fn() as any,
};

jest.mock("@/lib/config/upload", () => ({
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10485760,
  },
  formatFileSize: mockFormatFileSize,
  presignedUrlRequestSchema: mockPresignedUrlRequestSchema,
}));

describe("Upload Presigned URL API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: unknown): NextRequest =>
    ({
      headers: {
        get: () => "",
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      json: jest.fn().mockResolvedValue(body) as any,
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: "/api/upload/presigned-url" },
      url: "http://localhost:3000/api/upload/presigned-url",
    }) as any as NextRequest;

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
    size: 1048576,
  };

  describe("POST /api/upload/presigned-url", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import("./route");
      const response = await POST(createMockRequest(validRequestBody));
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
            },
          }),
        },
      });

      const { POST } = await import("./route");
      const response = await POST(createMockRequest({ invalid: true }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toEqual({ fileName: ["Required"] });
    });

    it("should return 400 for disallowed file type", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(false);

      const { POST } = await import("./route");
      const response = await POST(createMockRequest(validRequestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("File type 'image/jpeg' is not allowed.");
    });

    it("should return 400 for file size exceeding limit", async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockPresignedUrlRequestSchema.safeParse.mockReturnValue({
        success: true,
        data: validRequestBody,
      });
      mockIsFileTypeAllowed.mockReturnValue(true);
      mockIsFileSizeAllowed.mockReturnValue(false);
      mockFormatFileSize.mockImplementation((size: number) => `${size} bytes`);

      const { POST } = await import("./route");
      const response = await POST(createMockRequest(validRequestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "File size of 1048576 bytes exceeds the limit of 10485760 bytes.",
      );
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
      const response = await POST(createMockRequest(validRequestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("S3 service unavailable");
    });

    it("should successfully create presigned URL without inserting upload metadata", async () => {
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
      const response = await POST(createMockRequest(validRequestBody));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        presignedUrl: mockResult.presignedUrl,
        publicUrl: mockResult.publicUrl,
        key: mockResult.key,
      });
    });

    it("should handle request.json() failure", async () => {
      mockGetSession.mockResolvedValue(mockSession);

      const request = {
        headers: {
          get: () => "",
          has: () => false,
          set: () => {},
          entries: () => [],
        },
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")) as any,
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: "/api/upload/presigned-url" },
        url: "http://localhost:3000/api/upload/presigned-url",
      } as any as NextRequest;

      const { POST } = await import("./route");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error. Please try again later.");
    });
  });
});
