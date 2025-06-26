/**
 * File security validation utilities
 * Implements magic number validation and file content security checks
 */

// Magic numbers for file type validation
export const FILE_SIGNATURES = {
  // Images
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xe0], // JPEG JFIF
    [0xff, 0xd8, 0xff, 0xe1], // JPEG EXIF
    [0xff, 0xd8, 0xff, 0xe2], // JPEG FPXR
    [0xff, 0xd8, 0xff, 0xe3], // JPEG APP3
    [0xff, 0xd8, 0xff, 0xe8], // JPEG APP8
    [0xff, 0xd8, 0xff, 0xdb], // JPEG raw
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF (need to check for WEBP at offset 8)
  ],
  "image/bmp": [
    [0x42, 0x4d], // BM
  ],
  "image/tiff": [
    [0x49, 0x49, 0x2a, 0x00], // II (little endian)
    [0x4d, 0x4d, 0x00, 0x2a], // MM (big endian)
  ],

  // Documents
  "application/pdf": [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
  "application/msword": [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // MS Office legacy
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04], // ZIP (need additional validation)
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04], // ZIP (need additional validation)
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    [0x50, 0x4b, 0x03, 0x04], // ZIP (need additional validation)
  ],

  // Text files
  "text/plain": [], // No specific signature, validate by content
  "text/csv": [], // No specific signature, validate by content
  "application/json": [], // No specific signature, validate by content

  // Audio
  "audio/mpeg": [
    [0xff, 0xfb], // MP3 (variable)
    [0xff, 0xf3], // MP3 (variable)
    [0xff, 0xf2], // MP3 (variable)
    [0x49, 0x44, 0x33], // ID3v2
  ],
  "audio/wav": [
    [0x52, 0x49, 0x46, 0x46], // RIFF (need to check for WAVE at offset 8)
  ],

  // Video
  "video/mp4": [
    [0x66, 0x74, 0x79, 0x70], // ftyp (at offset 4)
  ],
  "video/quicktime": [
    [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ftyp qt
  ],

  // Archives
  "application/zip": [
    [0x50, 0x4b, 0x03, 0x04], // Local file header
    [0x50, 0x4b, 0x05, 0x06], // End of central directory
    [0x50, 0x4b, 0x07, 0x08], // Spanned archive
  ],
  "application/x-rar-compressed": [
    [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00], // RAR v1.5+
    [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00], // RAR v5.0+
  ],
  "application/x-7z-compressed": [
    [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // 7z
  ],
} as const;

// Dangerous file patterns to detect
const DANGEROUS_PATTERNS = [
  // Script injection patterns
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,

  // Executable file signatures
  /MZ/, // PE executable
  /\x7fELF/, // ELF executable
  /\xCA\xFE\xBA\xBE/, // Java class file
  /\xFE\xED\xFA/, // Mach-O executable
];

/**
 * Validates file content against its declared MIME type using magic numbers
 */
export async function validateFileSignature(file: File): Promise<{
  isValid: boolean;
  detectedType?: string;
  reason?: string;
}> {
  try {
    // Read first 32 bytes for signature detection
    const buffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const signatures =
      FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];

    // Handle special cases for text files
    if (file.type.startsWith("text/") || file.type === "application/json") {
      return validateTextFile(file, bytes);
    }

    if (!signatures || signatures.length === 0) {
      return {
        isValid: false,
        reason: `File type '${file.type}' is not supported for signature validation`,
      };
    }

    // Check if any signature matches
    for (const signature of signatures) {
      if (matchesSignature(bytes, signature)) {
        // Special validation for WEBP and WAV (RIFF containers)
        if (file.type === "image/webp") {
          return validateRIFFContainer(file, "WEBP");
        }
        if (file.type === "audio/wav") {
          return validateRIFFContainer(file, "WAVE");
        }
        // Special validation for MP4
        if (file.type === "video/mp4") {
          return validateMP4Container(file);
        }

        return { isValid: true };
      }
    }

    return {
      isValid: false,
      reason: `File signature does not match declared type '${file.type}'`,
    };
  } catch (error) {
    return {
      isValid: false,
      reason: `Error validating file signature: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Scans file content for dangerous patterns
 */
export async function scanForMaliciousContent(file: File): Promise<{
  isSafe: boolean;
  threats: string[];
}> {
  try {
    // For large files, only scan first 1MB
    const scanSize = Math.min(file.size, 1024 * 1024);
    const buffer = await file.slice(0, scanSize).arrayBuffer();
    const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

    const threats: string[] = [];

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        threats.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check for suspicious file headers in text content
    if (content.includes("MZ\x90\x00") || content.includes("\x7fELF")) {
      threats.push("Executable file content detected");
    }

    // Check for embedded scripts in images
    if (
      file.type.startsWith("image/") &&
      /<script|javascript:/i.test(content)
    ) {
      threats.push("Script injection detected in image");
    }

    return {
      isSafe: threats.length === 0,
      threats,
    };
  } catch (error) {
    return {
      isSafe: false,
      threats: [
        `Error scanning file content: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Comprehensive file security validation for R2 hosting
 * Records security risks but allows upload to proceed
 */
export async function validateFileSecurely(file: File): Promise<{
  isValid: boolean;
  isSafe: boolean;
  errors: string[];
  warnings: string[];
  securityRisks: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const securityRisks: string[] = [];

  // Only validate critical issues that should block upload
  if (file.size === 0) {
    errors.push("Empty file not allowed");
  }

  // Record security risks without blocking
  try {
    // Quick signature validation (non-blocking)
    const signatureResult = await validateFileSignature(file);
    if (!signatureResult.isValid) {
      securityRisks.push(`Signature mismatch: ${signatureResult.reason}`);
    }

    // Quick malicious content scan (non-blocking)
    const scanResult = await scanForMaliciousContent(file);
    if (!scanResult.isSafe) {
      securityRisks.push(...scanResult.threats);
    }
  } catch (error) {
    // Log security scan errors but don't block upload
    securityRisks.push(
      `Security scan error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Check for suspicious extensions (warning only)
  const suspiciousExtensions =
    /\.(exe|bat|cmd|scr|pif|vbs|js|jar|com|dll|sys)$/i;
  if (suspiciousExtensions.test(file.name)) {
    warnings.push("Suspicious file extension detected");
  }

  if (file.name.length > 255) {
    warnings.push("File name is very long");
  }

  return {
    isValid: errors.length === 0, // Only block for critical errors
    isSafe: true, // Always allow upload for R2 hosting
    errors,
    warnings,
    securityRisks,
  };
}

/**
 * Lightweight security validation for better performance
 * Only performs essential checks
 */
export async function validateFileForR2(file: File): Promise<{
  allowUpload: boolean;
  securityLog: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    risks: string[];
    warnings: string[];
    timestamp: string;
  };
}> {
  const risks: string[] = [];
  const warnings: string[] = [];

  // Only block empty files
  if (file.size === 0) {
    return {
      allowUpload: false,
      securityLog: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        risks: ["Empty file blocked"],
        warnings: [],
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Quick extension check
  const suspiciousExtensions =
    /\.(exe|bat|cmd|scr|pif|vbs|js|jar|com|dll|sys)$/i;
  if (suspiciousExtensions.test(file.name)) {
    warnings.push("Suspicious file extension");
  }

  // Quick content scan for obvious threats (first 1KB only for performance)
  try {
    if (file.size > 0) {
      const buffer = await file
        .slice(0, Math.min(1024, file.size))
        .arrayBuffer();
      const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

      if (/<script|javascript:|vbscript:|data:text\/html/i.test(content)) {
        risks.push("Potential script injection detected");
      }

      if (/MZ|ELF/.test(content)) {
        risks.push("Executable content detected");
      }
    }
  } catch {
    // Ignore scan errors for performance
  }

  return {
    allowUpload: true, // Always allow for R2
    securityLog: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      risks,
      warnings,
      timestamp: new Date().toISOString(),
    },
  };
}

// Helper functions

function matchesSignature(
  bytes: Uint8Array,
  signature: readonly number[],
): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

async function validateTextFile(
  file: File,
  bytes: Uint8Array,
): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Check if content is valid UTF-8
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const sample = await file.slice(0, 1024).arrayBuffer();
    decoder.decode(sample);

    // Check for null bytes (binary content)
    if (bytes.some((byte) => byte === 0)) {
      return {
        isValid: false,
        reason: "Text file contains null bytes (possibly binary content)",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      reason: "Text file contains invalid UTF-8 content",
    };
  }
}

async function validateRIFFContainer(
  file: File,
  expectedType: string,
): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check RIFF signature
    if (!matchesSignature(bytes, [0x52, 0x49, 0x46, 0x46] as const)) {
      return { isValid: false, reason: "Invalid RIFF signature" };
    }

    // Check type at offset 8
    const typeBytes = bytes.slice(8, 12);
    const type = new TextDecoder().decode(typeBytes);

    if (type !== expectedType) {
      return {
        isValid: false,
        reason: `Expected ${expectedType} container, found ${type}`,
      };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: "Error validating RIFF container" };
  }
}

async function validateMP4Container(file: File): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    const buffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for ftyp box at offset 4
    if (!matchesSignature(bytes.slice(4), [0x66, 0x74, 0x79, 0x70] as const)) {
      return { isValid: false, reason: "Invalid MP4 ftyp box" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: "Error validating MP4 container" };
  }
}

/**
 * Get file extension from MIME type for validation
 */
export function getExpectedExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
    "application/zip": "zip",
  };

  return extensions[mimeType] || "bin";
}
