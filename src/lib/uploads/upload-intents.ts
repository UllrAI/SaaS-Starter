import { randomUUID } from "crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/database";
import { uploadIntents, uploads } from "@/database/schema";
import env from "@/env";
import { getFileExtension, UPLOAD_CONFIG } from "@/lib/config/upload";
import { buildR2PublicUrl, deleteFile } from "@/lib/r2";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type UploadIntent = typeof uploadIntents.$inferSelect;
export type UploadRecord = typeof uploads.$inferSelect;

interface UploadReservation {
  userId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface CompleteUploadInput {
  intentId?: string;
  userId: string;
  key: string;
  contentLength: number;
  contentType: string;
  declaration?: {
    fileName: string;
    fileSize: number;
    contentType: string;
    url: string;
  };
}

interface CompleteLegacyUploadInput {
  userId: string;
  key: string;
  contentLength: number;
  contentType: string;
  declaration: {
    fileName: string;
    fileSize: number;
    contentType: string;
    url: string;
  };
}

const LEGACY_UPLOAD_KEY_PATTERN =
  /^uploads\/([^/]+)\/(\d{13})-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$/i;
const LEGACY_UPLOAD_CLOCK_SKEW_MS = 5 * 60 * 1000;

export class UploadQuotaExceededError extends Error {
  constructor(readonly quota: "daily" | "total") {
    super(`The ${quota} upload quota has been reached.`);
    this.name = "UploadQuotaExceededError";
  }
}

export class UploadIntentUnavailableError extends Error {
  constructor(message = "The upload intent is expired or unavailable.") {
    super(message);
    this.name = "UploadIntentUnavailableError";
  }
}

export class UploadMetadataMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadMetadataMismatchError";
  }
}

async function lockUserUploadScope(userId: string, tx: Transaction) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${"upload:" + userId}, 0))`,
  );
}

async function getUploadUsage(userId: string, tx: Transaction) {
  const [completed] = await tx
    .select({
      total: sql<number>`coalesce(sum(${uploads.fileSize}), 0)`,
      recent: sql<number>`coalesce(
        sum(${uploads.fileSize}) filter (
          where ${uploads.createdAt} >= (now() at time zone 'UTC') - interval '24 hours'
        ),
        0
      )`,
    })
    .from(uploads)
    .where(eq(uploads.userId, userId));

  const [reserved] = await tx
    .select({
      total: sql<number>`coalesce(sum(${uploadIntents.fileSize}), 0)`,
      recent: sql<number>`coalesce(
        sum(${uploadIntents.fileSize}) filter (
          where ${uploadIntents.createdAt} >= now() - interval '24 hours'
        ),
        0
      )`,
    })
    .from(uploadIntents)
    .where(
      and(
        eq(uploadIntents.userId, userId),
        eq(uploadIntents.status, "pending"),
        sql`${uploadIntents.expiresAt} > now()`,
      ),
    );

  return {
    daily: Number(completed?.recent ?? 0) + Number(reserved?.recent ?? 0),
    total: Number(completed?.total ?? 0) + Number(reserved?.total ?? 0),
  };
}

export async function createUploadIntent({
  userId,
  fileName,
  fileSize,
  contentType,
}: UploadReservation): Promise<UploadIntent> {
  return db.transaction(async (tx) => {
    await lockUserUploadScope(userId, tx);

    const usage = await getUploadUsage(userId, tx);
    if (usage.daily + fileSize > env.UPLOAD_DAILY_QUOTA_BYTES) {
      throw new UploadQuotaExceededError("daily");
    }
    if (usage.total + fileSize > env.UPLOAD_TOTAL_QUOTA_BYTES) {
      throw new UploadQuotaExceededError("total");
    }

    const id = randomUUID();
    const extension = getFileExtension(contentType);
    const fileKey = `uploads/${userId}/${id}.${extension}`;
    const [intent] = await tx
      .insert(uploadIntents)
      .values({
        id,
        userId,
        fileKey,
        fileName,
        fileSize,
        contentType,
        expiresAt: sql`now() + make_interval(secs => ${UPLOAD_CONFIG.UPLOAD_INTENT_EXPIRATION})`,
      })
      .returning();

    if (!intent) {
      throw new Error("Upload intent was not created.");
    }

    return intent;
  });
}

export async function releaseUploadIntent(intentId: string, userId: string) {
  await db.transaction(async (tx) => {
    await lockUserUploadScope(userId, tx);
    await tx
      .delete(uploadIntents)
      .where(
        and(
          eq(uploadIntents.id, intentId),
          eq(uploadIntents.userId, userId),
          eq(uploadIntents.status, "pending"),
        ),
      );
  });
}

export async function cancelUploadIntent(intentId: string, userId: string) {
  return db.transaction(async (tx) => {
    await lockUserUploadScope(userId, tx);
    const [cancelled] = await tx
      .update(uploadIntents)
      .set({
        status: "cancelled",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(uploadIntents.id, intentId),
          eq(uploadIntents.userId, userId),
          eq(uploadIntents.status, "pending"),
        ),
      )
      .returning({ id: uploadIntents.id });

    return Boolean(cancelled);
  });
}

export async function completeUploadIntent({
  intentId,
  userId,
  key,
  contentLength,
  contentType,
  declaration,
}: CompleteUploadInput): Promise<UploadRecord> {
  return db.transaction(async (tx) => {
    await lockUserUploadScope(userId, tx);

    const intentCondition = intentId
      ? and(
          eq(uploadIntents.id, intentId),
          eq(uploadIntents.userId, userId),
          eq(uploadIntents.fileKey, key),
        )
      : and(eq(uploadIntents.userId, userId), eq(uploadIntents.fileKey, key));
    const [intent] = await tx
      .select({
        row: uploadIntents,
        expired: sql<boolean>`${uploadIntents.expiresAt} <= now()`,
      })
      .from(uploadIntents)
      .where(intentCondition)
      .for("update");

    if (!intent) {
      throw new UploadIntentUnavailableError();
    }

    if (declaration) {
      if (
        intent.row.fileName !== declaration.fileName ||
        intent.row.fileSize !== declaration.fileSize ||
        intent.row.contentType !== declaration.contentType ||
        declaration.url !== buildR2PublicUrl(key)
      ) {
        throw new UploadMetadataMismatchError(
          "Upload details do not match the original reservation.",
        );
      }
    }

    if (intent.row.status === "completed") {
      const [existing] = await tx
        .select()
        .from(uploads)
        .where(eq(uploads.uploadIntentId, intent.row.id))
        .limit(1);
      if (!existing) {
        throw new Error(
          "Completed upload intent is missing its upload record.",
        );
      }
      return existing;
    }

    if (intent.row.status !== "pending" || intent.expired) {
      throw new UploadIntentUnavailableError();
    }
    if (intent.row.fileKey !== key) {
      throw new UploadMetadataMismatchError(
        "Upload key does not match the reserved object key.",
      );
    }
    if (intent.row.fileSize !== contentLength) {
      throw new UploadMetadataMismatchError(
        "Uploaded object size does not match the reserved size.",
      );
    }
    if (intent.row.contentType !== contentType) {
      throw new UploadMetadataMismatchError(
        "Uploaded object content type does not match the reserved type.",
      );
    }

    const [record] = await tx
      .insert(uploads)
      .values({
        userId,
        uploadIntentId: intent.row.id,
        fileKey: key,
        url: buildR2PublicUrl(key),
        fileName: intent.row.fileName,
        fileSize: contentLength,
        contentType,
      })
      .returning();

    if (!record) {
      throw new Error("Upload record was not created.");
    }

    await tx
      .update(uploadIntents)
      .set({
        status: "completed",
        completedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(uploadIntents.id, intent.row.id));

    return record;
  });
}

function isEligibleLegacyUploadKey(
  key: string,
  userId: string,
  now: number,
): boolean {
  const since = env.UPLOAD_LEGACY_COMPLETION_SINCE
    ? Date.parse(env.UPLOAD_LEGACY_COMPLETION_SINCE)
    : Number.NaN;
  const cutoff = env.UPLOAD_LEGACY_COMPLETION_UNTIL
    ? Date.parse(env.UPLOAD_LEGACY_COMPLETION_UNTIL)
    : Number.NaN;
  if (
    !Number.isFinite(since) ||
    !Number.isFinite(cutoff) ||
    since >= cutoff ||
    cutoff - since > 24 * 60 * 60 * 1000 ||
    now < since ||
    now > cutoff
  ) {
    return false;
  }

  const match = LEGACY_UPLOAD_KEY_PATTERN.exec(key);
  if (!match || match[1] !== userId) {
    return false;
  }

  const issuedAt = Number(match[2]);
  return (
    issuedAt >= since - UPLOAD_CONFIG.PRESIGNED_URL_EXPIRATION * 1000 &&
    issuedAt <= Math.min(cutoff, now + LEGACY_UPLOAD_CLOCK_SKEW_MS)
  );
}

export async function completeLegacyUpload({
  userId,
  key,
  contentLength,
  contentType,
  declaration,
}: CompleteLegacyUploadInput): Promise<UploadRecord | null> {
  if (!isEligibleLegacyUploadKey(key, userId, Date.now())) {
    return null;
  }
  if (
    declaration.fileSize !== contentLength ||
    declaration.contentType !== contentType ||
    declaration.url !== buildR2PublicUrl(key)
  ) {
    throw new UploadMetadataMismatchError(
      "Legacy upload details do not match the stored object.",
    );
  }

  return db.transaction(async (tx) => {
    await lockUserUploadScope(userId, tx);
    if (!isEligibleLegacyUploadKey(key, userId, Date.now())) {
      return null;
    }

    const [existing] = await tx
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, userId), eq(uploads.fileKey, key)))
      .limit(1);
    if (existing) {
      return existing;
    }

    const usage = await getUploadUsage(userId, tx);
    if (usage.daily + contentLength > env.UPLOAD_DAILY_QUOTA_BYTES) {
      throw new UploadQuotaExceededError("daily");
    }
    if (usage.total + contentLength > env.UPLOAD_TOTAL_QUOTA_BYTES) {
      throw new UploadQuotaExceededError("total");
    }

    const [created] = await tx
      .insert(uploads)
      .values({
        userId,
        fileKey: key,
        url: buildR2PublicUrl(key),
        fileName: declaration.fileName,
        fileSize: contentLength,
        contentType,
      })
      .onConflictDoNothing({ target: uploads.fileKey })
      .returning();
    if (created) {
      return created;
    }

    const [conflicting] = await tx
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, userId), eq(uploads.fileKey, key)))
      .limit(1);
    return conflicting ?? null;
  });
}

async function claimExpiredIntent(
  intent: Pick<UploadIntent, "id" | "userId" | "status">,
): Promise<UploadIntent | null> {
  return db.transaction(async (tx) => {
    await lockUserUploadScope(intent.userId, tx);
    const [claimed] = await tx
      .update(uploadIntents)
      .set({ status: "cleaning", updatedAt: sql`now()` })
      .where(
        and(
          eq(uploadIntents.id, intent.id),
          eq(uploadIntents.userId, intent.userId),
          eq(uploadIntents.status, intent.status),
          or(
            eq(uploadIntents.status, "pending"),
            eq(uploadIntents.status, "cancelled"),
          ),
          sql`${uploadIntents.expiresAt} <= now()`,
        ),
      )
      .returning();
    return claimed ?? null;
  });
}

export async function cleanupExpiredUploadIntents(
  limit = 100,
  deleteObject: typeof deleteFile = deleteFile,
) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const candidates = await db
    .select({
      id: uploadIntents.id,
      userId: uploadIntents.userId,
      status: uploadIntents.status,
    })
    .from(uploadIntents)
    .where(
      and(
        or(
          eq(uploadIntents.status, "pending"),
          eq(uploadIntents.status, "cancelled"),
        ),
        sql`${uploadIntents.expiresAt} <= now()`,
      ),
    )
    .orderBy(uploadIntents.cleanupAttempts, uploadIntents.expiresAt)
    .limit(safeLimit);

  let deleted = 0;
  let deferred = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const claimed = await claimExpiredIntent(candidate);
    if (!claimed) {
      continue;
    }

    const result = await deleteObject(claimed.fileKey);
    if (result.success) {
      if (!claimed.deleteCheckedAt) {
        await db
          .update(uploadIntents)
          .set({
            status: "cancelled",
            deleteCheckedAt: sql`now()`,
            expiresAt: sql`now() + make_interval(secs => ${UPLOAD_CONFIG.UPLOAD_TOMBSTONE_RECHECK_DELAY})`,
            lastCleanupError: null,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(uploadIntents.id, claimed.id),
              eq(uploadIntents.status, "cleaning"),
            ),
          );
        deferred += 1;
        continue;
      }

      await db
        .delete(uploadIntents)
        .where(
          and(
            eq(uploadIntents.id, claimed.id),
            eq(uploadIntents.status, "cleaning"),
          ),
        );
      deleted += 1;
      continue;
    }

    await db
      .update(uploadIntents)
      .set({
        status: candidate.status,
        expiresAt: sql`now() + make_interval(secs => ${UPLOAD_CONFIG.UPLOAD_CLEANUP_RETRY_DELAY})`,
        cleanupAttempts: sql`${uploadIntents.cleanupAttempts} + 1`,
        lastCleanupError: (result.error ?? "Object deletion failed.").slice(
          0,
          500,
        ),
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(uploadIntents.id, claimed.id),
          eq(uploadIntents.status, "cleaning"),
        ),
      );
    failed += 1;
  }

  return { scanned: candidates.length, deleted, deferred, failed };
}

export async function recoverStaleUploadCleanupClaims() {
  const rows = await db
    .update(uploadIntents)
    .set({ status: "cancelled", updatedAt: sql`now()` })
    .where(
      and(
        eq(uploadIntents.status, "cleaning"),
        sql`${uploadIntents.updatedAt} <= now() - interval '15 minutes'`,
      ),
    )
    .returning({ id: uploadIntents.id });
  return rows.length;
}
