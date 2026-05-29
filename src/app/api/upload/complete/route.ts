import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import env from "@/env";
import { and, eq } from "drizzle-orm";
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

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
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

    const { fileName, key, size, url } = validation.data;
    const contentType = normalizeContentType(validation.data.contentType);
    const keyPrefix = `uploads/${session.user.id}/`;
    const expectedUrl = `${env.R2_PUBLIC_URL}/${key}`;

    if (!key.startsWith(keyPrefix)) {
      return NextResponse.json(
        { error: "Upload key does not belong to the current user." },
        { status: 403 },
      );
    }

    if (url !== expectedUrl) {
      return NextResponse.json(
        { error: "Upload URL does not match the stored object key." },
        { status: 400 },
      );
    }

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

    const metadata = await getObjectMetadata(key);
    if (!metadata) {
      return NextResponse.json(
        { error: "Uploaded object could not be verified." },
        { status: 409 },
      );
    }

    if (metadata.contentLength !== size) {
      return NextResponse.json(
        { error: "Uploaded object size does not match the declared size." },
        { status: 400 },
      );
    }

    if (metadata.contentType !== contentType) {
      return NextResponse.json(
        {
          error:
            "Uploaded object content type does not match the declared content type.",
        },
        { status: 400 },
      );
    }

    if (!isFileTypeAllowed(metadata.contentType)) {
      return NextResponse.json(
        { error: `File type '${metadata.contentType}' is not allowed.` },
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

    const existingUpload = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, session.user.id), eq(uploads.fileKey, key)))
      .limit(1);

    if (existingUpload[0]) {
      return NextResponse.json({
        file: {
          key: existingUpload[0].fileKey,
          url: existingUpload[0].url,
          fileName: existingUpload[0].fileName,
          size: existingUpload[0].fileSize,
          contentType: existingUpload[0].contentType,
        },
      });
    }

    await db.insert(uploads).values({
      userId: session.user.id,
      fileKey: key,
      url: expectedUrl,
      fileName,
      fileSize: metadata.contentLength,
      contentType: metadata.contentType,
    });

    return NextResponse.json({
      file: {
        key,
        url: expectedUrl,
        fileName,
        size: metadata.contentLength,
        contentType: metadata.contentType,
      },
    });
  } catch (error) {
    console.error("Error completing upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 },
    );
  }
}
