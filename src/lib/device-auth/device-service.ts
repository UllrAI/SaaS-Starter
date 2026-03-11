import { randomBytes } from "crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/database";
import { deviceCodes } from "@/database/schema";
import {
  DEVICE_CODE_DEFAULT_INTERVAL_SECONDS,
  DEVICE_CODE_MAX_ATTEMPTS,
  DEVICE_CODE_MAX_INTERVAL_SECONDS,
  DEVICE_CODE_TTL_MS,
} from "@/lib/machine-auth/constants";
import type {
  DeviceCodeResponse,
  DeviceTokenPendingResponse,
  DeviceTokenResponse,
} from "@/lib/machine-auth/types";
import { createCliToken } from "./token-service";

const SAFE_CHARS = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

function generateUserCode(): string {
  const bytes = randomBytes(8);
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += SAFE_CHARS[bytes[index]! % SAFE_CHARS.length];
  }

  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

async function cleanupExpiredCodes(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await db.delete(deviceCodes).where(lt(deviceCodes.expiresAt, oneHourAgo));
}

export async function createDeviceCode(params: {
  clientName?: string;
  clientVersion?: string;
  deviceOs?: string;
  deviceHostname?: string;
  verificationBaseUri: string;
}): Promise<DeviceCodeResponse> {
  if (Math.random() < 0.1) {
    cleanupExpiredCodes().catch(() => {});
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEVICE_CODE_TTL_MS);
  const deviceCode = randomBytes(20).toString("hex");
  const userCode = generateUserCode();

  await db.insert(deviceCodes).values({
    deviceCode,
    userCode,
    status: "pending",
    interval: DEVICE_CODE_DEFAULT_INTERVAL_SECONDS,
    clientName: params.clientName ?? null,
    clientVersion: params.clientVersion ?? null,
    deviceOs: params.deviceOs ?? null,
    deviceHostname: params.deviceHostname ?? null,
    expiresAt,
  });

  return {
    deviceCode,
    userCode,
    verificationUri: `${params.verificationBaseUri}/device`,
    expiresIn: Math.floor(DEVICE_CODE_TTL_MS / 1000),
    interval: DEVICE_CODE_DEFAULT_INTERVAL_SECONDS,
  };
}

export async function authorizeDeviceCode(
  userCode: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const now = new Date();

  const [attemptUpdate] = await db
    .update(deviceCodes)
    .set({
      attempts: sql`${deviceCodes.attempts} + 1`,
    })
    .where(
      and(
        eq(deviceCodes.userCode, userCode),
        eq(deviceCodes.status, "pending"),
      ),
    )
    .returning({
      attempts: deviceCodes.attempts,
      expiresAt: deviceCodes.expiresAt,
    });

  if (!attemptUpdate) {
    return { success: false, error: "Invalid or expired code." };
  }

  if (attemptUpdate.expiresAt < now) {
    return { success: false, error: "Code has expired." };
  }

  if (attemptUpdate.attempts > DEVICE_CODE_MAX_ATTEMPTS) {
    await db
      .update(deviceCodes)
      .set({
        status: "expired",
      })
      .where(eq(deviceCodes.userCode, userCode));

    return {
      success: false,
      error: "Too many attempts. Please request a new code.",
    };
  }

  const [authorized] = await db
    .update(deviceCodes)
    .set({
      status: "authorized",
      userId,
    })
    .where(
      and(
        eq(deviceCodes.userCode, userCode),
        eq(deviceCodes.status, "pending"),
      ),
    )
    .returning({ id: deviceCodes.id });

  if (!authorized) {
    return {
      success: false,
      error: "Code already authorized or expired.",
    };
  }

  return { success: true };
}

export async function pollDeviceCode(deviceCode: string): Promise<
  | { type: "token"; data: DeviceTokenResponse }
  | { type: "pending"; data: DeviceTokenPendingResponse }
> {
  const now = new Date();
  const row = await db.query.deviceCodes.findFirst({
    where: eq(deviceCodes.deviceCode, deviceCode),
  });

  if (!row || row.expiresAt < now || row.status === "expired" || row.status === "used") {
    return {
      type: "pending",
      data: {
        status: "expired",
      },
    };
  }

  if (row.status === "pending") {
    if (row.lastPolledAt) {
      const elapsedMs = now.getTime() - row.lastPolledAt.getTime();
      if (elapsedMs < row.interval * 1000) {
        await db
          .update(deviceCodes)
          .set({
            interval: Math.min(
              row.interval + 1,
              DEVICE_CODE_MAX_INTERVAL_SECONDS,
            ),
            lastPolledAt: now,
          })
          .where(eq(deviceCodes.id, row.id));

        return {
          type: "pending",
          data: {
            status: "slow_down",
          },
        };
      }
    }

    await db
      .update(deviceCodes)
      .set({
        lastPolledAt: now,
      })
      .where(eq(deviceCodes.id, row.id));

    return {
      type: "pending",
      data: {
        status: "authorization_pending",
      },
    };
  }

  if (!row.userId) {
    return {
      type: "pending",
      data: {
        status: "expired",
      },
    };
  }

  const [usedRow] = await db
    .update(deviceCodes)
    .set({
      status: "used",
    })
    .where(
      and(eq(deviceCodes.id, row.id), eq(deviceCodes.status, "authorized")),
    )
    .returning({ id: deviceCodes.id });

  if (!usedRow) {
    return {
      type: "pending",
      data: {
        status: "authorization_pending",
      },
    };
  }

  const tokenName = [row.deviceHostname, row.clientName].filter(Boolean).join(" - ");
  const token = await createCliToken({
    userId: row.userId,
    name: tokenName || "CLI Device",
    deviceOs: row.deviceOs ?? row.clientName ?? undefined,
    deviceHostname: row.deviceHostname ?? undefined,
    cliVersion: row.clientVersion ?? undefined,
  });

  return {
    type: "token",
    data: {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      tokenType: "bearer",
      expiresIn: token.expiresIn,
    },
  };
}
