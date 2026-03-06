import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import env from "@/env";
import { and, eq } from "drizzle-orm";
import {
  formatFileSize,
  isFileSizeAllowed,
  isFileTypeAllowed,
  UPLOAD_CONFIG,
  uploadCompleteRequestSchema,
} from "@/lib/config/upload";
import { fileExists } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { contentType, fileName, key, size, url } = validation.data;
    const keyPrefix = `uploads/${session.user.id}/`;
    const expectedUrlPrefix = `${env.R2_PUBLIC_URL}/`;

    if (!key.startsWith(keyPrefix)) {
      return NextResponse.json(
        { error: "Upload key does not belong to the current user." },
        { status: 403 },
      );
    }

    if (!url.startsWith(expectedUrlPrefix) || !url.endsWith(key)) {
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

    const exists = await fileExists(key);
    if (!exists) {
      return NextResponse.json(
        { error: "Uploaded object could not be verified." },
        { status: 409 },
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
      url,
      fileName,
      fileSize: size,
      contentType,
    });

    return NextResponse.json({
      file: {
        key,
        url,
        fileName,
        size,
        contentType,
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
