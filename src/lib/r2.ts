import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { lookup } from "dns/promises";
import { isIP } from "net";
import env from "@/env";
import {
  UPLOAD_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  getFileExtension,
} from "./config/upload";
import { randomUUID } from "crypto";

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// Export the client for reuse in other modules
export { r2Client };

interface CreatePresignedUrlParams {
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
}

interface CreatePresignedUrlResult {
  success: boolean;
  presignedUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: string;
}

/**
 * Create a presigned URL for direct client upload to R2
 */
export async function createPresignedUrl({
  userId,
  contentType,
  size,
}: CreatePresignedUrlParams): Promise<CreatePresignedUrlResult> {
  try {
    // Validate file type
    if (!isFileTypeAllowed(contentType)) {
      return {
        success: false,
        error: `File type ${contentType} is not allowed`,
      };
    }

    // Validate file size
    if (!isFileSizeAllowed(size)) {
      return {
        success: false,
        error: `File size ${size} bytes exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`,
      };
    }

    // Generate unique key for the file (without original filename for security)
    const fileExtension = getFileExtension(contentType);
    const timestamp = Date.now();
    const uuid = randomUUID();
    const key = `uploads/${userId}/${timestamp}-${uuid}.${fileExtension}`;

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION,
    });

    // Generate public URL
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return {
      success: true,
      presignedUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    return {
      success: false,
      error: "Failed to create presigned URL",
    };
  }
}

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

const BLOCKED_URL_ERROR = "Blocked URL host";

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0x00ffffff], // 0.0.0.0/8
  [0x0a000000, 0x0affffff], // 10.0.0.0/8
  [0x64400000, 0x647fffff], // 100.64.0.0/10
  [0x7f000000, 0x7fffffff], // 127.0.0.0/8
  [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16
  [0xac100000, 0xac1fffff], // 172.16.0.0/12
  [0xc0000000, 0xc00000ff], // 192.0.0.0/24
  [0xc0000200, 0xc00002ff], // 192.0.2.0/24
  [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16
  [0xc6120000, 0xc613ffff], // 198.18.0.0/15
  [0xc6336400, 0xc63364ff], // 198.51.100.0/24
  [0xcb007100, 0xcb0071ff], // 203.0.113.0/24
  [0xe0000000, 0xefffffff], // 224.0.0.0/4
  [0xf0000000, 0xffffffff], // 240.0.0.0/4
];

const isPrivateIpv4 = (ip: string): boolean => {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part)))
    return true;
  const value = parts.reduce((acc, part) => acc * 256 + part, 0);
  return PRIVATE_IPV4_RANGES.some(
    ([start, end]) => value >= start && value <= end,
  );
};

const isPrivateIpv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("ff")) return true;
  if (normalized.startsWith("2001:db8")) return true;
  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.replace("::ffff:", "");
    if (v4Part.includes(".")) {
      return isPrivateIpv4(v4Part);
    }
  }
  return false;
};

const isPrivateIpAddress = (ip: string): boolean => {
  const ipVersion = isIP(ip);
  if (ipVersion === 4) return isPrivateIpv4(ip);
  if (ipVersion === 6) return isPrivateIpv6(ip);
  return true;
};

const assertSafeRemoteUrl = async (url: string): Promise<URL> => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Unsupported URL protocol");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error(BLOCKED_URL_ERROR);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error(BLOCKED_URL_ERROR);
  }

  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error(BLOCKED_URL_ERROR);
    }
    return parsedUrl;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true });
  } catch {
    throw new Error(BLOCKED_URL_ERROR);
  }
  if (!records.length) {
    throw new Error(BLOCKED_URL_ERROR);
  }

  for (const record of records) {
    if (isPrivateIpAddress(record.address)) {
      throw new Error(BLOCKED_URL_ERROR);
    }
  }

  return parsedUrl;
};

/**
 * Upload a file from URL to R2 (server-side)
 */
export async function uploadFromUrl(
  url: string,
  key: string,
  contentType?: string,
): Promise<UploadResult> {
  try {
    const parsedUrl = await assertSafeRemoteUrl(url);

    // Fetch the file from URL
    const response = await fetch(parsedUrl.toString(), { redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      throw new Error("Redirects are not allowed when fetching remote files.");
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const detectedContentType =
      contentType ||
      response.headers.get("content-type") ||
      "application/octet-stream";

    return await uploadBuffer(Buffer.from(buffer), key, detectedContentType);
  } catch (error) {
    console.error("Error uploading from URL:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload from URL",
    };
  }
}

/**
 * Upload a buffer to R2 (server-side)
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!isFileTypeAllowed(contentType)) {
      return {
        success: false,
        error: `File type ${contentType} is not allowed`,
      };
    }

    // Validate file size
    if (!isFileSizeAllowed(buffer.length)) {
      return {
        success: false,
        error: `File size ${buffer.length} bytes exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`,
      };
    }

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error("Error uploading buffer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload buffer",
    };
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(
  key: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      // 使用 DeleteObjectCommand
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

/**
 * Delete multiple files from R2
 */
export async function deleteFiles(
  keys: string[],
): Promise<{ success: boolean; error?: string }> {
  if (keys.length === 0) {
    return { success: true };
  }
  try {
    const command = new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false, // 设置为 false 以在响应中获取已删除对象的信息
      },
    });
    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting files in batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete files",
    };
  }
}

/**
 * Get a presigned URL for downloading a file (optional, for private files)
 */
export async function getDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error("Error creating download URL:", error);
    return null;
  }
}
