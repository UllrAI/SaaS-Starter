// lib/config/upload.ts

import { z } from "zod";

/**
 * 将 MIME 类型映射到文件扩展名。
 * 这是文件扩展名的主要来源。
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
  "application/json": "json", // Note: text/json is obsolete
  "application/xml": "xml", // Note: text/xml is also used
  "text/xml": "xml",
  "text/calendar": "ics",

  // Archives
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
} as const; // 使用 as const 确保类型安全

/**
 * 全局文件上传配置。
 * 这是整个应用中文件上传规则的单一事实来源。
 */
export const UPLOAD_CONFIG = {
  /**
   * 允许的最大文件大小（字节）。
   * @default 50MB
   */
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  /**
   * 允许的最大文件大小（MB），用于在UI中显示。
   */
  MAX_FILE_SIZE_MB: 50,

  /**
   * 预签名 URL 的过期时间（秒）。
   * @default 15 minutes
   */
  PRESIGNED_URL_EXPIRATION: 15 * 60,

  /**
   * 允许上传的 MIME 类型数组。
   * **自动从 MIME_TYPE_TO_EXTENSION 生成，确保一致性。**
   */
  ALLOWED_FILE_TYPES: Object.keys(
    MIME_TYPE_TO_EXTENSION,
  ) as (keyof typeof MIME_TYPE_TO_EXTENSION)[],

  /**
   * 允许上传目标的协议列表。
   * 默认仅允许 HTTPS。
   */
  ALLOWED_UPLOAD_URL_PROTOCOLS: ["https:"] as string[],

  /**
   * 允许上传目标的主机名（精确匹配）。
   * 如使用自定义域名，请将其添加到此列表。
   */
  ALLOWED_UPLOAD_HOSTS: [] as string[],

  /**
   * 允许上传目标的主机名后缀匹配（用于供应商域名）。
   */
  ALLOWED_UPLOAD_HOST_SUFFIXES: [".r2.cloudflarestorage.com"] as string[],
} as const;

/**
 * 检查文件类型是否在允许列表中。
 * @param contentType - 文件的 MIME 类型。
 * @returns 如果允许则为 `true`，否则为 `false`。
 */
export function isFileTypeAllowed(contentType: string): boolean {
  return UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(
    contentType as (typeof UPLOAD_CONFIG.ALLOWED_FILE_TYPES)[number],
  );
}

/**
 * 检查文件大小是否在限制范围内。
 * @param size - 文件的字节大小。
 * @returns 如果在限制内则为 `true`，否则为 `false`。
 */
export function isFileSizeAllowed(size: number): boolean {
  return size <= UPLOAD_CONFIG.MAX_FILE_SIZE;
}

/**
 * 格式化文件大小以便于阅读。
 * @param bytes - 文件的字节大小。
 * @returns 格式化后的字符串 (例如, "1.23 MB")。
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 从 MIME 类型获取文件扩展名。
 * @param contentType - 文件的 MIME 类型。
 * @returns 对应的文件扩展名，如果找不到则默认为 "bin"。
 */
export function getFileExtension(contentType: string): string {
  if (contentType in MIME_TYPE_TO_EXTENSION) {
    return MIME_TYPE_TO_EXTENSION[
      contentType as keyof typeof MIME_TYPE_TO_EXTENSION
    ];
  }

  // Fallback for types like 'application/vnd.some-custom-format'
  const parts = contentType.split("/");
  const subtype = parts[1];
  if (subtype && !subtype.includes("*")) {
    const ext = subtype.split("+")[0];
    return ext.toLowerCase();
  }

  return "bin"; // Default fallback
}

// 用于验证预签名 URL 请求体的 Zod schema
export const presignedUrlRequestSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name cannot be empty.")
    .max(255, "File name is too long."),
  contentType: z.string().min(1, "Content type cannot be empty."),
  size: z.number().positive("File size must be positive."),
});
