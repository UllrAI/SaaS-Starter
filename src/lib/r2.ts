import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
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
  normalizeContentType,
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
    const publicUrl = buildR2PublicUrl(key);

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

export interface R2ObjectMetadata {
  contentLength: number;
  contentType: string;
}

export function buildR2PublicUrl(
  key: string,
  baseUrl = env.R2_PUBLIC_URL,
): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

export async function getObjectMetadata(
  key: string,
): Promise<R2ObjectMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    const result = await r2Client.send(command);
    const contentLength = result.ContentLength;
    const contentType = normalizeContentType(result.ContentType || "");

    if (typeof contentLength !== "number" || !contentType) {
      return null;
    }

    return {
      contentLength,
      contentType,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      ("$metadata" in error || "name" in error)
    ) {
      const maybeStatus = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      const maybeName = (error as { name?: string }).name;

      if (maybeStatus === 404 || maybeName === "NotFound") {
        return null;
      }
    }

    console.error("Error reading object metadata:", error);
    throw error;
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
        Quiet: false,
      },
    });
    const result = await r2Client.send(command);
    if (result.Errors?.length) {
      const failedKeys = result.Errors.map(
        (item) => item.Key ?? "unknown key",
      ).join(", ");
      return {
        success: false,
        error: `Failed to delete ${result.Errors.length} object(s): ${failedKeys}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting files in batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete files",
    };
  }
}
