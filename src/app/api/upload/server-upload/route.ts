import { NextRequest, NextResponse } from "next/server";
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
  formatFileSize,
  normalizeContentType,
} from "@/lib/config/upload";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkUploadRateLimit } from "@/lib/upload-rate-limit";

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

type ServerUploadResult =
  | {
      fileName: string;
      url: string;
      key: string;
      size: number;
      contentType: string;
      success: true;
    }
  | {
      fileName: string;
      success: false;
      error: string;
    };

function isUploadFile(entry: FormDataEntryValue): entry is File {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "name" in entry &&
    "type" in entry &&
    "size" in entry &&
    "stream" in entry
  );
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.all(batch.map(task))));
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkUploadRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        },
      );
    }

    // Check if request is multipart/form-data
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error: "Invalid content type. Expected multipart/form-data",
          received: contentType || "none",
        },
        { status: 400 },
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const fileEntries = formData.getAll("files");
    const files = fileEntries.filter(isUploadFile);

    if (fileEntries.length !== files.length) {
      return NextResponse.json(
        { error: "Invalid file entry in upload payload" },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > UPLOAD_CONFIG.MAX_SERVER_UPLOAD_FILES) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${UPLOAD_CONFIG.MAX_SERVER_UPLOAD_FILES} files are allowed per request.`,
        },
        { status: 400 },
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (
      !Number.isFinite(totalSize) ||
      totalSize > UPLOAD_CONFIG.MAX_SERVER_UPLOAD_TOTAL_SIZE
    ) {
      return NextResponse.json(
        {
          error: `Total upload size of ${formatFileSize(totalSize)} exceeds the per-request limit of ${formatFileSize(UPLOAD_CONFIG.MAX_SERVER_UPLOAD_TOTAL_SIZE)}.`,
        },
        { status: 400 },
      );
    }

    // Function to process a single file
    const processFile = async (file: File): Promise<ServerUploadResult> => {
      try {
        const normalizedContentType = normalizeContentType(file.type);

        // Validate file type
        if (!isFileTypeAllowed(normalizedContentType)) {
          throw new Error(`File type ${normalizedContentType} is not allowed`);
        }

        // Validate file size
        if (!isFileSizeAllowed(file.size)) {
          throw new Error(
            `File size ${file.size} bytes exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`,
          );
        }

        // Generate unique key for the file
        const fileExtension = getFileExtension(normalizedContentType);
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
            ContentType: normalizedContentType,
            ContentLength: file.size,
          },
          queueSize: 1,
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
          contentType: normalizedContentType,
        });

        return {
          fileName: file.name,
          url: publicUrl,
          key: key,
          size: file.size,
          contentType: normalizedContentType,
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

    const uploadResults = await processInBatches(
      files,
      UPLOAD_CONFIG.SERVER_UPLOAD_CONCURRENCY,
      processFile,
    );

    const successCount = uploadResults.filter((r) => r.success).length;
    const failureCount = uploadResults.length - successCount;

    return NextResponse.json({
      message: `Uploaded ${successCount} file(s) successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      results: uploadResults,
      summary: {
        total: uploadResults.length,
        success: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("Error in server upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
