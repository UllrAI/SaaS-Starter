import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { randomUUID } from "crypto";
import env from "@/env";
import {
  UPLOAD_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  getFileExtension,
} from "@/lib/config/upload";
import { rateLimiters } from "@/lib/rate-limit";
import { validateFileForR2 } from "@/lib/file-security";
import {
  createRateLimitError,
  createAuthError,
  createApiError,
  handleApiError,
  addRateLimitHeaders,
  API_ERROR_CODES,
  type ErrorLogContext,
} from "@/lib/api-error-handler";

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiters.fileUpload(request);
    if (!rateLimitResult.success) {
      return createRateLimitError(
        rateLimitResult,
        "Too many file upload requests, please try again later.",
      );
    }

    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return createAuthError();
    }

    // Check if request is multipart/form-data
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return createApiError(
        API_ERROR_CODES.INVALID_REQUEST,
        "Invalid content type. Expected multipart/form-data",
        400,
        { received: contentType || "none" },
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return createApiError(
        API_ERROR_CODES.INVALID_REQUEST,
        "No files provided",
        400,
      );
    }

    // Function to process a single file
    const processFile = async (file: File) => {
      try {
        // Validate file type
        if (!isFileTypeAllowed(file.type)) {
          throw new Error(`File type ${file.type} is not allowed`);
        }

        // Validate file size
        if (!isFileSizeAllowed(file.size)) {
          throw new Error(
            `File size ${file.size} bytes exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`,
          );
        }

        // Lightweight security validation for R2 hosting
        const securityCheck = await validateFileForR2(file);
        if (!securityCheck.allowUpload) {
          throw new Error(
            `File upload blocked: ${securityCheck.securityLog.risks.join(", ")}`,
          );
        }

        // Log security findings for monitoring (non-blocking)
        if (
          securityCheck.securityLog.risks.length > 0 ||
          securityCheck.securityLog.warnings.length > 0
        ) {
          console.warn(`File security log for ${file.name}:`, {
            risks: securityCheck.securityLog.risks,
            warnings: securityCheck.securityLog.warnings,
            fileInfo: {
              size: file.size,
              type: file.type,
              name: file.name,
            },
            timestamp: securityCheck.securityLog.timestamp,
          });
        }

        // Generate unique key for the file
        const fileExtension = getFileExtension(file.type);
        const timestamp = Date.now();
        const uuid = randomUUID();
        const key = `uploads/${session.user!.id}/${timestamp}-${uuid}.${fileExtension}`;

        // Create file stream from the uploaded file
        const fileStream = file.stream();

        // Use AWS SDK Upload class for streaming upload
        const upload = new Upload({
          client: r2Client,
          params: {
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: file.type,
            ContentLength: file.size,
          },
        });

        // Execute the upload
        await upload.done();

        // Generate public URL
        const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

        // Store upload record in database
        await db.insert(uploads).values({
          userId: session.user!.id,
          fileKey: key,
          url: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        });

        return {
          fileName: file.name,
          url: publicUrl,
          key: key,
          size: file.size,
          contentType: file.type,
          success: true,
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        return {
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    };

    // Process all files in parallel
    const uploadPromises = files.map(processFile);
    const uploadResults = await Promise.all(uploadPromises);

    const successCount = uploadResults.filter((r) => r.success).length;
    const failureCount = uploadResults.length - successCount;

    const response = NextResponse.json({
      message: `Uploaded ${successCount} file(s) successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      results: uploadResults,
      summary: {
        total: uploadResults.length,
        success: successCount,
        failed: failureCount,
      },
    });

    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    const context: ErrorLogContext = {
      endpoint: "/api/upload/server-upload",
      method: "POST",
      userId: undefined, // session might not be available in catch block
      error,
    };

    return handleApiError(error, context);
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": env.NEXT_PUBLIC_APP_URL,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
