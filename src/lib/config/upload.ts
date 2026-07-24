// lib/config/upload.ts

import { z } from "zod";

/**
 * Maps MIME types to file extensions.
 * This is the primary source for upload file extensions.
 */
const MIME_TYPE_TO_EXTENSION = {
  // Images
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/apng": "apng",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/tiff": "tiff",
  "image/vnd.microsoft.icon": "ico",

  // Documents
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",

  // Audio and video files
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/opus": "opus",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/x-matroska": "mkv",
  "video/x-flv": "flv",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-ms-wmv": "wmv",

  // Text files
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "text/html": "html",
  "text/css": "css",
  "text/javascript": "js",
  "application/javascript": "js",
  "application/ecmascript": "js",
  "text/ecmascript": "js",
  "application/json": "json", // Note: text/json is obsolete
  "application/xml": "xml", // Note: text/xml is also used
  "text/xml": "xml",
  "application/xhtml+xml": "xhtml",
  "text/calendar": "ics",

  // Archives
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
} as const;

export const BLOCKED_ACTIVE_CONTENT_TYPES = [
  "image/svg+xml",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/ecmascript",
  "text/ecmascript",
  "application/xhtml+xml",
  "application/xml",
  "text/xml",
] as const;

const BLOCKED_ACTIVE_CONTENT_TYPE_SET = new Set<string>(
  BLOCKED_ACTIVE_CONTENT_TYPES,
);

/**
 * Global upload policy for the application.
 */
export const UPLOAD_CONFIG = {
  /**
   * Maximum allowed single-file size in bytes.
   * @default 50MB
   */
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  /**
   * Maximum allowed single-file size in MB for UI display.
   */
  MAX_FILE_SIZE_MB: 50,

  /**
   * Maximum files accepted by server-upload in one request.
   */
  MAX_SERVER_UPLOAD_FILES: 5,

  /**
   * Maximum aggregate size accepted by server-upload in one request.
   */
  MAX_SERVER_UPLOAD_TOTAL_SIZE: 20 * 1024 * 1024,

  /**
   * Maximum single-file size accepted by the buffered server-upload route.
   */
  MAX_SERVER_UPLOAD_FILE_SIZE: 10 * 1024 * 1024,

  /**
   * Maximum concurrent R2 uploads performed by server-upload.
   */
  SERVER_UPLOAD_CONCURRENCY: 2,

  /**
   * Lightweight per-user rate limit window for upload endpoints.
   */
  USER_UPLOAD_RATE_LIMIT_WINDOW_MS: 60 * 1000,

  /**
   * Maximum upload endpoint requests allowed per user in one window.
   */
  USER_UPLOAD_RATE_LIMIT_MAX_REQUESTS: 30,

  /**
   * Presigned URL expiration in seconds.
   * @default 15 minutes
   */
  PRESIGNED_URL_EXPIRATION: 15 * 60,

  /**
   * Upload intent lifetime. The 24-hour window safely covers a PUT that starts
   * immediately before its signed URL expires and continues in flight.
   */
  UPLOAD_INTENT_EXPIRATION: 24 * 60 * 60,

  /**
   * Maximum JSON request size for upload coordination endpoints.
   */
  MAX_JSON_BODY_SIZE: 4 * 1024,

  /**
   * MIME types allowed for public uploads.
   */
  ALLOWED_FILE_TYPES: Object.keys(MIME_TYPE_TO_EXTENSION).filter(
    (contentType) => !BLOCKED_ACTIVE_CONTENT_TYPE_SET.has(contentType),
  ) as (keyof typeof MIME_TYPE_TO_EXTENSION)[],

  /**
   * Allowed upload target protocols.
   */
  ALLOWED_UPLOAD_URL_PROTOCOLS: ["https:"] as string[],

  /**
   * Exact allowed upload target hostnames.
   */
  ALLOWED_UPLOAD_HOSTS: [] as string[],

  /**
   * Allowed upload target hostname suffixes for provider domains.
   */
  ALLOWED_UPLOAD_HOST_SUFFIXES: [".r2.cloudflarestorage.com"] as string[],
} as const;

export function normalizeContentType(contentType: string): string {
  if (typeof contentType !== "string") {
    return "";
  }

  return contentType.split(";")[0]?.trim().toLowerCase() || "";
}

/**
 * Checks whether a MIME type is allowed for upload.
 */
export function isFileTypeAllowed(contentType: string): boolean {
  const normalizedContentType = normalizeContentType(contentType);

  return UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(
    normalizedContentType as (typeof UPLOAD_CONFIG.ALLOWED_FILE_TYPES)[number],
  );
}

/**
 * Checks whether a file size is positive and within the limit.
 */
export function isFileSizeAllowed(size: number): boolean {
  return (
    Number.isFinite(size) && size > 0 && size <= UPLOAD_CONFIG.MAX_FILE_SIZE
  );
}

/**
 * Formats a byte size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Gets a file extension from a MIME type.
 */
export function getFileExtension(contentType: string): string {
  const normalizedContentType = normalizeContentType(contentType);

  if (normalizedContentType in MIME_TYPE_TO_EXTENSION) {
    return MIME_TYPE_TO_EXTENSION[
      normalizedContentType as keyof typeof MIME_TYPE_TO_EXTENSION
    ];
  }

  // Fallback for types like 'application/vnd.some-custom-format'
  const parts = normalizedContentType.split("/");
  const subtype = parts[1];
  if (subtype && !subtype.includes("*")) {
    const ext = subtype.split("+")[0];
    return ext.toLowerCase();
  }

  return "bin"; // Default fallback
}

export const presignedUrlRequestSchema = z.object({
  protocolVersion: z.literal(2),
  fileName: z
    .string()
    .min(1, "File name cannot be empty.")
    .max(255, "File name is too long."),
  contentType: z.string().min(1, "Content type cannot be empty."),
  size: z.number().positive("File size must be positive."),
});

export const uploadCompleteRequestSchema = z.object({
  intentId: z.uuid("Upload intent ID must be valid.").optional(),
  fileName: z
    .string()
    .min(1, "File name cannot be empty.")
    .max(255, "File name is too long."),
  contentType: z.string().min(1, "Content type cannot be empty."),
  size: z.number().positive("File size must be positive."),
  key: z.string().min(1, "Upload key cannot be empty."),
  url: z.url("Upload URL must be valid."),
});
