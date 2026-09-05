import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { uploads } from "@/database/schema";
import type { DeleteObject } from "./repository";

export async function requestFileDeletion(
  db: AppDatabase,
  ids: string[],
  actor: { id: string; role: string },
) {
  const admin = actor.role === "admin" || actor.role === "super_admin";
  return db
    .update(uploads)
    .set({ deletedAt: new Date() })
    .where(
      and(
        inArray(uploads.id, ids),
        admin ? undefined : eq(uploads.userId, actor.id),
        isNull(uploads.deletedAt),
      ),
    )
    .returning({ id: uploads.id });
}

export async function cleanupDeletedFiles(
  db: AppDatabase,
  deleteObject: DeleteObject,
) {
  const files = await db
    .select()
    .from(uploads)
    .where(isNotNull(uploads.deletedAt))
    .orderBy(uploads.deletedAt)
    .limit(100);
  for (const file of files) {
    const result = await deleteObject(file.fileKey);
    if (result.success)
      await db
        .delete(uploads)
        .where(and(eq(uploads.id, file.id), isNotNull(uploads.deletedAt)));
  }
}
