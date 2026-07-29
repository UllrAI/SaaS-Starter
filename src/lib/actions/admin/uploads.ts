"use server";

import { revalidatePath } from "next/cache";
import {
  SQLWrapper,
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  like,
  not,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database";
import { uploads, users } from "@/database/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { SITE_CONFIG } from "@/lib/config/site";
import { IntegrationDisabledError } from "@/lib/config/integrations";
import {
  deleteFile as deleteFileFromR2,
  deleteFiles as deleteFilesFromR2,
} from "@/lib/r2";

import { adminAction } from "./shared";

interface GetUploadsParams {
  page?: number;
  limit?: number;
  search?: string;
  fileType?: string;
}

export async function getUploads({
  page = 1,
  limit = 20,
  search = "",
  fileType = "all",
}: GetUploadsParams) {
  assertUploadsEnabled();
  await requireAdmin();

  const conditions: (SQLWrapper | undefined)[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(uploads.fileName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
      ),
    );
  }
  if (fileType !== "all") {
    const typeConditions: Record<string, SQLWrapper> = {
      image: like(uploads.contentType, "image/%"),
      video: like(uploads.contentType, "video/%"),
      audio: like(uploads.contentType, "audio/%"),
      pdf: eq(uploads.contentType, "application/pdf"),
      text: like(uploads.contentType, "text/%"),
      archive: or(
        like(uploads.contentType, "%zip%"),
        like(uploads.contentType, "%rar%"),
        like(uploads.contentType, "%tar%"),
        like(uploads.contentType, "%7z%"),
      )!,
    };

    if (fileType in typeConditions) {
      conditions.push(typeConditions[fileType]);
    } else if (fileType === "other") {
      conditions.push(
        and(
          ...Object.values(typeConditions).map((condition) => not(condition)),
        ),
      );
    }
  }

  const where =
    conditions.length > 0
      ? and(...(conditions.filter(Boolean) as SQLWrapper[]))
      : undefined;
  const offset = (page - 1) * limit;
  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: uploads.id,
        userId: uploads.userId,
        fileKey: uploads.fileKey,
        url: uploads.url,
        fileName: uploads.fileName,
        fileSize: uploads.fileSize,
        contentType: uploads.contentType,
        createdAt: uploads.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(uploads)
      .innerJoin(users, eq(uploads.userId, users.id))
      .where(where)
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(uploads)
      .innerJoin(users, eq(uploads.userId, users.id))
      .where(where),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function assertUploadsEnabled() {
  if (!SITE_CONFIG.features.uploads) {
    throw new IntegrationDisabledError("uploads");
  }
}

const deleteUploadSchema = z.object({ uploadId: z.string() });

export const deleteUploadAction = adminAction
  .schema(deleteUploadSchema)
  .action(async ({ parsedInput: { uploadId } }) => {
    assertUploadsEnabled();
    const [upload] = await db
      .select({ fileKey: uploads.fileKey })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (!upload) throw new Error("Upload not found");
    const deleteResult = await deleteFileFromR2(upload.fileKey);
    if (!deleteResult.success) {
      throw new Error(deleteResult.error || "Failed to delete file from R2.");
    }

    await db.delete(uploads).where(eq(uploads.id, uploadId));
    revalidatePath("/dashboard/admin/uploads");
    return { success: true, message: "Upload deleted successfully." };
  });

const batchDeleteUploadsSchema = z.object({
  uploadIds: z.array(z.string()).min(1),
});

export const batchDeleteUploadsAction = adminAction
  .schema(batchDeleteUploadsSchema)
  .action(async ({ parsedInput: { uploadIds } }) => {
    assertUploadsEnabled();
    const records = await db
      .select({ id: uploads.id, fileKey: uploads.fileKey })
      .from(uploads)
      .where(inArray(uploads.id, uploadIds));

    if (records.length === 0) throw new Error("No uploads found to delete.");

    const deleteResult = await deleteFilesFromR2(
      records.map((record) => record.fileKey),
    );
    if (!deleteResult.success) {
      throw new Error(deleteResult.error || "Failed to delete files from R2.");
    }

    await db.delete(uploads).where(inArray(uploads.id, uploadIds));
    revalidatePath("/dashboard/admin/uploads");
    return {
      success: true,
      message: `Successfully deleted ${records.length} file(s).`,
    };
  });
