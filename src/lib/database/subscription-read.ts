import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { subscriptions, payments } from "@/database/schema";
import type { Subscription, SubscriptionStatus } from "@/types/billing";
import {
  canManageSubscription,
  hasCurrentSubscriptionAccess,
} from "@/lib/billing/access";

export async function getUserSubscriptionFromDatabase(
  db: AppDatabase,
  userId: string,
): Promise<Subscription | null> {
  const userSubscriptions = await db
    .select({
      ...getTableColumns(subscriptions),
      accessRestricted: sql<boolean>`exists (
        select 1 from ${payments}
        where ${payments.subscriptionId} = ${subscriptions.subscriptionId}
          and ${payments.status} in ('refunded', 'disputed')
      )`,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt)); // Order by creation date descending for deterministic behavior

  const mappedSubscriptions: Subscription[] = userSubscriptions.map(
    (subscription) => ({
      id: subscription.id,
      userId: subscription.userId,
      customerId: subscription.customerId,
      subscriptionId: subscription.subscriptionId,
      status: subscription.status as SubscriptionStatus,
      tierId: subscription.productId,
      accessRestricted: subscription.accessRestricted,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canceledAt: subscription.canceledAt,
    }),
  );

  const now = new Date();
  const accessibleSubscriptions = mappedSubscriptions.filter((subscription) =>
    hasCurrentSubscriptionAccess(subscription, now),
  );
  const manageableSubscriptions = mappedSubscriptions.filter(
    (subscription) =>
      !hasCurrentSubscriptionAccess(subscription, now) &&
      canManageSubscription(subscription),
  );

  if (accessibleSubscriptions.length > 1) {
    console.warn(
      `User ${userId} has ${accessibleSubscriptions.length} currently accessible subscriptions. ` +
        "This may indicate a data consistency issue. Returning the most recent one.",
      {
        userId,
        subscriptionIds: accessibleSubscriptions.map(
          ({ subscriptionId }) => subscriptionId,
        ),
        statuses: accessibleSubscriptions.map(({ status }) => status),
      },
    );
  }

  return (
    accessibleSubscriptions[0] ??
    manageableSubscriptions[0] ??
    mappedSubscriptions[0] ??
    null
  );
}
