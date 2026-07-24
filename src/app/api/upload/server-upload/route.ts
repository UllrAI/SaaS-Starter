import { NextRequest, NextResponse } from "next/server";
import { Upload } from "@aws-sdk/lib-storage";
import env from "@/env";
import {
  UPLOAD_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  formatFileSize,
  normalizeContentType,
} from "@/lib/config/upload";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkUploadRateLimit } from "@/lib/upload-rate-limit";
import { r2Client } from "@/lib/r2";
import {
  completeUploadIntent,
  createUploadIntent,
  releaseUploadIntent,
  UploadQuotaExceededError,
} from "@/lib/uploads/upload-intents";

const MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

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

class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

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

    const rateLimit = await checkUploadRateLimit(session.user.id, "server");
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

    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader === null) {
      return NextResponse.json(
        { error: "Content-Length header is required." },
        { status: 411 },
      );
    }

    if (!/^\d+$/.test(contentLengthHeader)) {
      return NextResponse.json(
        { error: "Invalid Content-Length header." },
        { status: 400 },
      );
    }

    const declaredLength = Number(contentLengthHeader);
    const maxRequestSize =
      UPLOAD_CONFIG.MAX_SERVER_UPLOAD_TOTAL_SIZE + MULTIPART_OVERHEAD_BYTES;
    if (!Number.isSafeInteger(declaredLength) || declaredLength <= 0) {
      return NextResponse.json(
        { error: "Invalid Content-Length header." },
        { status: 400 },
      );
    }

    if (declaredLength > maxRequestSize) {
      return NextResponse.json(
        { error: "Upload request is too large." },
        { status: 413 },
      );
    }

    // Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.warn("Invalid multipart upload payload:", error);
      return NextResponse.json(
        { error: "Invalid multipart upload payload." },
        { status: 400 },
      );
    }
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
      let intentId: string | null = null;
      let uploadStarted = false;

      try {
        const normalizedContentType = normalizeContentType(file.type);

        // Validate file type
        if (!isFileTypeAllowed(normalizedContentType)) {
          throw new UploadValidationError(
            `File type ${normalizedContentType} is not allowed`,
          );
        }

        // Validate file size
        if (!isFileSizeAllowed(file.size)) {
          throw new UploadValidationError(
            `File size ${file.size} bytes exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`,
          );
        }
        if (file.size > UPLOAD_CONFIG.MAX_SERVER_UPLOAD_FILE_SIZE) {
          throw new UploadValidationError(
            `File size ${file.size} bytes exceeds the server upload limit of ${UPLOAD_CONFIG.MAX_SERVER_UPLOAD_FILE_SIZE} bytes`,
          );
        }

        const intent = await createUploadIntent({
          userId: session.user!.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: normalizedContentType,
        });
        intentId = intent.id;

        // Create file stream from the uploaded file
        const fileStream = file.stream();

        // Use AWS SDK Upload class for streaming upload
        const upload = new Upload({
          client: r2Client,
          params: {
            Bucket: env.R2_BUCKET_NAME,
            Key: intent.fileKey,
            Body: fileStream,
            ContentType: normalizedContentType,
            ContentLength: file.size,
          },
          queueSize: 1,
        });

        // Execute the upload
        uploadStarted = true;
        await upload.done();

        const record = await completeUploadIntent({
          intentId: intent.id,
          userId: session.user!.id,
          key: intent.fileKey,
          contentLength: file.size,
          contentType: normalizedContentType,
        });

        return {
          fileName: file.name,
          url: record.url,
          key: record.fileKey,
          size: file.size,
          contentType: normalizedContentType,
          success: true,
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);

        if (intentId && !uploadStarted) {
          await releaseUploadIntent(intentId, session.user!.id).catch(
            (releaseError) => {
              console.error(
                `Failed to release upload intent ${intentId}:`,
                releaseError,
              );
            },
          );
        } else if (intentId) {
          console.warn(
            `Upload ${intentId} has an uncertain storage or database result; deferred cleanup will reconcile it.`,
          );
        }

        return {
          fileName: file.name,
          success: false,
          error:
            error instanceof UploadValidationError
              ? error.message
              : error instanceof UploadQuotaExceededError
                ? "Upload quota reached."
                : "Upload failed. Please try again.",
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
