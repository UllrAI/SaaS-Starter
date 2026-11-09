import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
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
  const dueAt = sql`coalesce(${uploads.deleteRetryAt}, ${uploads.deletedAt})`;
  const eligible = and(isNotNull(uploads.deletedAt), sql`${dueAt} <= now()`);
  const files = await db
    .select({ id: uploads.id })
    .from(uploads)
    .where(eligible)
    .orderBy(dueAt, uploads.id)
    .limit(100);
  for (const { id } of files) {
    // Reserve the next attempt before contacting storage. Another worker can
    // reclaim the tombstone after the delay if this worker exits mid-request.
    const [file] = await db
      .update(uploads)
      .set({ deleteRetryAt: sql`now() + interval '1 minute'` })
      .where(and(eq(uploads.id, id), eligible))
      .returning({ fileKey: uploads.fileKey });
    if (!file) continue;
    const result = await deleteObject(file.fileKey);
    if (result.success)
      await db
        .delete(uploads)
        .where(and(eq(uploads.id, id), isNotNull(uploads.deletedAt)));
  }
}
