import { NextRequest, NextResponse } from "next/server";
import {
  formatFileSize,
  isFileSizeAllowed,
  isFileTypeAllowed,
  normalizeContentType,
  UPLOAD_CONFIG,
  uploadCompleteRequestSchema,
} from "@/lib/config/upload";
import { getObjectMetadata } from "@/lib/r2";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkUploadRateLimit } from "@/lib/upload-rate-limit";
import {
  completeLegacyUpload,
  completeUploadIntent,
  UploadIntentUnavailableError,
  UploadMetadataMismatchError,
  UploadQuotaExceededError,
} from "@/lib/uploads/upload-intents";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkUploadRateLimit(session.user.id, "complete");
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

    let body: unknown;
    try {
      body = await readJsonBodyWithLimit(
        request,
        UPLOAD_CONFIG.MAX_JSON_BODY_SIZE,
      );
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json(
          { error: "Upload request is too large." },
          { status: 413 },
        );
      }
      body = null;
    }
    const validation = uploadCompleteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { intentId, fileName, key, size, url } = validation.data;
    const declaredContentType = normalizeContentType(
      validation.data.contentType,
    );

    if (!isFileTypeAllowed(declaredContentType)) {
      return NextResponse.json(
        { error: `File type '${declaredContentType}' is not allowed.` },
        { status: 400 },
      );
    }
    if (!isFileSizeAllowed(size)) {
      return NextResponse.json(
        {
          error: `File size of ${formatFileSize(size)} exceeds the limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`,
        },
        { status: 400 },
      );
    }

    if (!key.startsWith(`uploads/${session.user.id}/`)) {
      return NextResponse.json(
        { error: "Upload key does not belong to the current user." },
        { status: 403 },
      );
    }

    const metadata = await getObjectMetadata(key);
    if (!metadata) {
      return NextResponse.json(
        { error: "Uploaded object could not be verified." },
        { status: 409 },
      );
    }

    const contentType = normalizeContentType(metadata.contentType);
    if (!isFileTypeAllowed(contentType)) {
      return NextResponse.json(
        { error: `File type '${contentType}' is not allowed.` },
        { status: 400 },
      );
    }

    if (!isFileSizeAllowed(metadata.contentLength)) {
      return NextResponse.json(
        {
          error: `File size of ${formatFileSize(metadata.contentLength)} exceeds the limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`,
        },
        { status: 400 },
      );
    }

    const completionInput = {
      userId: session.user.id,
      key,
      contentLength: metadata.contentLength,
      contentType,
      declaration: {
        fileName,
        fileSize: size,
        contentType: declaredContentType,
        url,
      },
    };
    let upload;
    try {
      upload = await completeUploadIntent({ intentId, ...completionInput });
    } catch (error) {
      if (!(error instanceof UploadIntentUnavailableError) || intentId) {
        throw error;
      }
      upload = await completeLegacyUpload(completionInput);
      if (!upload) {
        throw error;
      }
    }

    return NextResponse.json({
      file: {
        key: upload.fileKey,
        url: upload.url,
        fileName: upload.fileName,
        size: upload.fileSize,
        contentType: upload.contentType,
      },
    });
  } catch (error) {
    if (error instanceof UploadIntentUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof UploadMetadataMismatchError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UploadQuotaExceededError) {
      return NextResponse.json(
        {
          code: "UPLOAD_QUOTA_EXCEEDED",
          error: error.message,
        },
        { status: 403 },
      );
    }
    console.error("Error completing upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 },
    );
  }
}
