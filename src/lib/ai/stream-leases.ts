import { and, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { aiStreamLeases } from "@/database/schema";

const MAX_STREAMS_PER_USER = 4;
const LEASE_DURATION = sql`interval '45 seconds'`;
const unexpired = sql`${aiStreamLeases.expiresAt} > now()`;

export async function acquireAiStreamLease(db: AppDatabase, userId: string) {
  const id = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${"ai-stream:" + userId}, 0))`,
    );
    const active = await tx
      .select({ id: aiStreamLeases.id })
      .from(aiStreamLeases)
      .where(and(eq(aiStreamLeases.userId, userId), unexpired))
      .limit(MAX_STREAMS_PER_USER);
    if (active.length >= MAX_STREAMS_PER_USER) return null;
    const [lease] = await tx
      .insert(aiStreamLeases)
      .values({ userId, expiresAt: sql`now() + ${LEASE_DURATION}` })
      .returning({ id: aiStreamLeases.id });
    return lease.id;
  });
  if (!id) return null;

  return {
    async renew() {
      const [renewed] = await db
        .update(aiStreamLeases)
        .set({ expiresAt: sql`now() + ${LEASE_DURATION}` })
        .where(and(eq(aiStreamLeases.id, id), unexpired))
        .returning({ id: aiStreamLeases.id });
      return Boolean(renewed);
    },
    async release() {
      await db.delete(aiStreamLeases).where(eq(aiStreamLeases.id, id));
    },
  };
}

export async function cleanupExpiredAiStreamLeases(db: AppDatabase) {
  await db
    .delete(aiStreamLeases)
    .where(sql`${aiStreamLeases.expiresAt} <= now()`);
}

export type AiStreamLease = NonNullable<
  Awaited<ReturnType<typeof acquireAiStreamLease>>
>;
