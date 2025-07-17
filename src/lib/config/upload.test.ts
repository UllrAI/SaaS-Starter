import { describe, it, expect } from "@jest/globals";
import {
  UPLOAD_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  formatFileSize,
  getFileExtension,
  presignedUrlRequestSchema,
} from "./upload";

describe("Upload Configuration", () => {
  describe("UPLOAD_CONFIG", () => {
    it("should have correct maximum file size", () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE).toBe(50 * 1024 * 1024); // 50MB
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE_MB).toBe(50);
    });

    it("should have correct presigned URL expiration", () => {
      expect(UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION).toBe(15 * 60); // 15 minutes
    });

    it("should have allowed file types array", () => {
      expect(Array.isArray(UPLOAD_CONFIG.ALLOWED_FILE_TYPES)).toBe(true);
      expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES.length).toBeGreaterThan(0);
    });

    it("should include common file types", () => {
      expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES).toContain("image/jpeg");
      expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES).toContain("image/png");
      expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES).toContain("application/pdf");
      expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES).toContain("text/plain");
    });
  });

  describe("isFileTypeAllowed", () => {
    it("should return true for allowed image types", () => {
      expect(isFileTypeAllowed("image/jpeg")).toBe(true);
      expect(isFileTypeAllowed("image/png")).toBe(true);
      expect(isFileTypeAllowed("image/gif")).toBe(true);
      expect(isFileTypeAllowed("image/webp")).toBe(true);
    });

    it("should return true for allowed document types", () => {
      expect(isFileTypeAllowed("application/pdf")).toBe(true);
      expect(isFileTypeAllowed("application/msword")).toBe(true);
      expect(
        isFileTypeAllowed(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).toBe(true);
    });

    it("should return true for allowed text types", () => {
      expect(isFileTypeAllowed("text/plain")).toBe(true);
      expect(isFileTypeAllowed("text/csv")).toBe(true);
      expect(isFileTypeAllowed("application/json")).toBe(true);
    });

    it("should return false for disallowed types", () => {
      expect(isFileTypeAllowed("application/x-executable")).toBe(false);
      expect(isFileTypeAllowed("video/unknown")).toBe(false);
      expect(isFileTypeAllowed("application/malware")).toBe(false);
      expect(isFileTypeAllowed("")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(isFileTypeAllowed("image/JPEG")).toBe(false);
      expect(isFileTypeAllowed("IMAGE/JPEG")).toBe(false);
    });
  });

  describe("isFileSizeAllowed", () => {
    it("should return true for files within size limit", () => {
      expect(isFileSizeAllowed(1024)).toBe(true); // 1KB
      expect(isFileSizeAllowed(1024 * 1024)).toBe(true); // 1MB
      expect(isFileSizeAllowed(25 * 1024 * 1024)).toBe(true); // 25MB
      expect(isFileSizeAllowed(50 * 1024 * 1024)).toBe(true); // 50MB exactly
    });

    it("should return false for files exceeding size limit", () => {
      expect(isFileSizeAllowed(50 * 1024 * 1024 + 1)).toBe(false); // 50MB + 1 byte
      expect(isFileSizeAllowed(100 * 1024 * 1024)).toBe(false); // 100MB
      expect(isFileSizeAllowed(1024 * 1024 * 1024)).toBe(false); // 1GB
    });

    it("should handle edge cases", () => {
      expect(isFileSizeAllowed(0)).toBe(true);
      expect(isFileSizeAllowed(-1)).toBe(true); // Function doesn't validate negative, just checks <= MAX
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1)).toBe("1 Bytes");
      expect(formatFileSize(512)).toBe("512 Bytes");
      expect(formatFileSize(1023)).toBe("1023 Bytes");
    });

    it("should format kilobytes correctly", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
      expect(formatFileSize(1048575)).toBe("1024 KB");
    });

    it("should format megabytes correctly", () => {
      expect(formatFileSize(1048576)).toBe("1 MB"); // 1024^2
      expect(formatFileSize(1572864)).toBe("1.5 MB"); // 1.5MB
      expect(formatFileSize(52428800)).toBe("50 MB"); // 50MB
    });

    it("should format gigabytes correctly", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB"); // 1024^3
      expect(formatFileSize(2147483648)).toBe("2 GB"); // 2GB
    });

    it("should format terabytes correctly", () => {
      expect(formatFileSize(1099511627776)).toBe("1 TB"); // 1024^4
    });

    it("should handle large numbers", () => {
      const result = formatFileSize(1.5 * 1024 * 1024 * 1024 * 1024); // 1.5TB
      expect(result).toBe("1.5 TB");
    });
  });

  describe("getFileExtension", () => {
    it("should return correct extensions for image types", () => {
      expect(getFileExtension("image/jpeg")).toBe("jpeg");
      expect(getFileExtension("image/png")).toBe("png");
      expect(getFileExtension("image/gif")).toBe("gif");
      expect(getFileExtension("image/webp")).toBe("webp");
      expect(getFileExtension("image/svg+xml")).toBe("svg");
    });

    it("should return correct extensions for document types", () => {
      expect(getFileExtension("application/pdf")).toBe("pdf");
      expect(getFileExtension("application/msword")).toBe("doc");
      expect(
        getFileExtension(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).toBe("docx");
    });

    it("should return correct extensions for text types", () => {
      expect(getFileExtension("text/plain")).toBe("txt");
      expect(getFileExtension("text/csv")).toBe("csv");
      expect(getFileExtension("application/json")).toBe("json");
      expect(getFileExtension("text/markdown")).toBe("md");
    });

    it("should return correct extensions for audio/video types", () => {
      expect(getFileExtension("audio/mpeg")).toBe("mp3");
      expect(getFileExtension("video/mp4")).toBe("mp4");
      expect(getFileExtension("audio/wav")).toBe("wav");
      expect(getFileExtension("video/webm")).toBe("webm");
    });

    it("should return correct extensions for archive types", () => {
      expect(getFileExtension("application/zip")).toBe("zip");
      expect(getFileExtension("application/x-rar-compressed")).toBe("rar");
      expect(getFileExtension("application/x-7z-compressed")).toBe("7z");
    });

    it("should handle fallback for unknown types", () => {
      expect(getFileExtension("application/unknown")).toBe("unknown");
      expect(getFileExtension("text/custom")).toBe("custom");
      expect(getFileExtension("image/custom-format")).toBe("custom-format");
    });

    it("should handle complex MIME types with plus signs", () => {
      expect(getFileExtension("application/vnd.api+json")).toBe("vnd.api");
      expect(getFileExtension("image/svg+xml")).toBe("svg");
    });

    it("should handle edge cases", () => {
      expect(getFileExtension("application/*")).toBe("bin"); // Wildcard subtype
      expect(getFileExtension("unknown/format")).toBe("format");
      expect(getFileExtension("")).toBe("bin"); // Empty string
      expect(getFileExtension("invalid")).toBe("bin"); // No slash
    });
  });

  describe("presignedUrlRequestSchema", () => {
    it("should validate correct input", () => {
      const validInput = {
        fileName: "test.jpg",
        contentType: "image/jpeg",
        size: 1024,
      };

      const result = presignedUrlRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should reject empty file name", () => {
      const invalidInput = {
        fileName: "",
        contentType: "image/jpeg",
        size: 1024,
      };

      const result = presignedUrlRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "File name cannot be empty.",
        );
      }
    });

    it("should reject very long file name", () => {
      const invalidInput = {
        fileName: "a".repeat(256), // Too long
        contentType: "image/jpeg",
        size: 1024,
      };

      const result = presignedUrlRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("File name is too long.");
      }
    });

    it("should reject empty content type", () => {
      const invalidInput = {
        fileName: "test.jpg",
        contentType: "",
        size: 1024,
      };

      const result = presignedUrlRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Content type cannot be empty.",
        );
      }
    });

    it("should reject negative or zero size", () => {
      const invalidInput1 = {
        fileName: "test.jpg",
        contentType: "image/jpeg",
        size: 0,
      };

      const invalidInput2 = {
        fileName: "test.jpg",
        contentType: "image/jpeg",
        size: -1,
      };

      const result1 = presignedUrlRequestSchema.safeParse(invalidInput1);
      const result2 = presignedUrlRequestSchema.safeParse(invalidInput2);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);

      if (!result1.success) {
        expect(result1.error.issues[0].message).toBe(
          "File size must be positive.",
        );
      }
      if (!result2.success) {
        expect(result2.error.issues[0].message).toBe(
          "File size must be positive.",
        );
      }
    });

    it("should accept maximum valid file name length", () => {
      const validInput = {
        fileName: "a".repeat(255), // Maximum length
        contentType: "image/jpeg",
        size: 1024,
      };

      const result = presignedUrlRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should handle missing fields", () => {
      const incompleteInput = {
        fileName: "test.jpg",
        // missing contentType and size
      };

      const result = presignedUrlRequestSchema.safeParse(incompleteInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should handle invalid data types", () => {
      const invalidInput = {
        fileName: 123, // Should be string
        contentType: null, // Should be string
        size: "1024", // Should be number
      };

      const result = presignedUrlRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should handle extremely large numbers", () => {
      const invalidInput = {
        fileName: "test.jpg",
        contentType: "image/jpeg",
        size: Number.MAX_SAFE_INTEGER,
      };

      const result = presignedUrlRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(true); // Large numbers should be allowed by schema
    });

    it("should handle special characters in file names", () => {
      const specialCharInputs = [
        {
          fileName: "test file with spaces.jpg",
          contentType: "image/jpeg",
          size: 1024,
        },
        {
          fileName: "test-file_with.special.chars.jpg",
          contentType: "image/jpeg",
          size: 1024,
        },
        { fileName: "测试文件.jpg", contentType: "image/jpeg", size: 1024 },
        { fileName: "файл.jpg", contentType: "image/jpeg", size: 1024 },
      ];

      specialCharInputs.forEach((input) => {
        const result = presignedUrlRequestSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("MIME Type to Extension Mapping", () => {
    it("should have comprehensive MIME type coverage", () => {
      const expectedCategories = [
        "image/jpeg",
        "image/png",
        "image/gif", // Images
        "application/pdf",
        "application/msword", // Documents
        "audio/mpeg",
        "video/mp4", // Media
        "text/plain",
        "application/json", // Text
        "application/zip", // Archives
      ];

      expectedCategories.forEach((mimeType) => {
        expect(UPLOAD_CONFIG.ALLOWED_FILE_TYPES).toContain(mimeType);
      });
    });

    it("should not contain duplicate MIME types", () => {
      const uniqueTypes = new Set(UPLOAD_CONFIG.ALLOWED_FILE_TYPES);
      expect(uniqueTypes.size).toBe(UPLOAD_CONFIG.ALLOWED_FILE_TYPES.length);
    });
  });

  describe("Configuration Constants", () => {
    it("should have consistent size values", () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE).toBe(
        UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
      );
    });

    it("should have reasonable timeout values", () => {
      expect(UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION).toBeGreaterThan(0);
      expect(UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION).toBeLessThanOrEqual(3600); // Not more than 1 hour
    });

    it("should have reasonable file size limits", () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE_MB).toBeGreaterThan(0);
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE_MB).toBeLessThanOrEqual(1000); // Not more than 1GB
    });
  });

  describe("Error Conditions and Edge Cases", () => {
    it("should handle null and undefined inputs gracefully", () => {
      expect(isFileTypeAllowed(null as unknown as string)).toBe(false);
      expect(isFileTypeAllowed(undefined as unknown as string)).toBe(false);
      expect(isFileSizeAllowed(null as unknown as number)).toBe(true); // null <= MAX_FILE_SIZE is true
      expect(isFileSizeAllowed(undefined as unknown as number)).toBe(false); // undefined <= MAX_FILE_SIZE is false
    });

    it("should handle very small files", () => {
      expect(isFileSizeAllowed(1)).toBe(true);
      expect(formatFileSize(1)).toBe("1 Bytes");
    });

    it("should handle getFileExtension with edge cases", () => {
      expect(getFileExtension("")).toBe("bin");
      expect(getFileExtension("invalidformat")).toBe("bin");
      expect(getFileExtension("application/")).toBe("bin"); // Empty subtype
      expect(getFileExtension("text/")).toBe("bin"); // Empty subtype
      expect(getFileExtension("/subtype")).toBe("subtype"); // Missing type
    });

    it("should handle formatFileSize with extreme values", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1023)).toBe("1023 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");

      // Test very large numbers - formatFileSize only handles up to TB
      const veryLarge = 1024 * 1024 * 1024 * 1024; // 1TB
      const result = formatFileSize(veryLarge);
      expect(result).toBe("1 TB");
    });

    it("should handle getFileExtension with complex MIME types", () => {
      expect(getFileExtension("application/vnd.custom-format+xml")).toBe(
        "vnd.custom-format",
      );
      expect(getFileExtension("text/vnd.custom+json")).toBe("vnd.custom");
      expect(getFileExtension("application/x-custom-format")).toBe(
        "x-custom-format",
      );
    });
  });
});
