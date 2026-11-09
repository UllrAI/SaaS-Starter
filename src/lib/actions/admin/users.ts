"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database";
import type { DatabaseExecutor } from "@/database/client";
import {
  sessions,
  subscriptions,
  userRoleEnum,
  users,
} from "@/database/schema";
import { SITE_CONFIG } from "@/lib/config/site";
import { hasRole, type UserRole } from "@/lib/config/roles";
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

async function lockManagedUser(
  tx: DatabaseExecutor,
  actorId: string,
  targetId: string,
  nextRole?: UserRole,
) {
  // Acquire actor and target locks in the same order for all account changes.
  const accounts = await tx
    .select({ id: users.id, role: users.role, banned: users.banned })
    .from(users)
    .where(inArray(users.id, [actorId, targetId]))
    .orderBy(asc(users.id))
    .for("update");
  const actor = accounts.find((account) => account.id === actorId);
  if (!actor || actor.banned || !hasRole(actor.role, "admin"))
    throw new Error("Insufficient permissions to manage users");
  const target = accounts.find((account) => account.id === targetId);
  if (!target) throw new Error("User not found");
  if (
    (target.role === "super_admin" || nextRole === "super_admin") &&
    actor.role !== "super_admin"
  )
    throw new Error("Insufficient permissions to modify super_admin");
  return target;
}

export const updateUserAction = adminAction
  .schema(updateUserSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const { id, ...changes } = input;
    await db.transaction(async (tx) => {
      const target = await lockManagedUser(tx, ctx.user.id, id, changes.role);
      if (id === ctx.user.id && changes.role && changes.role !== target.role)
        throw new Error("Cannot modify your own role");
      if (changes.name !== undefined || changes.role !== undefined)
        await tx.update(users).set(changes).where(eq(users.id, id));
    });
    console.info(
      JSON.stringify({
        component: "admin-audit",
        action: "user_updated",
        actorId: ctx.user.id,
        targetId: input.id,
        role: input.role,
        nameChanged: input.name !== undefined,
      }),
    );
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
    if (input.disabled && input.id === ctx.user.id) {
      throw new Error("Cannot disable your own account");
    }

    await db.transaction(async (tx) => {
      await lockManagedUser(tx, ctx.user.id, input.id);
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

    console.info(
      JSON.stringify({
        component: "admin-audit",
        action: "user_disabled_changed",
        actorId: ctx.user.id,
        targetId: input.id,
        disabled: input.disabled,
      }),
    );
    revalidatePath("/dashboard/admin/users");
    return { success: true, disabled: input.disabled };
  });
