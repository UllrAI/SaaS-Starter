import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

process.env.R2_PUBLIC_URL = "https://cdn.example.com";

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    R2_PUBLIC_URL: "https://cdn.example.com",
  },
}));

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

const mockFileExists = jest.fn() as any;
jest.mock("@/lib/r2", () => ({
  fileExists: mockFileExists,
}));

const mockSelectLimit = jest.fn().mockResolvedValue([]) as any;
const mockSelectWhere = jest.fn().mockReturnValue({
  limit: mockSelectLimit,
}) as any;
const mockSelectFrom = jest.fn().mockReturnValue({
  where: mockSelectWhere,
}) as any;
const mockInsertValues = jest.fn().mockResolvedValue(undefined) as any;
const mockDb = {
  select: jest.fn().mockReturnValue({
    from: mockSelectFrom,
  }) as any,
  insert: jest.fn().mockReturnValue({
    values: mockInsertValues,
  }) as any,
};
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  uploads: {
    __table: "uploads-table",
    userId: "userId",
    fileKey: "fileKey",
  },
}));

jest.mock("drizzle-orm", () => ({
  and: jest.fn((...conditions: unknown[]) => conditions),
  eq: jest.fn((field: unknown, value: unknown) => ({ field, value })),
}));

const mockIsFileTypeAllowed = jest.fn() as any;
const mockIsFileSizeAllowed = jest.fn() as any;
const mockFormatFileSize = jest.fn() as any;
const mockUploadCompleteRequestSchema = {
  safeParse: jest.fn() as any,
};

jest.mock("@/lib/config/upload", () => ({
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10485760,
  },
  formatFileSize: mockFormatFileSize,
  uploadCompleteRequestSchema: mockUploadCompleteRequestSchema,
}));

describe("Upload Complete API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectLimit.mockResolvedValue([]);
    mockSelectWhere.mockReturnValue({
      limit: mockSelectLimit,
    });
    mockSelectFrom.mockReturnValue({
      where: mockSelectWhere,
    });
    mockDb.select.mockReturnValue({
      from: mockSelectFrom,
    });
    mockDb.insert.mockReturnValue({
      values: mockInsertValues,
    });
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
      nextUrl: { pathname: "/api/upload/complete" },
      url: "http://localhost:3000/api/upload/complete",
    }) as any as NextRequest;

  const mockSession = {
    user: {
      id: "user-123",
    },
  };

  const validRequestBody = {
    fileName: "test-image.jpg",
    contentType: "image/jpeg",
    size: 1048576,
    key: "uploads/user-123/test-image.jpg",
    url: "https://cdn.example.com/uploads/user-123/test-image.jpg",
  };

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
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          fieldErrors: {
            key: ["Required"],
          },
        }),
      },
    });

    const { POST } = await import("./route");
    const response = await POST(createMockRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });

  it("should reject upload keys that do not belong to the current user", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        ...validRequestBody,
        key: "uploads/another-user/test-image.jpg",
      },
    });

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Upload key does not belong to the current user.");
  });

  it("should reject when uploaded object cannot be verified", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: validRequestBody,
    });
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockFileExists.mockResolvedValue(false);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Uploaded object could not be verified.");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should reject upload urls that do not match the configured object key", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        ...validRequestBody,
        url: "https://cdn.example.com/uploads/user-123/another-file.jpg",
      },
    });

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Upload URL does not match the stored object key.");
  });

  it("should reject disallowed file types", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
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

  it("should reject files that exceed the configured size limit", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: validRequestBody,
    });
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(false);
    mockFormatFileSize.mockImplementation((size: number) =>
      size === validRequestBody.size ? "1 MB" : "10 MB",
    );

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("File size of 1 MB exceeds the limit of 10 MB.");
  });

  it("should return the existing upload record without inserting a duplicate", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: validRequestBody,
    });
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockFileExists.mockResolvedValue(true);
    const existingUpload = {
      fileKey: validRequestBody.key,
      url: validRequestBody.url,
      fileName: validRequestBody.fileName,
      fileSize: validRequestBody.size,
      contentType: validRequestBody.contentType,
    };
    mockSelectLimit.mockResolvedValue([existingUpload]);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(data.file).toEqual({
      key: existingUpload.fileKey,
      url: existingUpload.url,
      fileName: existingUpload.fileName,
      size: existingUpload.fileSize,
      contentType: existingUpload.contentType,
    });
  });

  it("should return 500 when unexpected errors occur", async () => {
    mockGetSession.mockRejectedValue(new Error("session exploded"));

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error. Please try again later.");
  });

  it("should persist upload metadata after object verification", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockUploadCompleteRequestSchema.safeParse.mockReturnValue({
      success: true,
      data: validRequestBody,
    });
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockFileExists.mockResolvedValue(true);

    const { POST } = await import("./route");
    const response = await POST(createMockRequest(validRequestBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ __table: "uploads-table" }),
    );
    expect(mockInsertValues).toHaveBeenCalledWith({
      userId: "user-123",
      fileKey: validRequestBody.key,
      url: validRequestBody.url,
      fileName: validRequestBody.fileName,
      fileSize: validRequestBody.size,
      contentType: validRequestBody.contentType,
    });
    expect(data.file).toEqual({
      key: validRequestBody.key,
      url: validRequestBody.url,
      fileName: validRequestBody.fileName,
      size: validRequestBody.size,
      contentType: validRequestBody.contentType,
    });
  });
});
