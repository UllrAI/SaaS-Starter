"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database";
import {
  sessions,
  subscriptions,
  userRoleEnum,
  users,
} from "@/database/schema";
import { SITE_CONFIG } from "@/lib/config/site";
import type { UserRole } from "@/lib/config/roles";
import type { UserWithSubscription } from "@/types/billing";
import { requireAdmin } from "@/lib/auth/permissions";

import { adminAction } from "./shared";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "all";
  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}

export async function getUsers({
  page = 1,
  limit = 20,
  search = "",
  role = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetUsersParams) {
  await requireAdmin();
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(
      or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)),
    );
  }
  if (role !== "all") {
    conditions.push(eq(users.role, role));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy =
    sortOrder === "asc" ? asc(users[sortBy]) : desc(users[sortBy]);
  const [pageUsers, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  const pageSubscriptions =
    !SITE_CONFIG.features.billing || pageUsers.length === 0
      ? []
      : await db
          .select({
            userId: subscriptions.userId,
            subscriptionId: subscriptions.subscriptionId,
            status: subscriptions.status,
          })
          .from(subscriptions)
          .where(
            inArray(
              subscriptions.userId,
              pageUsers.map((user) => user.id),
            ),
          );
  const subscriptionsByUser = new Map<
    string,
    UserWithSubscription["subscriptions"]
  >();

  for (const subscription of pageSubscriptions) {
    if (!subscription.subscriptionId) continue;
    const existing = subscriptionsByUser.get(subscription.userId) ?? [];
    existing.push({
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
    });
    subscriptionsByUser.set(subscription.userId, existing);
  }

  return {
    data: pageUsers.map((user) => ({
      ...user,
      subscriptions: subscriptionsByUser.get(user.id) ?? [],
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  role: z.enum(userRoleEnum.enumValues).optional(),
});

export const updateUserAction = adminAction
  .schema(updateUserSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1);

    if (!targetUser) throw new Error("User not found");
    if (
      (targetUser.role === "super_admin" || input.role === "super_admin") &&
      ctx.user.role !== "super_admin"
    ) {
      throw new Error("Insufficient permissions to modify super_admin");
    }
    if (
      input.id === ctx.user.id &&
      input.role &&
      input.role !== ctx.user.role
    ) {
      throw new Error("Cannot modify your own role");
    }

    await db.update(users).set(input).where(eq(users.id, input.id));
    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "User updated successfully." };
  });

const setUserDisabledSchema = z.object({
  id: z.string(),
  disabled: z.boolean(),
});

export const setUserDisabledAction = adminAction
  .schema(setUserDisabledSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1);

    if (!targetUser) throw new Error("User not found");
    if (targetUser.role === "super_admin" && ctx.user.role !== "super_admin") {
      throw new Error("Insufficient permissions to modify super_admin");
    }
    if (input.disabled && input.id === ctx.user.id) {
      throw new Error("Cannot disable your own account");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          banned: input.disabled,
          banReason: null,
          banExpires: null,
        })
        .where(eq(users.id, input.id));

      if (input.disabled) {
        await tx.delete(sessions).where(eq(sessions.userId, input.id));
      }
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true, disabled: input.disabled };
  });
