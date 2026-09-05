import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { buildFileUrl } from "./uploads/url";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getUploadConfig } from "@/lib/config/integrations";
import {
  UPLOAD_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  normalizeContentType,
} from "./config/upload";

let r2Client: S3Client | undefined;

export function getR2Client(): S3Client {
  if (!r2Client) {
    const config = getUploadConfig();
    r2Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return r2Client;
}

interface CreatePresignedUrlParams {
  key: string;
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
  key,
  contentType,
  size,
}: CreatePresignedUrlParams): Promise<CreatePresignedUrlResult> {
  try {
    const config = getUploadConfig();
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

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      IfNoneMatch: "*",
    });

    const presignedUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION,
    });

    // Generate public URL
    const publicUrl = buildFileUrl(key);

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

export async function getObjectMetadata(
  key: string,
): Promise<R2ObjectMetadata | null> {
  try {
    const config = getUploadConfig();
    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const result = await getR2Client().send(command);
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
    const config = getUploadConfig();
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await getR2Client().send(command);

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
    const config = getUploadConfig();
    const command = new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    });
    const result = await getR2Client().send(command);
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

export async function getFileReadUrl(
  key: string,
  download = false,
): Promise<string> {
  const config = getUploadConfig();
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ...(download ? { ResponseContentDisposition: "attachment" } : {}),
    }),
    { expiresIn: 300 },
  );
}
