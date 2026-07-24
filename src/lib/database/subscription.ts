import { db } from "@/database";
import * as schema from "@/database/schema";
import {
  subscriptions,
  payments,
  productEntitlements,
  users,
  webhookEvents,
} from "@/database/tables";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { Subscription, SubscriptionStatus } from "@/types/billing";
import {
  getProductTierByProductId,
  getProductTierById,
} from "@/lib/config/products";
import { ExtractTablesWithRelations } from "drizzle-orm";

export type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

interface UpsertSubscriptionData {
  userId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date | null;
  lastWebhookCreatedAt: Date;
}

interface UpsertPaymentData {
  userId: string;
  customerId: string;
  subscriptionId?: string | null;
  productId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
}

interface GrantProductEntitlementData {
  userId: string;
  productId: string;
  sourcePaymentId: string;
}

const getDb = (tx?: Tx) => tx || db;

export async function upsertSubscription(
  data: UpsertSubscriptionData,
  tx?: Tx,
) {
  const dbase = getDb(tx);
  const now = new Date();

  return dbase
    .insert(subscriptions)
    .values({ ...data, updatedAt: now })
    .onConflictDoUpdate({
      target: subscriptions.subscriptionId,
      set: {
        status: data.status,
        productId: data.productId,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        canceledAt: data.canceledAt,
        lastWebhookCreatedAt: data.lastWebhookCreatedAt,
        updatedAt: now,
      },
      setWhere: sql`${subscriptions.lastWebhookCreatedAt} is null or ${subscriptions.lastWebhookCreatedAt} <= ${data.lastWebhookCreatedAt}`,
    })
    .returning();
}

export async function upsertPayment(data: UpsertPaymentData, tx?: Tx) {
  const dbase = getDb(tx);
  const now = new Date();
  const currency = data.currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("Payment currency must be a three-letter ISO code.");
  }
  const normalizedData = {
    ...data,
    currency,
  };

  const rows = await dbase
    .insert(payments)
    .values({ ...normalizedData, updatedAt: now })
    .onConflictDoUpdate({
      target: payments.paymentId,
      set: {
        status: sql`case
          when ${payments.status} in ('partially_refunded', 'refunded', 'disputed')
            then ${payments.status}
          else ${data.status}
        end`,
        updatedAt: now,
      },
    })
    .returning();

  const payment = rows[0];
  if (
    !payment ||
    payment.userId !== data.userId ||
    payment.customerId !== data.customerId ||
    payment.productId !== data.productId ||
    payment.amount !== data.amount ||
    payment.currency !== normalizedData.currency ||
    payment.paymentType !== data.paymentType ||
    payment.subscriptionId !== (data.subscriptionId ?? null)
  ) {
    throw new Error(
      `Payment ${data.paymentId} conflicts with existing immutable payment data.`,
    );
  }

  return rows;
}

export async function suspendSubscriptionAccess(
  subscriptionId: string,
  eventCreatedAt: Date,
  tx?: Tx,
) {
  const dbase = getDb(tx);
  const applySuspension = () =>
    dbase
      .update(subscriptions)
      .set({
        status: "unpaid",
        lastWebhookCreatedAt: eventCreatedAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.subscriptionId, subscriptionId),
          sql`${subscriptions.lastWebhookCreatedAt} is null or ${subscriptions.lastWebhookCreatedAt} <= ${eventCreatedAt}`,
        ),
      )
      .returning();
  let rows = await applySuspension();

  if (rows.length === 0) {
    const [existingSubscription] = await dbase
      .select({
        id: subscriptions.id,
        lastWebhookCreatedAt: subscriptions.lastWebhookCreatedAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (!existingSubscription) {
      throw new Error(
        `Subscription ${subscriptionId} is not available for a billing adjustment yet.`,
      );
    }

    if (
      !existingSubscription.lastWebhookCreatedAt ||
      existingSubscription.lastWebhookCreatedAt <= eventCreatedAt
    ) {
      rows = await applySuspension();
      if (rows.length === 0) {
        throw new Error(
          `Subscription ${subscriptionId} changed during its billing adjustment.`,
        );
      }
    }
  }

  return rows;
}

export async function grantProductEntitlement(
  data: GrantProductEntitlementData,
  tx?: Tx,
) {
  return getDb(tx)
    .insert(productEntitlements)
    .values(data)
    .onConflictDoUpdate({
      target: [productEntitlements.userId, productEntitlements.productId],
      set: {
        sourcePaymentId: data.sourcePaymentId,
        revokedAt: null,
        revocationReason: null,
      },
    })
    .returning();
}

export async function revokeProductEntitlementByPaymentId(
  sourcePaymentId: string,
  reason: "refunded" | "disputed",
  tx?: Tx,
) {
  const dbase = getDb(tx);
  const revokedRows = await dbase
    .update(productEntitlements)
    .set({
      revokedAt: new Date(),
      revocationReason: reason,
    })
    .where(
      and(
        eq(productEntitlements.sourcePaymentId, sourcePaymentId),
        isNull(productEntitlements.revokedAt),
      ),
    )
    .returning({
      id: productEntitlements.id,
      userId: productEntitlements.userId,
      productId: productEntitlements.productId,
    });

  for (const entitlement of revokedRows) {
    const [fallbackPayment] = await dbase
      .select({ paymentId: payments.paymentId })
      .from(payments)
      .where(
        and(
          eq(payments.userId, entitlement.userId),
          eq(payments.productId, entitlement.productId),
          eq(payments.paymentType, "one_time"),
          eq(payments.status, "succeeded"),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (fallbackPayment) {
      await dbase
        .update(productEntitlements)
        .set({
          sourcePaymentId: fallbackPayment.paymentId,
          revokedAt: null,
          revocationReason: null,
        })
        .where(eq(productEntitlements.id, entitlement.id));
    }
  }

  return revokedRows;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "partially_refunded" | "refunded" | "disputed",
  tx?: Tx,
) {
  const rows = await getDb(tx)
    .update(payments)
    .set({
      status: sql`case
        when ${payments.status} = 'disputed' then ${payments.status}
        when ${payments.status} = 'refunded' and ${status} = 'partially_refunded'
          then ${payments.status}
        else ${status}
      end`,
      updatedAt: new Date(),
    })
    .where(eq(payments.paymentId, paymentId))
    .returning();

  if (rows.length === 0) {
    throw new Error(
      `Payment ${paymentId} is not available for a billing adjustment yet.`,
    );
  }

  return rows;
}

export async function lockPaymentAdjustmentScope(
  paymentReferences: string[],
  tx: Tx,
): Promise<string> {
  const references = [
    ...new Set(paymentReferences.map((value) => value.trim()).filter(Boolean)),
  ];
  if (references.length === 0) {
    throw new Error("A payment reference is required for an adjustment.");
  }

  let payment:
    | { paymentId: string; userId: string; productId: string }
    | undefined;
  for (const reference of references) {
    [payment] = await tx
      .select({
        paymentId: payments.paymentId,
        userId: payments.userId,
        productId: payments.productId,
      })
      .from(payments)
      .where(eq(payments.paymentId, reference))
      .limit(1);
    if (payment) {
      break;
    }
  }

  if (!payment) {
    throw new Error(
      `Payment ${references.join(", ")} is not available for a billing adjustment yet.`,
    );
  }

  await lockBillingProductScope(payment.userId, payment.productId, tx);

  const [lockedPayment] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.paymentId, payment.paymentId))
    .for("update");

  if (!lockedPayment) {
    throw new Error(
      `Payment ${payment.paymentId} is not available for a billing adjustment yet.`,
    );
  }

  return payment.paymentId;
}

export async function lockBillingProductScope(
  userId: string,
  productId: string,
  tx: Tx,
) {
  const lockKey = `${userId.length}:${userId}:${productId}`;
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
  );
}

export async function hasUserProductEntitlement(
  userId: string,
  productId: string,
): Promise<boolean> {
  const [entitlement] = await db
    .select({ id: productEntitlements.id })
    .from(productEntitlements)
    .where(
      and(
        eq(productEntitlements.userId, userId),
        eq(productEntitlements.productId, productId),
        isNull(productEntitlements.revokedAt),
      ),
    )
    .limit(1);

  return Boolean(entitlement);
}

export async function getUserProductEntitlement(
  userId: string,
): Promise<typeof productEntitlements.$inferSelect | null> {
  const rows = await db
    .select()
    .from(productEntitlements)
    .where(
      and(
        eq(productEntitlements.userId, userId),
        isNull(productEntitlements.revokedAt),
      ),
    );

  return (
    rows
      .map((row) => ({
        row,
        tier: getProductTierById(row.productId),
      }))
      .filter(
        (
          item,
        ): item is typeof item & {
          tier: NonNullable<typeof item.tier>;
        } => Boolean(item.tier),
      )
      .sort(
        (left, right) => right.tier.prices.oneTime - left.tier.prices.oneTime,
      )
      .at(0)?.row ?? null
  );
}

export async function findUserByCustomerId(customerId: string, tx?: Tx) {
  const dbase = getDb(tx);
  const result = await dbase
    .select()
    .from(users)
    .where(eq(users.paymentProviderCustomerId, customerId))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserSubscription(
  userId: string,
): Promise<Subscription | null> {
  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt)); // Order by creation date descending for deterministic behavior

  if (!userSubscriptions || userSubscriptions.length === 0) return null;

  // Filter active or trialing subscriptions
  const activeSubscriptions = userSubscriptions.filter(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  let subToReturn: (typeof userSubscriptions)[0] | undefined;

  if (activeSubscriptions.length > 0) {
    // If multiple active/trialing subscriptions exist, log warning and return the most recent one
    if (activeSubscriptions.length > 1) {
      console.warn(
        `User ${userId} has ${activeSubscriptions.length} active/trialing subscriptions. ` +
          `This may indicate a data consistency issue. Returning the most recent one.`,
        {
          userId,
          subscriptionIds: activeSubscriptions.map((s) => s.subscriptionId),
          statuses: activeSubscriptions.map((s) => s.status),
        },
      );
    }
    // Return the most recently created active/trialing subscription
    subToReturn = activeSubscriptions[0]; // Already sorted by createdAt desc
  } else {
    // If no active or trialing subscription, take the most recently created one
    subToReturn = userSubscriptions[0]; // Already sorted by createdAt desc
  }

  if (!subToReturn) return null; // Should not happen if userSubscriptions is not empty

  const tier = getProductTierByProductId(subToReturn.productId);

  return {
    id: subToReturn.id,
    userId: subToReturn.userId,
    customerId: subToReturn.customerId,
    subscriptionId: subToReturn.subscriptionId,
    status: subToReturn.status as SubscriptionStatus,
    tierId: tier?.id || subToReturn.productId, // Fallback to raw product ID if tier mapping is missing
    currentPeriodStart: subToReturn.currentPeriodStart,
    currentPeriodEnd: subToReturn.currentPeriodEnd,
    canceledAt: subToReturn.canceledAt,
  };
}

export async function getUserPayments(userId: string, limit: number = 10) {
  const userPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt)) // Order by creation date descending (newest first)
    .limit(limit);

  return userPayments.map((payment) => {
    let tier = getProductTierByProductId(payment.productId);
    // If tier is not found by Creem's product ID, try to find it by our internal tier ID
    if (!tier) {
      tier = getProductTierById(payment.productId);
    }
    return {
      ...payment,
      tierId: tier?.id || payment.productId,
      tierName: tier?.name || "Unknown Product",
      // Keep amount in cents (original database value)
    };
  });
}

/**
 * Record a webhook event as processed to ensure idempotency
 * @param eventId - Unique identifier from the webhook provider
 * @param eventType - Type of the webhook event
 * @param provider - Webhook provider name (default: 'creem')
 * @param payload - Original webhook payload for debugging
 * @param tx - Optional transaction
 * @returns true when this request claimed the event, false on conflict
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  provider: string = "creem",
  payload?: string,
  tx?: Tx,
): Promise<boolean> {
  const dbase = getDb(tx);
  const inserted = await dbase
    .insert(webhookEvents)
    .values({
      eventId,
      eventType,
      provider,
      payload,
      processed: true,
      processedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.eventId],
    })
    .returning({ id: webhookEvents.id });

  return inserted.length > 0;
}
