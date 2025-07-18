import crypto from "crypto";
import { creemWebhookSecret } from "./client";
import type {
  CreemWebhookPayload,
  CreemCheckoutObject,
  CreemSubscriptionObject,
  CreemPaymentObject,
} from "@/types/billing";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  findUserByCustomerId,
  upsertSubscription,
  upsertPayment,
  isWebhookEventProcessed,
  recordWebhookEvent,
} from "@/lib/database/subscription";
import type { Tx } from "@/lib/database/subscription";
import { getProductTierByProductId } from "@/lib/config/products";

// --- Helper functions and type guards (no changes here) ---

function getCustomerId(
  customerField: string | { id: string } | undefined,
): string {
  if (!customerField) {
    throw new Error("Customer field is missing in the webhook event object.");
  }
  return typeof customerField === "string" ? customerField : customerField.id;
}

function isCheckoutObject(obj: unknown): obj is CreemCheckoutObject {
  return typeof obj === "object" && obj !== null && "order" in obj;
}
function isSubscriptionObject(obj: unknown): obj is CreemSubscriptionObject {
  return (
    typeof obj === "object" && obj !== null && "current_period_end_date" in obj
  );
}
function isPaymentObject(obj: unknown): obj is CreemPaymentObject {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("amount" in obj || "amount_paid" in obj)
  );
}

function verifyCreemSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch (error) {
    console.warn(
      "Error during signature comparison (likely non-matching lengths):",
      error,
    );
    return false;
  }
}

export async function handleCreemWebhook(payload: string, signature: string) {
  if (!creemWebhookSecret) {
    console.error("Creem webhook secret is not configured.");
    throw new Error("Server configuration error: Webhook secret missing.");
  }

  const isValid = verifyCreemSignature(payload, signature, creemWebhookSecret);
  if (!isValid) {
    console.warn("Invalid webhook signature received.");
    throw new Error("Invalid signature.");
  }

  const event: CreemWebhookPayload = JSON.parse(payload);
  console.log(`Received valid Creem webhook: ${event.eventType}`);

  // Generate a unique event ID for idempotency
  // Use event object ID + event type as the unique identifier
  const eventId = `${event.object.id}_${event.eventType}`;

  await db.transaction(async (tx) => {
    // Check if this event has already been processed
    const alreadyProcessed = await isWebhookEventProcessed(
      eventId,
      "creem",
      tx,
    );
    if (alreadyProcessed) {
      console.log(`Webhook event ${eventId} already processed, skipping.`);
      return;
    }

    // Record the event as being processed (before actual processing to prevent race conditions)
    await recordWebhookEvent(eventId, event.eventType, "creem", payload, tx);

    const eventObject = event.object;
    switch (event.eventType) {
      case "checkout.completed":
        if (isCheckoutObject(eventObject))
          await processCheckoutCompletedEvent(eventObject, tx);
        break;
      case "payment.succeeded":
        if (
          isPaymentObject(eventObject) &&
          eventObject.billing_reason === "subscription_cycle"
        ) {
          await processSubscriptionRenewal(eventObject, tx);
        } else if (isPaymentObject(eventObject)) {
          await processPaymentSucceededEvent(eventObject, tx);
        }
        break;

      case "subscription.active":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.expired":
      case "subscription.past_due":
        if (isSubscriptionObject(eventObject))
          await processSubscriptionEvent(eventObject, tx);
        break;

      case "subscription.paid":
        if (isSubscriptionObject(eventObject) || isPaymentObject(eventObject)) {
          await processSubscriptionRenewal(eventObject, tx);
        }
        break;
      default:
        console.log(
          `Ignoring unhandled Creem webhook event type: ${event.eventType}`,
        );
    }
  });

  return { received: true };
}

async function processCheckoutCompletedEvent(
  checkoutData: CreemCheckoutObject,
  tx: Tx,
) {
  const {
    subscription,
    customer: customerField,
    metadata,
    order,
  } = checkoutData;
  if (!customerField || !order) {
    throw new Error(
      "checkout.completed event is missing required data objects (customer or order).",
    );
  }
  const userId = metadata?.userId as string | undefined;
  if (!userId) {
    throw new Error(
      `userId not found in metadata for checkout ${checkoutData.id}`,
    );
  }

  const customerId = getCustomerId(customerField);
  await tx
    .update(users)
    .set({ paymentProviderCustomerId: customerId })
    .where(eq(users.id, userId));

  const paymentMode = metadata?.paymentMode || "subscription";

  // Handle subscription-based purchases
  if (subscription && paymentMode === "subscription") {
    const productId =
      typeof subscription.product === "string"
        ? subscription.product
        : subscription.product.id;
    const tier = getProductTierByProductId(productId);

    await upsertSubscription(
      {
        userId,
        customerId,
        subscriptionId: subscription.id,
        productId: tier?.id || productId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start_date),
        currentPeriodEnd: new Date(subscription.current_period_end_date),
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at)
          : null,
      },
      tx,
    );

    await upsertPayment(
      {
        userId,
        customerId,
        subscriptionId: subscription.id,
        productId: tier?.id || productId,
        paymentId: order.transaction,
        amount: order.amount_due,
        currency: order.currency,
        status: "succeeded",
        paymentType: paymentMode,
      },
      tx,
    );
  }
  // Handle one_time purchases
  else if (paymentMode === "one_time") {
    // For one_time purchases, we need to get the product ID from metadata or order
    const productId = metadata?.tierId || order.id; // Fallback to order ID if no tierId
    const tier = getProductTierByProductId(productId);

    // Create a one_time payment record
    await upsertPayment(
      {
        userId,
        customerId,
        subscriptionId: null, // No subscription for one_time purchases
        productId: tier?.id || productId,
        paymentId: order.transaction,
        amount: order.amount_due,
        currency: order.currency,
        status: "succeeded",
        paymentType: "one_time", // Normalize to one_time format
      },
      tx,
    );
  } else {
    throw new Error(
      `Unsupported payment mode: ${paymentMode} or missing subscription data for subscription mode`,
    );
  }
}

async function processSubscriptionEvent(
  subscriptionData: CreemSubscriptionObject,
  tx: Tx,
) {
  const customerId = getCustomerId(subscriptionData.customer);
  const user = await findUserByCustomerId(customerId, tx);
  if (!user)
    throw new Error(
      `User not found for customerId ${customerId} on subscription event.`,
    );

  const productId =
    typeof subscriptionData.product === "string"
      ? subscriptionData.product
      : subscriptionData.product.id;
  const tier = getProductTierByProductId(productId);

  await upsertSubscription(
    {
      userId: user.id,
      customerId,
      subscriptionId: subscriptionData.id,
      productId: tier?.id || productId,
      status: subscriptionData.status,
      currentPeriodStart: new Date(subscriptionData.current_period_start_date),
      currentPeriodEnd: new Date(subscriptionData.current_period_end_date),
      canceledAt: subscriptionData.canceled_at
        ? new Date(subscriptionData.canceled_at)
        : null,
    },
    tx,
  );
}

async function processSubscriptionRenewal(
  renewalData: CreemPaymentObject | CreemSubscriptionObject,
  tx: Tx,
) {
  const customerId = getCustomerId(renewalData.customer);
  const subscriptionId =
    "subscription_id" in renewalData && renewalData.subscription_id
      ? renewalData.subscription_id
      : renewalData.id;

  if (!subscriptionId)
    throw new Error("Subscription ID missing in renewal event");

  const user = await findUserByCustomerId(customerId, tx);
  if (!user)
    throw new Error(
      `User not found for customerId ${customerId} during subscription renewal.`,
    );

  let periodStartDateStr: string, periodEndDateStr: string;

  if (isPaymentObject(renewalData) && renewalData.lines?.data?.[0]?.period) {
    periodStartDateStr = new Date(
      renewalData.lines.data[0].period.start * 1000,
    ).toISOString();
    periodEndDateStr = new Date(
      renewalData.lines.data[0].period.end * 1000,
    ).toISOString();
  } else if (isSubscriptionObject(renewalData)) {
    periodStartDateStr = renewalData.current_period_start_date;
    periodEndDateStr = renewalData.current_period_end_date;
  } else {
    throw new Error(
      "Could not determine new period for subscription renewal from event object.",
    );
  }

  let productId: string;
  if (isPaymentObject(renewalData)) {
    productId =
      renewalData.product_id ||
      (renewalData.lines?.data?.[0]?.price?.product ?? "");
  } else {
    // isSubscriptionObject
    productId =
      typeof renewalData.product === "string"
        ? renewalData.product
        : renewalData.product.id;
  }
  if (!productId) throw new Error("Product ID missing in renewal event");

  const tier = getProductTierByProductId(productId);

  await upsertSubscription(
    {
      userId: user.id,
      customerId,
      subscriptionId,
      productId: tier?.id || productId,
      status: "active",
      currentPeriodStart: new Date(periodStartDateStr),
      currentPeriodEnd: new Date(periodEndDateStr),
      canceledAt: null,
    },
    tx,
  );

  if (isPaymentObject(renewalData)) {
    await processPaymentSucceededEvent(renewalData, tx);
  }
}

async function processPaymentSucceededEvent(
  paymentData: CreemPaymentObject,
  tx: Tx,
) {
  const customerId = getCustomerId(paymentData.customer);
  const user = await findUserByCustomerId(customerId, tx);
  if (!user)
    throw new Error(
      `User not found for customerId ${customerId} during payment processing.`,
    );

  const productId =
    paymentData.product_id || paymentData.lines?.data?.[0]?.price?.product;
  if (!productId) throw new Error("Product ID missing in payment event");

  const tier = getProductTierByProductId(productId);

  await upsertPayment(
    {
      userId: user.id,
      customerId,
      subscriptionId: paymentData.subscription_id || paymentData.subscription,
      productId: tier?.id || productId,
      paymentId: paymentData.id,
      amount: paymentData.amount ?? paymentData.amount_paid ?? 0,
      currency: paymentData.currency ?? "usd",
      status: "succeeded",
      paymentType:
        (paymentData.metadata?.paymentMode as string) || "subscription",
    },
    tx,
  );
}
