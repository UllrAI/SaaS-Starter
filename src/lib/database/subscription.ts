import { db } from "@/database";
import * as schema from "@/database/schema";
import {
  subscriptions,
  payments,
  users,
  webhookEvents,
} from "@/database/tables";
import { eq, desc, and } from "drizzle-orm"; // Added desc for descending order
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
        updatedAt: now,
      },
    })
    .returning();
}

export async function upsertPayment(data: UpsertPaymentData, tx?: Tx) {
  const dbase = getDb(tx);
  const now = new Date();

  return dbase
    .insert(payments)
    .values({ ...data, updatedAt: now })
    .onConflictDoUpdate({
      target: payments.paymentId,
      set: {
        status: data.status,
        updatedAt: now,
      },
    })
    .returning();
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
 * Check if a webhook event has already been processed
 * @param eventId - Unique identifier from the webhook provider
 * @param provider - Webhook provider name (default: 'creem')
 * @param tx - Optional transaction
 * @returns true if event was already processed, false otherwise
 */
export async function isWebhookEventProcessed(
  eventId: string,
  provider: string = "creem",
  tx?: Tx,
): Promise<boolean> {
  const dbase = getDb(tx);
  const result = await dbase
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.eventId, eventId),
        eq(webhookEvents.provider, provider),
      ),
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Record a webhook event as processed to ensure idempotency
 * @param eventId - Unique identifier from the webhook provider
 * @param eventType - Type of the webhook event
 * @param provider - Webhook provider name (default: 'creem')
 * @param payload - Original webhook payload for debugging
 * @param tx - Optional transaction
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  provider: string = "creem",
  payload?: string,
  tx?: Tx,
): Promise<void> {
  const dbase = getDb(tx);
  await dbase
    .insert(webhookEvents)
    .values({
      eventId,
      eventType,
      provider,
      payload,
      processed: true,
      processedAt: new Date(),
    })
    .onConflictDoNothing(); // Ignore if already exists
}
