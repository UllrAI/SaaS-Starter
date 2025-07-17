import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

/**
 * Upload a file from URL to R2 (server-side)
 */
export async function uploadFromUrl(
  url: string,
  key: string,
  contentType?: string,
): Promise<UploadResult> {
  try {
    // Fetch the file from URL
    const response = await fetch(url);
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
