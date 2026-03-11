import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/database";
import { cliTokens } from "@/database/schema";
import {
  CLI_ACCESS_TOKEN_TTL_MS,
  CLI_REFRESH_GRACE_PERIOD_MS,
  CLI_REFRESH_PREFIX,
  CLI_REFRESH_TOKEN_TTL_MS,
  CLI_TOKEN_PREFIX,
} from "@/lib/machine-auth/constants";
import { hashToken } from "@/lib/machine-auth/hash";
import { isMachineAuthUserActive } from "@/lib/machine-auth/user-access";
import type { CliTokenPublic } from "@/lib/machine-auth/types";

function toPublic(row: typeof cliTokens.$inferSelect): CliTokenPublic {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    lastFourChars: row.lastFourChars,
    isActive: row.isActive,
    expiresAt: row.expiresAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    deviceOs: row.deviceOs,
    deviceHostname: row.deviceHostname,
    cliVersion: row.cliVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

function createAccessToken() {
  const rawValue = `${CLI_TOKEN_PREFIX}${randomBytes(16).toString("hex")}`;
  return {
    rawValue,
    hash: hashToken(rawValue),
    prefix: rawValue.slice(0, 8),
    lastFourChars: rawValue.slice(-4),
  };
}

function createRefreshToken() {
  const rawValue = `${CLI_REFRESH_PREFIX}${randomBytes(16).toString("hex")}`;
  return {
    rawValue,
    hash: hashToken(rawValue),
  };
}

export async function createCliToken(params: {
  userId: string;
  name: string;
  deviceOs?: string;
  deviceHostname?: string;
  cliVersion?: string;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const accessToken = createAccessToken();
  const refreshToken = createRefreshToken();
  const now = new Date();

  await db.insert(cliTokens).values({
    userId: params.userId,
    name: params.name,
    tokenHash: accessToken.hash,
    tokenPrefix: accessToken.prefix,
    lastFourChars: accessToken.lastFourChars,
    refreshTokenHash: refreshToken.hash,
    expiresAt: new Date(now.getTime() + CLI_ACCESS_TOKEN_TTL_MS),
    refreshExpiresAt: new Date(now.getTime() + CLI_REFRESH_TOKEN_TTL_MS),
    deviceOs: params.deviceOs ?? null,
    deviceHostname: params.deviceHostname ?? null,
    cliVersion: params.cliVersion ?? null,
  });

  return {
    accessToken: accessToken.rawValue,
    refreshToken: refreshToken.rawValue,
    expiresIn: Math.floor(CLI_ACCESS_TOKEN_TTL_MS / 1000),
  };
}

export async function validateCliToken(
  rawToken: string,
): Promise<{ userId: string; cliTokenId: string } | null> {
  if (!rawToken.startsWith(CLI_TOKEN_PREFIX)) {
    return null;
  }

  const row = await db.query.cliTokens.findFirst({
    where: eq(cliTokens.tokenHash, hashToken(rawToken)),
  });

  if (!row || !row.isActive || row.expiresAt < new Date()) {
    return null;
  }

  if (!(await isMachineAuthUserActive(row.userId))) {
    return null;
  }

  return {
    userId: row.userId,
    cliTokenId: row.id,
  };
}

export async function refreshCliToken(rawRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  if (!rawRefreshToken.startsWith(CLI_REFRESH_PREFIX)) {
    return null;
  }

  const now = new Date();
  const refreshHash = hashToken(rawRefreshToken);
  const row = await db.query.cliTokens.findFirst({
    where: and(
      eq(cliTokens.refreshTokenHash, refreshHash),
      eq(cliTokens.isActive, true),
    ),
  });

  if (row) {
    if (row.refreshExpiresAt < now || !(await isMachineAuthUserActive(row.userId))) {
      return null;
    }

    const nextAccessToken = createAccessToken();
    const nextRefreshToken = createRefreshToken();

    await db
      .update(cliTokens)
      .set({
        tokenHash: nextAccessToken.hash,
        tokenPrefix: nextAccessToken.prefix,
        lastFourChars: nextAccessToken.lastFourChars,
        refreshTokenHash: nextRefreshToken.hash,
        previousRefreshTokenHash: refreshHash,
        refreshRotatedAt: now,
        expiresAt: new Date(now.getTime() + CLI_ACCESS_TOKEN_TTL_MS),
        refreshExpiresAt: new Date(now.getTime() + CLI_REFRESH_TOKEN_TTL_MS),
        updatedAt: now,
      })
      .where(eq(cliTokens.id, row.id));

    return {
      accessToken: nextAccessToken.rawValue,
      refreshToken: nextRefreshToken.rawValue,
      expiresIn: Math.floor(CLI_ACCESS_TOKEN_TTL_MS / 1000),
    };
  }

  const graceRow = await db.query.cliTokens.findFirst({
    where: and(
      eq(cliTokens.previousRefreshTokenHash, refreshHash),
      eq(cliTokens.isActive, true),
    ),
  });

  if (!graceRow) {
    return null;
  }

  if (
    !graceRow.refreshRotatedAt ||
    now.getTime() - graceRow.refreshRotatedAt.getTime() > CLI_REFRESH_GRACE_PERIOD_MS
  ) {
    await db
      .update(cliTokens)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(cliTokens.id, graceRow.id));
    return null;
  }

  if (!(await isMachineAuthUserActive(graceRow.userId))) {
    return null;
  }

  const nextAccessToken = createAccessToken();
  const nextRefreshToken = createRefreshToken();
  const [updated] = await db
    .update(cliTokens)
    .set({
      tokenHash: nextAccessToken.hash,
      tokenPrefix: nextAccessToken.prefix,
      lastFourChars: nextAccessToken.lastFourChars,
      refreshTokenHash: nextRefreshToken.hash,
      previousRefreshTokenHash: refreshHash,
      refreshRotatedAt: now,
      expiresAt: new Date(now.getTime() + CLI_ACCESS_TOKEN_TTL_MS),
      refreshExpiresAt: new Date(now.getTime() + CLI_REFRESH_TOKEN_TTL_MS),
      updatedAt: now,
    })
    .where(and(eq(cliTokens.id, graceRow.id), eq(cliTokens.isActive, true)))
    .returning({ id: cliTokens.id });

  if (!updated) {
    return null;
  }

  return {
    accessToken: nextAccessToken.rawValue,
    refreshToken: nextRefreshToken.rawValue,
    expiresIn: Math.floor(CLI_ACCESS_TOKEN_TTL_MS / 1000),
  };
}

export async function listCliTokens(userId: string): Promise<CliTokenPublic[]> {
  const rows = await db.query.cliTokens.findMany({
    where: eq(cliTokens.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return rows.map(toPublic);
}

export async function revokeCliToken(params: {
  tokenId: string;
  userId: string;
}): Promise<boolean> {
  const [updated] = await db
    .update(cliTokens)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(eq(cliTokens.id, params.tokenId), eq(cliTokens.userId, params.userId)),
    )
    .returning({ id: cliTokens.id });

  return Boolean(updated);
}

export async function updateCliTokenLastUsed(tokenId: string): Promise<void> {
  await db
    .update(cliTokens)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cliTokens.id, tokenId));
}

