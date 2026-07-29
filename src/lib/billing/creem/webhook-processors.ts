import { eq } from "drizzle-orm";

import { users } from "@/database/schema";
import { getProductTierById } from "@/lib/config/products";
import {
  findUserByCustomerId,
  grantProductEntitlement,
  lockBillingProductScope,
  lockPaymentAdjustmentScope,
  revokeProductEntitlementByPaymentId,
  suspendSubscriptionAccess,
  updatePaymentStatus,
  upsertPayment,
  upsertSubscription,
  type Tx,
} from "@/lib/database/subscription";
import type {
  CreemCheckoutObject,
  CreemDisputeObject,
  CreemPaymentObject,
  CreemRefundObject,
  CreemSubscriptionObject,
  PaymentMode,
} from "@/types/billing";

import { getCreemEnvironment } from "./client";
import {
  getCustomerId,
  InvalidWebhookPayloadError,
  isIdReference,
  isPaymentObject,
  isSubscriptionObject,
  parseOptionalWebhookDate,
  parseUnixSecondsDate,
  parseWebhookDate,
} from "./webhook-payload";
import { getCreemProductIds, getProductTierByCreemProductId } from "./products";

function resolvePaymentMode(value: unknown): PaymentMode {
  if (value === undefined) return "subscription";
  if (value === "subscription" || value === "one_time") return value;
  throw new InvalidWebhookPayloadError(`Unsupported payment mode: ${value}`);
}

export async function processCheckoutCompletedEvent(
  checkoutData: CreemCheckoutObject,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
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

  const userId =
    typeof metadata?.userId === "string" ? metadata.userId.trim() : "";
  if (!userId) {
    throw new InvalidWebhookPayloadError(
      `userId not found in metadata for checkout ${checkoutData.id}`,
    );
  }

  const customerId = getCustomerId(customerField);
  const paymentId = order.transaction?.trim() || order.id.trim();
  const amount = order.amount_due ?? order.amount;
  await tx
    .update(users)
    .set({ paymentProviderCustomerId: customerId })
    .where(eq(users.id, userId));

  const paymentMode = resolvePaymentMode(metadata?.paymentMode);

  if (subscription && paymentMode === "subscription") {
    const productId =
      typeof subscription.product === "string"
        ? subscription.product
        : subscription.product.id;
    const tier = getProductTierByCreemProductId(
      productId,
      getCreemEnvironment(),
    );
    if (!tier) {
      throw new InvalidWebhookPayloadError(
        "Subscription references an unknown Creem product.",
      );
    }

    await lockBillingProductScope(userId, tier.id, tx);
    await upsertSubscription(
      {
        userId,
        customerId,
        subscriptionId: subscription.id,
        productId: tier.id,
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
        productId: tier.id,
        paymentId,
        amount,
        currency: order.currency,
        status: "succeeded",
        paymentType: paymentMode,
      },
      tx,
    );
    return;
  }

  if (paymentMode === "one_time") {
    const tierId =
      typeof metadata?.tierId === "string" ? metadata.tierId : undefined;
    const tier = tierId ? getProductTierById(tierId) : undefined;
    if (!tier) {
      throw new InvalidWebhookPayloadError(
        "One-time checkout is missing a valid tierId.",
      );
    }
    if (!isIdReference(checkoutData.product)) {
      throw new InvalidWebhookPayloadError(
        "One-time checkout is missing a valid product.",
      );
    }

    const checkoutProductId =
      typeof checkoutData.product === "string"
        ? checkoutData.product
        : checkoutData.product.id;
    if (
      checkoutProductId !==
      getCreemProductIds(tier.id, getCreemEnvironment())?.oneTime
    ) {
      throw new InvalidWebhookPayloadError(
        "One-time checkout product does not match its tier metadata.",
      );
    }

    await lockBillingProductScope(userId, tier.id, tx);
    const [payment] = await upsertPayment(
      {
        userId,
        customerId,
        subscriptionId: null,
        productId: tier.id,
        paymentId,
        amount,
        currency: order.currency,
        status: "succeeded",
        paymentType: "one_time",
      },
      tx,
    );

    if (payment?.status === "succeeded") {
      await grantProductEntitlement(
        {
          userId,
          productId: tier.id,
          sourcePaymentId: paymentId,
        },
        tx,
      );
    }
    return;
  }

  throw new InvalidWebhookPayloadError(
    `Unsupported payment mode: ${paymentMode} or missing subscription data for subscription mode`,
  );
}

export async function processRefundCreatedEvent(
  refundData: CreemRefundObject,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  if (refundData.status !== "succeeded") {
    return;
  }

  const paymentId = await lockPaymentAdjustmentScope(
    [refundData.transaction.id, refundData.transaction.order].filter(
      (reference): reference is string => Boolean(reference),
    ),
    tx,
  );
  const refundedAmount =
    refundData.transaction.refunded_amount ?? refundData.refund_amount;
  const paidAmount =
    refundData.transaction.amount_paid ?? refundData.transaction.amount;
  const isFullRefund =
    refundData.transaction.status === "refunded" &&
    refundedAmount >= paidAmount;

  const [payment] = await updatePaymentStatus(
    paymentId,
    isFullRefund ? "refunded" : "partially_refunded",
    tx,
  );
  if (isFullRefund) {
    await revokeProductEntitlementByPaymentId(paymentId, "refunded", tx);
    if (payment?.subscriptionId) {
      await suspendSubscriptionAccess(
        payment.subscriptionId,
        eventCreatedAt,
        tx,
      );
    }
  }
}

export async function processDisputeCreatedEvent(
  disputeData: CreemDisputeObject,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const paymentId = await lockPaymentAdjustmentScope(
    [disputeData.transaction.id, disputeData.transaction.order].filter(
      (reference): reference is string => Boolean(reference),
    ),
    tx,
  );
  const [payment] = await updatePaymentStatus(paymentId, "disputed", tx);
  await revokeProductEntitlementByPaymentId(paymentId, "disputed", tx);
  if (payment?.subscriptionId) {
    await suspendSubscriptionAccess(payment.subscriptionId, eventCreatedAt, tx);
  }
}

export async function processSubscriptionEvent(
  subscriptionData: CreemSubscriptionObject,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const customerId = getCustomerId(subscriptionData.customer);
  const user = await findUserByCustomerId(customerId, tx);
  if (!user) {
    throw new Error(
      `User not found for customerId ${customerId} on subscription event.`,
    );
  }

  const productId =
    typeof subscriptionData.product === "string"
      ? subscriptionData.product
      : subscriptionData.product.id;
  const tier = getProductTierByCreemProductId(productId, getCreemEnvironment());
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Subscription references an unknown Creem product.",
    );
  }

  await lockBillingProductScope(user.id, tier.id, tx);
  await upsertSubscription(
    {
      userId: user.id,
      customerId,
      subscriptionId: subscriptionData.id,
      productId: tier.id,
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

export async function processSubscriptionRenewal(
  renewalData: CreemPaymentObject | CreemSubscriptionObject,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const customerId = getCustomerId(renewalData.customer);
  const subscriptionId =
    "subscription_id" in renewalData && renewalData.subscription_id
      ? renewalData.subscription_id
      : renewalData.id;

  if (!subscriptionId) {
    throw new InvalidWebhookPayloadError(
      "Subscription ID missing in renewal event",
    );
  }

  const user = await findUserByCustomerId(customerId, tx);
  if (!user) {
    throw new Error(
      `User not found for customerId ${customerId} during subscription renewal.`,
    );
  }

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
    productId =
      typeof renewalData.product === "string"
        ? renewalData.product
        : renewalData.product.id;
  }
  if (!productId) {
    throw new InvalidWebhookPayloadError("Product ID missing in renewal event");
  }

  const tier = getProductTierByCreemProductId(productId, getCreemEnvironment());
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Subscription renewal references an unknown Creem product.",
    );
  }

  await lockBillingProductScope(user.id, tier.id, tx);
  await upsertSubscription(
    {
      userId: user.id,
      customerId,
      subscriptionId,
      productId: tier.id,
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

export async function processPaymentSucceededEvent(
  paymentData: CreemPaymentObject,
  tx: Tx,
): Promise<void> {
  const customerId = getCustomerId(paymentData.customer);
  const user = await findUserByCustomerId(customerId, tx);
  if (!user) {
    throw new Error(
      `User not found for customerId ${customerId} during payment processing.`,
    );
  }

  const productId =
    paymentData.product_id || paymentData.lines?.data?.[0]?.price?.product;
  if (!productId) {
    throw new InvalidWebhookPayloadError("Product ID missing in payment event");
  }

  const tier = getProductTierByCreemProductId(productId, getCreemEnvironment());
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Payment references an unknown Creem product.",
    );
  }

  await upsertPayment(
    {
      userId: user.id,
      customerId,
      subscriptionId: paymentData.subscription_id || paymentData.subscription,
      productId: tier.id,
      paymentId: paymentData.id,
      amount: paymentData.amount ?? paymentData.amount_paid ?? 0,
      currency: paymentData.currency ?? "usd",
      status: "succeeded",
      paymentType: resolvePaymentMode(paymentData.metadata?.paymentMode),
    },
    tx,
  );
}
