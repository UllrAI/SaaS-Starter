/**
 * @jest-environment node
 */
import {
  validateFileSignature,
  scanForMaliciousContent,
  validateFileSecurely,
  validateFileForR2,
  getExpectedExtension,
  FILE_SIGNATURES,
} from "./file-security";

// Helper function to create mock files with specific content
function createMockFile(
  content: Uint8Array | string,
  mimeType: string,
  filename: string,
): File {
  const buffer =
    typeof content === "string" ? new TextEncoder().encode(content) : content;

  const blob = new Blob([buffer], { type: mimeType });

  // Create File-like object that implements the File interface
  const file = Object.create(blob);
  Object.defineProperty(file, "name", { value: filename });
  Object.defineProperty(file, "lastModified", { value: Date.now() });
  Object.defineProperty(file, "webkitRelativePath", { value: "" });

  return file as File;
}

describe("File Security Validation", () => {
  describe("validateFileSignature", () => {
    it("should validate valid JPEG files", async () => {
      // JPEG JFIF signature
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ]);
      const file = createMockFile(jpegData, "image/jpeg", "test.jpg");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should validate valid PNG files", async () => {
      // PNG signature
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const file = createMockFile(pngData, "image/png", "test.png");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(true);
    });

    it("should validate valid GIF files", async () => {
      // GIF89a signature
      const gifData = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const file = createMockFile(gifData, "image/gif", "test.gif");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(true);
    });

    it("should validate valid PDF files", async () => {
      // PDF signature
      const pdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
      ]);
      const file = createMockFile(pdfData, "application/pdf", "test.pdf");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(true);
    });

    it("should validate valid text files", async () => {
      const textData = "This is a valid text file content";
      const file = createMockFile(textData, "text/plain", "test.txt");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(true);
    });

    it("should reject files with mismatched signatures", async () => {
      // PNG signature but declared as JPEG
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const file = createMockFile(pngData, "image/jpeg", "fake.jpg");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("does not match declared type");
    });

    it("should reject text files with null bytes", async () => {
      const binaryData = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57, 0x6f,
      ]);
      const file = createMockFile(binaryData, "text/plain", "binary.txt");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("null bytes");
    });

    it("should reject text files with invalid UTF-8", async () => {
      const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);
      const file = createMockFile(invalidUtf8, "text/plain", "invalid.txt");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("invalid UTF-8");
    });

    it("should reject unsupported file types", async () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const file = createMockFile(data, "application/unknown", "test.unknown");

      const result = await validateFileSignature(file);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("not supported");
    });
  });

  describe("scanForMaliciousContent", () => {
    it("should detect script injection in content", async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const file = createMockFile(
        maliciousContent,
        "text/html",
        "malicious.html",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((threat) => threat.includes("script"))).toBe(
        true,
      );
    });

    it("should detect iframe injection", async () => {
      const maliciousContent = '<iframe src="javascript:alert(1)"></iframe>';
      const file = createMockFile(
        maliciousContent,
        "text/html",
        "malicious.html",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it("should detect javascript: URLs", async () => {
      const maliciousContent = '<a href="javascript:alert(1)">Click me</a>';
      const file = createMockFile(
        maliciousContent,
        "text/html",
        "malicious.html",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(
        result.threats.some((threat) => threat.includes("javascript:")),
      ).toBe(true);
    });

    it("should detect vbscript: URLs", async () => {
      const maliciousContent = '<a href="vbscript:MsgBox(1)">Click me</a>';
      const file = createMockFile(
        maliciousContent,
        "text/html",
        "malicious.html",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(
        result.threats.some((threat) => threat.includes("vbscript:")),
      ).toBe(true);
    });

    it("should detect data URLs with HTML", async () => {
      const maliciousContent =
        '<img src="data:text/html,<script>alert(1)</script>">';
      const file = createMockFile(
        maliciousContent,
        "text/html",
        "malicious.html",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it("should detect executable file headers", async () => {
      const executableContent = "MZ\x90\x00\x03\x00\x00\x00";
      const file = createMockFile(
        executableContent,
        "application/octet-stream",
        "malware.exe",
      );

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(false);
      expect(
        result.threats.some((threat) =>
          threat.includes("Executable file content"),
        ),
      ).toBe(true);
    });

    it("should pass clean content", async () => {
      const cleanContent =
        "This is a clean text file with no dangerous content.";
      const file = createMockFile(cleanContent, "text/plain", "clean.txt");

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it("should handle binary files without false positives", async () => {
      // Valid JPEG data without dangerous patterns
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ]);
      const file = createMockFile(jpegData, "image/jpeg", "clean.jpg");

      const result = await scanForMaliciousContent(file);

      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });
  });

  describe("validateFileSecurely", () => {
    it("should pass validation for valid files", async () => {
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ]);
      const file = createMockFile(jpegData, "image/jpeg", "valid.jpg");

      const result = await validateFileSecurely(file);

      expect(result.isValid).toBe(true);
      expect(result.isSafe).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should record signature mismatches as security risks", async () => {
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const file = createMockFile(pngData, "image/jpeg", "fake.jpg");

      const result = await validateFileSecurely(file);

      expect(result.isValid).toBe(true); // Allow upload but record risk
      expect(result.isSafe).toBe(true);
      expect(result.securityRisks.length).toBeGreaterThan(0);
    });

    it("should record malicious content as security risks", async () => {
      const maliciousData = '<script>alert("xss")</script>';
      const file = createMockFile(maliciousData, "text/html", "malicious.html");

      const result = await validateFileSecurely(file);

      expect(result.isSafe).toBe(true); // Allow upload but record risk
      expect(result.securityRisks.length).toBeGreaterThan(0);
    });

    it("should reject empty files", async () => {
      const emptyData = new Uint8Array([]);
      const file = createMockFile(emptyData, "text/plain", "empty.txt");

      const result = await validateFileSecurely(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Empty file not allowed");
    });

    it("should warn about suspicious extensions", async () => {
      const textData = 'console.log("hello");';
      const file = createMockFile(textData, "text/plain", "script.exe");

      const result = await validateFileSecurely(file);

      expect(result.isValid).toBe(true); // Allow upload
      expect(result.warnings).toContain("Suspicious file extension detected");
    });

    it("should warn about very long filenames", async () => {
      const textData = "content";
      const longName = "a".repeat(300) + ".txt";
      const file = createMockFile(textData, "text/plain", longName);

      const result = await validateFileSecurely(file);

      expect(result.warnings).toContain("File name is very long");
    });
  });

  describe("validateFileForR2", () => {
    it("should allow upload for normal files", async () => {
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ]);
      const file = createMockFile(jpegData, "image/jpeg", "photo.jpg");

      const result = await validateFileForR2(file);

      expect(result.allowUpload).toBe(true);
      expect(result.securityLog.risks).toHaveLength(0);
      expect(result.securityLog.warnings).toHaveLength(0);
    });

    it("should block empty files", async () => {
      const emptyData = new Uint8Array([]);
      const file = createMockFile(emptyData, "text/plain", "empty.txt");

      const result = await validateFileForR2(file);

      expect(result.allowUpload).toBe(false);
      expect(result.securityLog.risks).toContain("Empty file blocked");
    });

    it("should warn about suspicious extensions but allow upload", async () => {
      const textData = 'console.log("hello");';
      const file = createMockFile(textData, "text/plain", "script.exe");

      const result = await validateFileForR2(file);

      expect(result.allowUpload).toBe(true);
      expect(result.securityLog.warnings).toContain(
        "Suspicious file extension",
      );
    });

    it("should detect script injection risks but allow upload", async () => {
      const maliciousData = '<script>alert("xss")</script>';
      const file = createMockFile(maliciousData, "text/html", "test.html");

      const result = await validateFileForR2(file);

      expect(result.allowUpload).toBe(true);
      expect(result.securityLog.risks).toContain(
        "Potential script injection detected",
      );
    });

    it("should detect executable content but allow upload", async () => {
      const executableData = "MZ\x90\x00\x03\x00\x00\x00";
      const file = createMockFile(
        executableData,
        "application/octet-stream",
        "test.bin",
      );

      const result = await validateFileForR2(file);

      expect(result.allowUpload).toBe(true);
      expect(result.securityLog.risks).toContain("Executable content detected");
    });

    it("should include complete security log", async () => {
      const testData = "test content";
      const file = createMockFile(testData, "text/plain", "test.txt");

      const result = await validateFileForR2(file);

      expect(result.securityLog).toHaveProperty("fileName", "test.txt");
      expect(result.securityLog).toHaveProperty("fileSize", expect.any(Number));
      expect(result.securityLog).toHaveProperty("mimeType", "text/plain");
      expect(result.securityLog).toHaveProperty("timestamp");
      expect(result.securityLog).toHaveProperty("risks");
      expect(result.securityLog).toHaveProperty("warnings");
    });
  });

  describe("getExpectedExtension", () => {
    it("should return correct extensions for common MIME types", () => {
      expect(getExpectedExtension("image/jpeg")).toBe("jpg");
      expect(getExpectedExtension("image/png")).toBe("png");
      expect(getExpectedExtension("application/pdf")).toBe("pdf");
      expect(getExpectedExtension("text/plain")).toBe("txt");
      expect(getExpectedExtension("application/zip")).toBe("zip");
    });

    it('should return "bin" for unknown MIME types', () => {
      expect(getExpectedExtension("application/unknown")).toBe("bin");
      expect(getExpectedExtension("custom/type")).toBe("bin");
    });
  });

  describe("FILE_SIGNATURES constant", () => {
    it("should contain expected file type signatures", () => {
      expect(FILE_SIGNATURES["image/jpeg"]).toBeDefined();
      expect(FILE_SIGNATURES["image/png"]).toBeDefined();
      expect(FILE_SIGNATURES["application/pdf"]).toBeDefined();
      expect(FILE_SIGNATURES["image/jpeg"]).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([0xff, 0xd8, 0xff, 0xe0]),
        ]),
      );
    });

    it("should have PNG signature with correct bytes", () => {
      expect(FILE_SIGNATURES["image/png"][0]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle files that cannot be read", async () => {
      // Create a mock file that throws when trying to slice
      const mockFile = {
        type: "image/jpeg",
        name: "test.jpg",
        size: 100,
        slice: jest.fn().mockImplementation(() => {
          throw new Error("Cannot read file");
        }),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Error validating file signature");
    });

    it("should handle malicious content scanning errors gracefully", async () => {
      const mockFile = {
        type: "text/plain",
        name: "test.txt",
        size: 100,
        slice: jest.fn().mockImplementation(() => {
          throw new Error("Cannot read file");
        }),
      } as unknown as File;

      const result = await scanForMaliciousContent(mockFile);

      expect(result.isSafe).toBe(false);
      expect(
        result.threats.some((threat) =>
          threat.includes("Error scanning file content"),
        ),
      ).toBe(true);
    });
  });
});
