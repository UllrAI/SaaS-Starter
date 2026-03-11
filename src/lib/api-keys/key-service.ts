import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/database";
import { apiKeys } from "@/database/schema";
import {
  API_KEY_PREFIX,
  DEFAULT_API_RATE_LIMIT,
} from "@/lib/machine-auth/constants";
import { hashToken } from "@/lib/machine-auth/hash";
import { isMachineAuthUserActive } from "@/lib/machine-auth/user-access";
import type { ApiKeyPublic, GeneratedApiKey } from "./types";

function toPublic(row: typeof apiKeys.$inferSelect): ApiKeyPublic {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    lastFourChars: row.lastFourChars,
    rateLimit: row.rateLimit,
    isActive: row.isActive,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function generateApiKey(params: {
  userId: string;
  name: string;
  rateLimit?: number;
  expiresAt?: Date | null;
}): Promise<GeneratedApiKey> {
  const rawKey = `${API_KEY_PREFIX}${randomBytes(16).toString("hex")}`;
  const keyHash = hashToken(rawKey);

  const [record] = await db
    .insert(apiKeys)
    .values({
      userId: params.userId,
      name: params.name,
      keyPrefix: rawKey.slice(0, 8),
      keyHash,
      lastFourChars: rawKey.slice(-4),
      rateLimit: params.rateLimit ?? DEFAULT_API_RATE_LIMIT,
      expiresAt: params.expiresAt ?? null,
    })
    .returning();

  if (!record) {
    throw new Error("Failed to create API key.");
  }

  return {
    rawKey,
    record: toPublic(record),
  };
}

export async function validateApiKey(rawKey: string): Promise<{
  userId: string;
  apiKeyId: string;
  rateLimit: number;
} | null> {
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashToken(rawKey);
  const row = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!row || !row.isActive) {
    return null;
  }

  if (row.expiresAt && row.expiresAt < new Date()) {
    return null;
  }

  if (!(await isMachineAuthUserActive(row.userId))) {
    return null;
  }

  return {
    userId: row.userId,
    apiKeyId: row.id,
    rateLimit: row.rateLimit,
  };
}

export async function listApiKeys(userId: string): Promise<ApiKeyPublic[]> {
  const rows = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return rows.map(toPublic);
}

export async function revokeApiKey(params: {
  apiKeyId: string;
  userId: string;
}): Promise<boolean> {
  const [updated] = await db
    .update(apiKeys)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(eq(apiKeys.id, params.apiKeyId), eq(apiKeys.userId, params.userId)),
    )
    .returning({ id: apiKeys.id });

  return Boolean(updated);
}

export async function updateLastUsedAt(apiKeyId: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, apiKeyId));
}

