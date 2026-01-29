import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Set up environment variables for testing
process.env.R2_ENDPOINT = "https://mock-endpoint.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY_ID = "mock-access-key";
process.env.R2_SECRET_ACCESS_KEY = "mock-secret-key";
process.env.R2_BUCKET_NAME = "mock-bucket";
process.env.R2_PUBLIC_URL = "https://mock-public-url.com";

// Mock AWS SDK and other dependencies
const mockSend = jest.fn() as jest.MockedFunction<
  (...args: any[]) => Promise<any>
>;
const mockGetSignedUrl = jest.fn() as jest.MockedFunction<
  (...args: any[]) => Promise<string>
>;
const mockLookup = jest.fn() as jest.MockedFunction<
  (...args: any[]) => Promise<Array<{ address: string; family: number }>>
>;

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock("dns/promises", () => ({
  lookup: mockLookup,
}));

// Mock upload config functions
const mockIsFileTypeAllowed = jest.fn() as jest.MockedFunction<
  (...args: any[]) => boolean
>;
const mockIsFileSizeAllowed = jest.fn() as jest.MockedFunction<
  (...args: any[]) => boolean
>;
const mockGetFileExtension = jest.fn() as jest.MockedFunction<
  (...args: any[]) => string
>;

jest.mock("./config/upload", () => ({
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    PRESIGNED_URL_EXPIRATION: 15 * 60,
  },
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  getFileExtension: mockGetFileExtension,
}));

// Mock crypto
const mockRandomUUID = jest.fn() as jest.MockedFunction<() => string>;
jest.mock("crypto", () => ({
  randomUUID: mockRandomUUID,
}));

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch as typeof fetch;

describe("R2 Storage Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementations
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockGetFileExtension.mockReturnValue("jpeg");
    mockGetSignedUrl.mockResolvedValue("https://mock-presigned-url.com");
    mockSend.mockResolvedValue({});
    mockRandomUUID.mockReturnValue("mock-uuid-123");
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    // Mock Date.now for consistent testing
    jest.spyOn(Date, "now").mockReturnValue(1234567890000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("r2Client", () => {
    it("should be importable without errors", async () => {
      const { r2Client } = await import("./r2");
      expect(r2Client).toBeDefined();
    });
  });

  describe("createPresignedUrl", () => {
    it("should create presigned URL with valid parameters", async () => {
      const { createPresignedUrl } = await import("./r2");

      const result = await createPresignedUrl({
        userId: "user-123",
        fileName: "test.jpeg",
        contentType: "image/jpeg",
        size: 1024,
      });

      expect(result.success).toBe(true);
      expect(result.presignedUrl).toBe("https://mock-presigned-url.com");
      expect(result.publicUrl).toBe(
        "https://mock-public-url.com/uploads/user-123/1234567890000-mock-uuid-123.jpeg",
      );
      expect(result.key).toBe(
        "uploads/user-123/1234567890000-mock-uuid-123.jpeg",
      );
    });

    it("should reject invalid file types", async () => {
      const { createPresignedUrl } = await import("./r2");

      mockIsFileTypeAllowed.mockReturnValue(false);

      const result = await createPresignedUrl({
        userId: "user-123",
        fileName: "test.exe",
        contentType: "application/exe",
        size: 1024,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("File type application/exe is not allowed");
    });

    it("should reject oversized files", async () => {
      const { createPresignedUrl } = await import("./r2");

      mockIsFileSizeAllowed.mockReturnValue(false);

      const result = await createPresignedUrl({
        userId: "user-123",
        fileName: "test.jpeg",
        contentType: "image/jpeg",
        size: 100 * 1024 * 1024,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "File size 104857600 bytes exceeds maximum allowed size of 52428800 bytes",
      );
    });

    it("should handle errors gracefully", async () => {
      const { createPresignedUrl } = await import("./r2");

      mockGetSignedUrl.mockRejectedValue(new Error("Test error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await createPresignedUrl({
        userId: "user-123",
        fileName: "test.jpeg",
        contentType: "image/jpeg",
        size: 1024,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create presigned URL");

      consoleSpy.mockRestore();
    });
  });

  describe("uploadFromUrl", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)) as any,
        headers: {
          get: jest.fn().mockReturnValue("image/jpeg"),
        },
      } as any as Response);
    });

    it("should upload file from URL successfully", async () => {
      const { uploadFromUrl } = await import("./r2");

      const result = await uploadFromUrl(
        "https://example.com/image.jpg",
        "test-key",
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://mock-public-url.com/test-key");
      expect(result.key).toBe("test-key");
    });

    it("should block private or local addresses", async () => {
      const { uploadFromUrl } = await import("./r2");

      const result = await uploadFromUrl(
        "http://127.0.0.1/secret.txt",
        "test-key",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Blocked URL host");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
      const { uploadFromUrl } = await import("./r2");

      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as Response);

      const result = await uploadFromUrl(
        "https://example.com/missing.jpg",
        "test-key",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch file from URL: Not Found");
    });
  });

  describe("uploadBuffer", () => {
    it("should upload buffer successfully", async () => {
      const { uploadBuffer } = await import("./r2");

      const buffer = Buffer.from("test content");
      const result = await uploadBuffer(buffer, "test-key", "text/plain");

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://mock-public-url.com/test-key");
      expect(result.key).toBe("test-key");
    });

    it("should validate file type before upload", async () => {
      const { uploadBuffer } = await import("./r2");

      mockIsFileTypeAllowed.mockReturnValue(false);

      const buffer = Buffer.from("test content");
      const result = await uploadBuffer(buffer, "test-key", "application/exe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("File type application/exe is not allowed");
    });

    it("should validate file size before upload", async () => {
      const { uploadBuffer } = await import("./r2");

      mockIsFileSizeAllowed.mockReturnValue(false);

      const buffer = Buffer.from("test content");
      const result = await uploadBuffer(buffer, "test-key", "text/plain");

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "File size 12 bytes exceeds maximum allowed size of 52428800 bytes",
      );
    });

    it("should handle upload errors gracefully", async () => {
      const { uploadBuffer } = await import("./r2");

      mockSend.mockRejectedValue(new Error("Upload failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const buffer = Buffer.from("test content");
      const result = await uploadBuffer(buffer, "test-key", "text/plain");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Upload failed");

      consoleSpy.mockRestore();
    });

    it("should handle non-Error exceptions in upload", async () => {
      const { uploadBuffer } = await import("./r2");

      mockSend.mockRejectedValue("String error");
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const buffer = Buffer.from("test content");
      const result = await uploadBuffer(buffer, "test-key", "text/plain");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to upload buffer");

      consoleSpy.mockRestore();
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      const { deleteFile } = await import("./r2");

      const result = await deleteFile("test-key");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it("should handle delete errors", async () => {
      const { deleteFile } = await import("./r2");

      mockSend.mockRejectedValue(new Error("Delete failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await deleteFile("test-key");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");

      consoleSpy.mockRestore();
    });
  });

  describe("deleteFiles", () => {
    it("should delete multiple files successfully", async () => {
      const { deleteFiles } = await import("./r2");

      const result = await deleteFiles(["key1", "key2"]);

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it("should handle empty keys array", async () => {
      const { deleteFiles } = await import("./r2");

      const result = await deleteFiles([]);

      expect(result.success).toBe(true);
    });

    it("should handle batch delete errors", async () => {
      const { deleteFiles } = await import("./r2");

      mockSend.mockRejectedValue(new Error("Batch delete failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await deleteFiles(["key1", "key2"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Batch delete failed");

      consoleSpy.mockRestore();
    });
  });

  describe("getDownloadUrl", () => {
    it("should generate download URL successfully", async () => {
      const { getDownloadUrl } = await import("./r2");

      const result = await getDownloadUrl("test-key");

      expect(result).toBe("https://mock-presigned-url.com");
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });

    it("should handle download URL errors", async () => {
      const { getDownloadUrl } = await import("./r2");

      mockGetSignedUrl.mockRejectedValue(new Error("Download error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await getDownloadUrl("test-key");

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it("should use custom expiration time", async () => {
      const { getDownloadUrl } = await import("./r2");

      await getDownloadUrl("test-key", 7200);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { expiresIn: 7200 },
      );
    });
  });
});
