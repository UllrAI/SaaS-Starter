"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database";
import { subscriptions, users } from "@/database/schema";
import { billing } from "@/lib/billing";
import { requireAdmin } from "@/lib/auth/permissions";
import { SITE_CONFIG } from "@/lib/config/site";
import { getProductTierById } from "@/lib/config/products";
import { IntegrationDisabledError } from "@/lib/config/integrations";
import type { SubscriptionStatus, SubscriptionWithUser } from "@/types/billing";

import { adminAction } from "./shared";

interface GetSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus | "all";
  sortBy?: "createdAt" | "currentPeriodEnd" | "status";
  sortOrder?: "asc" | "desc";
}

export async function getSubscriptions({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetSubscriptionsParams) {
  assertBillingEnabled();
  await requireAdmin();

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(subscriptions.subscriptionId, `%${search}%`),
      ),
    );
  }
  if (status !== "all") conditions.push(eq(subscriptions.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy =
    sortOrder === "asc"
      ? asc(subscriptions[sortBy])
      : desc(subscriptions[sortBy]);
  const offset = (page - 1) * limit;
  const [rawSubscriptions, [{ total }]] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        subscriptionId: subscriptions.subscriptionId,
        productId: subscriptions.productId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        userId: subscriptions.userId,
        customerId: subscriptions.customerId,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(where),
  ]);

  const data: SubscriptionWithUser[] = rawSubscriptions
    .filter(
      (
        subscription,
      ): subscription is typeof subscription & {
        user: NonNullable<typeof subscription.user>;
      } => subscription.user !== null,
    )
    .map((subscription) => ({
      ...subscription,
      tierId: subscription.productId,
      status: subscription.status as SubscriptionStatus,
      planName:
        getProductTierById(subscription.productId)?.name || "Unknown Plan",
    }));

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function assertBillingEnabled() {
  if (!SITE_CONFIG.features.billing) {
    throw new IntegrationDisabledError("billing");
  }
}

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string(),
});

export const cancelSubscriptionAction = adminAction
  .schema(cancelSubscriptionSchema)
  .action(async ({ parsedInput: { subscriptionId } }) => {
    assertBillingEnabled();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) throw new Error("Subscription not found");

    await billing.cancelSubscription(subscription.subscriptionId, {
      mode: "immediate",
    });
    revalidatePath("/dashboard/admin/subscriptions");
    return { success: true, message: "Subscription cancellation initiated." };
  });
