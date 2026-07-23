import crypto from "crypto";
import { creemWebhookSecret } from "./client";
import type {
  CreemWebhookPayload,
  CreemCheckoutObject,
  CreemSubscriptionObject,
  CreemPaymentObject,
  SubscriptionStatus,
} from "@/types/billing";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  findUserByCustomerId,
  upsertSubscription,
  upsertPayment,
  recordWebhookEvent,
} from "@/lib/database/subscription";
import type { Tx } from "@/lib/database/subscription";
import { getProductTierByProductId } from "@/lib/config/products";

// --- Helper functions and type guards (no changes here) ---

export class CreemWebhookSignatureError extends Error {
  constructor(message = "Invalid signature.") {
    super(message);
    this.name = "CreemWebhookSignatureError";
  }
}

export class InvalidWebhookPayloadError extends Error {
  constructor(message = "Invalid webhook payload.") {
    super(message);
    this.name = "InvalidWebhookPayloadError";
  }
}

function getCustomerId(
  customerField: string | { id: string } | undefined,
): string {
  if (
    !customerField ||
    (typeof customerField === "string" && customerField.trim().length === 0) ||
    (typeof customerField === "object" &&
      (typeof customerField.id !== "string" ||
        customerField.id.trim().length === 0))
  ) {
    throw new InvalidWebhookPayloadError(
      "Customer field is missing in the webhook event object.",
    );
  }
  return typeof customerField === "string" ? customerField : customerField.id;
}

function isCheckoutObject(obj: unknown): obj is CreemCheckoutObject {
  if (typeof obj !== "object" || obj === null || !("order" in obj)) {
    return false;
  }

  const order = (obj as { order?: unknown }).order;
  const subscription = (obj as { subscription?: unknown }).subscription;
  return (
    typeof order === "object" &&
    order !== null &&
    typeof (order as { id?: unknown }).id === "string" &&
    typeof (order as { transaction?: unknown }).transaction === "string" &&
    typeof (order as { amount_due?: unknown }).amount_due === "number" &&
    typeof (order as { currency?: unknown }).currency === "string" &&
    (subscription == null || isCheckoutSubscriptionObject(subscription))
  );
}

const subscriptionStatuses = new Set<SubscriptionStatus>([
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "paused",
  "scheduled_cancel",
  "trialing",
  "incomplete",
]);

function isIdReference(value: unknown): value is string | { id: string } {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "object" &&
      value !== null &&
      typeof (value as { id?: unknown }).id === "string" &&
      (value as { id: string }).id.trim().length > 0)
  );
}

function isSubscriptionObject(obj: unknown): obj is CreemSubscriptionObject {
  return (
    typeof obj === "object" &&
    obj !== null &&
    isIdReference((obj as { customer?: unknown }).customer) &&
    isIdReference((obj as { product?: unknown }).product) &&
    typeof (obj as { status?: unknown }).status === "string" &&
    subscriptionStatuses.has((obj as { status: SubscriptionStatus }).status)
  );
}

function isCheckoutSubscriptionObject(
  obj: unknown,
): obj is CreemSubscriptionObject {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as { id?: unknown }).id === "string" &&
    isIdReference((obj as { product?: unknown }).product) &&
    typeof (obj as { status?: unknown }).status === "string" &&
    subscriptionStatuses.has((obj as { status: SubscriptionStatus }).status)
  );
}

function isPaymentObject(obj: unknown): obj is CreemPaymentObject {
  return (
    typeof obj === "object" &&
    obj !== null &&
    isIdReference((obj as { customer?: unknown }).customer) &&
    (typeof (obj as { amount?: unknown }).amount === "number" ||
      typeof (obj as { amount_paid?: unknown }).amount_paid === "number")
  );
}

function parseCreemWebhookPayload(payload: string): CreemWebhookPayload {
  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    throw new InvalidWebhookPayloadError();
  }

  if (!event || typeof event !== "object") {
    throw new InvalidWebhookPayloadError();
  }

  const candidate = event as Partial<CreemWebhookPayload>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.eventType !== "string" ||
    typeof candidate.created_at !== "number" ||
    !Number.isFinite(candidate.created_at) ||
    !candidate.object ||
    typeof candidate.object !== "object" ||
    typeof candidate.object.id !== "string" ||
    candidate.object.id.trim().length === 0
  ) {
    throw new InvalidWebhookPayloadError();
  }

  return candidate as CreemWebhookPayload;
}

function toWebhookCreatedAt(timestamp: number): Date {
  // Creem sends Unix milliseconds; accept seconds for older integrations.
  const milliseconds =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const createdAt = new Date(milliseconds);
  if (Number.isNaN(createdAt.getTime())) {
    throw new InvalidWebhookPayloadError();
  }
  return createdAt;
}

function invalidEventObject(eventType: string): never {
  throw new InvalidWebhookPayloadError(
    `Invalid object for Creem webhook event type ${eventType}.`,
  );
}

function parseWebhookDate(value: unknown, fieldName: string): Date {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidWebhookPayloadError(
      `Invalid ${fieldName} in Creem webhook payload.`,
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidWebhookPayloadError(
      `Invalid ${fieldName} in Creem webhook payload.`,
    );
  }
  return date;
}

function parseOptionalWebhookDate(
  value: unknown,
  fieldName: string,
): Date | undefined {
  return value === undefined ? undefined : parseWebhookDate(value, fieldName);
}

function parseUnixSecondsDate(value: unknown, fieldName: string): Date {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InvalidWebhookPayloadError(
      `Invalid ${fieldName} in Creem webhook payload.`,
    );
  }

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidWebhookPayloadError(
      `Invalid ${fieldName} in Creem webhook payload.`,
    );
  }
  return date;
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
    throw new CreemWebhookSignatureError();
  }

  const event = parseCreemWebhookPayload(payload);
  console.log(`Received valid Creem webhook: ${event.eventType}`);

  const eventId = event.id.trim();
  const eventCreatedAt = toWebhookCreatedAt(event.created_at);

  await db.transaction(async (tx) => {
    // Claim the event atomically. A conflicting insert means another request
    // already owns or completed the same event.
    const claimed = await recordWebhookEvent(
      eventId,
      event.eventType,
      "creem",
      payload,
      tx,
    );
    if (!claimed) {
      console.log(`Webhook event ${eventId} already processed, skipping.`);
      return;
    }

    const eventObject = event.object;
    switch (event.eventType) {
      case "checkout.completed":
        if (!isCheckoutObject(eventObject)) {
          invalidEventObject(event.eventType);
        }
        await processCheckoutCompletedEvent(eventObject, eventCreatedAt, tx);
        break;
      case "payment.succeeded":
        if (!isPaymentObject(eventObject)) {
          invalidEventObject(event.eventType);
        }
        if (eventObject.billing_reason === "subscription_cycle") {
          await processSubscriptionRenewal(eventObject, eventCreatedAt, tx);
        } else {
          await processPaymentSucceededEvent(eventObject, tx);
        }
        break;

      case "subscription.active":
      case "subscription.trialing":
      case "subscription.update":
      case "subscription.canceled":
      case "subscription.scheduled_cancel":
      case "subscription.expired":
      case "subscription.unpaid":
      case "subscription.past_due":
      case "subscription.paused":
        if (!isSubscriptionObject(eventObject)) {
          invalidEventObject(event.eventType);
        }
        await processSubscriptionEvent(eventObject, eventCreatedAt, tx);
        break;

      case "subscription.paid":
        if (
          !isSubscriptionObject(eventObject) &&
          !isPaymentObject(eventObject)
        ) {
          invalidEventObject(event.eventType);
        }
        await processSubscriptionRenewal(eventObject, eventCreatedAt, tx);
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
  eventCreatedAt: Date,
  tx: Tx,
) {
  const {
    subscription,
    customer: customerField,
    metadata,
    order,
  } = checkoutData;
  if (!customerField || !order) {
    throw new InvalidWebhookPayloadError(
      "checkout.completed event is missing required data objects (customer or order).",
    );
  }
  const userId = metadata?.userId as string | undefined;
  if (!userId) {
    throw new InvalidWebhookPayloadError(
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
        currentPeriodStart: parseOptionalWebhookDate(
          subscription.current_period_start_date,
          "subscription.current_period_start_date",
        ),
        currentPeriodEnd: parseOptionalWebhookDate(
          subscription.current_period_end_date,
          "subscription.current_period_end_date",
        ),
        canceledAt:
          subscription.canceled_at === undefined
            ? undefined
            : subscription.canceled_at
              ? parseWebhookDate(
                  subscription.canceled_at,
                  "subscription.canceled_at",
                )
              : null,
        lastWebhookCreatedAt: eventCreatedAt,
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
    throw new InvalidWebhookPayloadError(
      `Unsupported payment mode: ${paymentMode} or missing subscription data for subscription mode`,
    );
  }
}

async function processSubscriptionEvent(
  subscriptionData: CreemSubscriptionObject,
  eventCreatedAt: Date,
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
      currentPeriodStart: parseOptionalWebhookDate(
        subscriptionData.current_period_start_date,
        "subscription.current_period_start_date",
      ),
      currentPeriodEnd: parseOptionalWebhookDate(
        subscriptionData.current_period_end_date,
        "subscription.current_period_end_date",
      ),
      canceledAt:
        subscriptionData.canceled_at === undefined
          ? undefined
          : subscriptionData.canceled_at
            ? parseWebhookDate(
                subscriptionData.canceled_at,
                "subscription.canceled_at",
              )
            : null,
      lastWebhookCreatedAt: eventCreatedAt,
    },
    tx,
  );
}

async function processSubscriptionRenewal(
  renewalData: CreemPaymentObject | CreemSubscriptionObject,
  eventCreatedAt: Date,
  tx: Tx,
) {
  const customerId = getCustomerId(renewalData.customer);
  const subscriptionId =
    "subscription_id" in renewalData && renewalData.subscription_id
      ? renewalData.subscription_id
      : renewalData.id;

  if (!subscriptionId)
    throw new InvalidWebhookPayloadError(
      "Subscription ID missing in renewal event",
    );

  const user = await findUserByCustomerId(customerId, tx);
  if (!user)
    throw new Error(
      `User not found for customerId ${customerId} during subscription renewal.`,
    );

  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;

  if (isPaymentObject(renewalData) && renewalData.lines?.data?.[0]?.period) {
    currentPeriodStart = parseUnixSecondsDate(
      renewalData.lines.data[0].period.start,
      "payment.lines[0].period.start",
    );
    currentPeriodEnd = parseUnixSecondsDate(
      renewalData.lines.data[0].period.end,
      "payment.lines[0].period.end",
    );
  } else if (isSubscriptionObject(renewalData)) {
    if (
      !renewalData.current_period_start_date ||
      !renewalData.current_period_end_date
    ) {
      throw new InvalidWebhookPayloadError(
        "Subscription renewal is missing its billing period.",
      );
    }
    currentPeriodStart = parseWebhookDate(
      renewalData.current_period_start_date,
      "subscription.current_period_start_date",
    );
    currentPeriodEnd = parseWebhookDate(
      renewalData.current_period_end_date,
      "subscription.current_period_end_date",
    );
  } else {
    throw new InvalidWebhookPayloadError(
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
  if (!productId)
    throw new InvalidWebhookPayloadError("Product ID missing in renewal event");

  const tier = getProductTierByProductId(productId);

  await upsertSubscription(
    {
      userId: user.id,
      customerId,
      subscriptionId,
      productId: tier?.id || productId,
      status: "active",
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt: null,
      lastWebhookCreatedAt: eventCreatedAt,
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
  if (!productId)
    throw new InvalidWebhookPayloadError("Product ID missing in payment event");

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
