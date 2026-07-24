import { NextRequest, NextResponse } from "next/server";
import { createPresignedUrl } from "@/lib/r2";
import {
  isFileTypeAllowed,
  isFileSizeAllowed,
  UPLOAD_CONFIG,
  formatFileSize,
  presignedUrlRequestSchema,
  normalizeContentType,
} from "@/lib/config/upload";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkUploadRateLimit } from "@/lib/upload-rate-limit";
import {
  createUploadIntent,
  releaseUploadIntent,
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

    const rateLimit = await checkUploadRateLimit(session.user.id, "presign");
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
    const validation = presignedUrlRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fileName, size } = validation.data;
    const contentType = normalizeContentType(validation.data.contentType);

    if (!isFileTypeAllowed(contentType)) {
      return NextResponse.json(
        { error: `File type '${contentType}' is not allowed.` },
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

    const intent = await createUploadIntent({
      userId: session.user.id,
      fileName,
      fileSize: size,
      contentType,
    });
    const result = await createPresignedUrl({
      key: intent.fileKey,
      contentType,
      size,
    });

    if (!result.success) {
      await releaseUploadIntent(intent.id, session.user.id);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      intentId: intent.id,
      protocolVersion: 2,
      requiredHeaders: {
        "Content-Type": contentType,
        "If-None-Match": "*",
      },
      presignedUrl: result.presignedUrl,
      publicUrl: result.publicUrl,
      key: result.key,
    });
  } catch (error) {
    if (error instanceof UploadQuotaExceededError) {
      return NextResponse.json(
        {
          code: "UPLOAD_QUOTA_EXCEEDED",
          error:
            error.quota === "daily"
              ? "Daily upload quota reached."
              : "Total upload storage quota reached.",
        },
        { status: 403 },
      );
    }
    console.error("Error creating presigned URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 },
    );
  }
}
