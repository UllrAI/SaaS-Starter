import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

process.env.R2_ENDPOINT = "https://mock-endpoint.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY_ID = "mock-access-key";
process.env.R2_SECRET_ACCESS_KEY = "mock-secret-key";
process.env.R2_BUCKET_NAME = "mock-bucket";
process.env.R2_PUBLIC_URL = "https://mock-public-url.com";

const mockSend = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetSignedUrl = jest.fn<(...args: unknown[]) => Promise<string>>();
const mockIsFileTypeAllowed = jest.fn<(contentType: string) => boolean>();
const mockIsFileSizeAllowed = jest.fn<(size: number) => boolean>();
const mockGetFileExtension = jest.fn<(contentType: string) => string>();
const mockRandomUUID = jest.fn<() => string>();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  HeadObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock("./config/upload", () => ({
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    PRESIGNED_URL_EXPIRATION: 15 * 60,
  },
  isFileTypeAllowed: mockIsFileTypeAllowed,
  isFileSizeAllowed: mockIsFileSizeAllowed,
  getFileExtension: mockGetFileExtension,
  normalizeContentType: jest.fn((contentType: string) => contentType),
}));

jest.mock("crypto", () => ({
  randomUUID: mockRandomUUID,
}));

describe("R2 storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFileTypeAllowed.mockReturnValue(true);
    mockIsFileSizeAllowed.mockReturnValue(true);
    mockGetFileExtension.mockReturnValue("jpeg");
    mockGetSignedUrl.mockResolvedValue("https://mock-presigned-url.com");
    mockSend.mockResolvedValue({});
    mockRandomUUID.mockReturnValue("mock-uuid-123");
    jest.spyOn(Date, "now").mockReturnValue(1234567890000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exports an initialized client", async () => {
    const { r2Client } = await import("./r2");
    expect(r2Client).toBeDefined();
  });

  it("normalizes public URLs", async () => {
    const { buildR2PublicUrl } = await import("./r2");

    expect(
      buildR2PublicUrl("/uploads/user/file.jpg", "https://cdn.example/"),
    ).toBe("https://cdn.example/uploads/user/file.jpg");
  });

  describe("createPresignedUrl", () => {
    const input = {
      userId: "user-123",
      fileName: "test.jpeg",
      contentType: "image/jpeg",
      size: 1024,
    };

    it("creates a constrained direct-upload URL", async () => {
      const { createPresignedUrl } = await import("./r2");

      await expect(createPresignedUrl(input)).resolves.toEqual({
        success: true,
        presignedUrl: "https://mock-presigned-url.com",
        publicUrl:
          "https://mock-public-url.com/uploads/user-123/1234567890000-mock-uuid-123.jpeg",
        key: "uploads/user-123/1234567890000-mock-uuid-123.jpeg",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 },
      );
    });

    it("rejects unsupported file types before signing", async () => {
      const { createPresignedUrl } = await import("./r2");
      mockIsFileTypeAllowed.mockReturnValue(false);

      await expect(
        createPresignedUrl({
          ...input,
          contentType: "application/x-msdownload",
        }),
      ).resolves.toEqual({
        success: false,
        error: "File type application/x-msdownload is not allowed",
      });
      expect(mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it("rejects oversized files before signing", async () => {
      const { createPresignedUrl } = await import("./r2");
      mockIsFileSizeAllowed.mockReturnValue(false);

      await expect(
        createPresignedUrl({ ...input, size: 100 * 1024 * 1024 }),
      ).resolves.toEqual({
        success: false,
        error:
          "File size 104857600 bytes exceeds maximum allowed size of 52428800 bytes",
      });
      expect(mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it("returns a controlled error when signing fails", async () => {
      const { createPresignedUrl } = await import("./r2");
      mockGetSignedUrl.mockRejectedValue(new Error("signing failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await expect(createPresignedUrl(input)).resolves.toEqual({
        success: false,
        error: "Failed to create presigned URL",
      });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("getObjectMetadata", () => {
    it("returns normalized object metadata", async () => {
      const { getObjectMetadata } = await import("./r2");
      mockSend.mockResolvedValueOnce({
        ContentLength: 2048,
        ContentType: "image/png",
      });

      await expect(getObjectMetadata("test-key")).resolves.toEqual({
        contentLength: 2048,
        contentType: "image/png",
      });
    });

    it("returns null for missing or incomplete objects", async () => {
      const { getObjectMetadata } = await import("./r2");
      mockSend
        .mockRejectedValueOnce({
          name: "NotFound",
          $metadata: { httpStatusCode: 404 },
        })
        .mockResolvedValueOnce({ ContentType: "image/png" });

      await expect(getObjectMetadata("missing-key")).resolves.toBeNull();
      await expect(getObjectMetadata("incomplete-key")).resolves.toBeNull();
    });

    it("surfaces unexpected storage failures", async () => {
      const { getObjectMetadata } = await import("./r2");
      mockSend.mockRejectedValueOnce(new Error("timeout"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await expect(getObjectMetadata("test-key")).rejects.toThrow("timeout");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("deletion", () => {
    it("deletes one object", async () => {
      const { deleteFile } = await import("./r2");

      await expect(deleteFile("test-key")).resolves.toEqual({ success: true });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("deletes multiple objects and skips empty batches", async () => {
      const { deleteFiles } = await import("./r2");

      await expect(deleteFiles(["key-1", "key-2"])).resolves.toEqual({
        success: true,
      });
      await expect(deleteFiles([])).resolves.toEqual({ success: true });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("reports per-object failures from batch deletion", async () => {
      const { deleteFiles } = await import("./r2");
      mockSend.mockResolvedValueOnce({
        Errors: [{ Key: "key-2", Code: "AccessDenied" }],
      });

      await expect(deleteFiles(["key-1", "key-2"])).resolves.toEqual({
        success: false,
        error: "Failed to delete 1 object(s): key-2",
      });
    });

    it("returns controlled deletion errors", async () => {
      const { deleteFile, deleteFiles } = await import("./r2");
      mockSend
        .mockRejectedValueOnce(new Error("delete failed"))
        .mockRejectedValueOnce(new Error("batch failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await expect(deleteFile("test-key")).resolves.toEqual({
        success: false,
        error: "delete failed",
      });
      await expect(deleteFiles(["test-key"])).resolves.toEqual({
        success: false,
        error: "batch failed",
      });
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });
  });
});
