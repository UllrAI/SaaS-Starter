import type Stripe from "stripe";
import { eq } from "drizzle-orm";

import { users } from "@/database/tables";
import { getProductTierById } from "@/lib/config/products";
import {
  findUserByCustomerId,
  grantProductEntitlement,
  lockBillingProductScope,
  lockPaymentAdjustmentScope,
  revokeProductEntitlementByPaymentId,
  suspendSubscriptionAccess,
  type Tx,
  updatePaymentStatus,
  upsertPayment,
  upsertSubscription,
} from "@/lib/database/subscription";
import type { PaymentMode, SubscriptionStatus } from "@/types/billing";

import { getStripeEnvironment } from "./client";
import { getProductTierByStripePriceId } from "./prices";

export class InvalidWebhookPayloadError extends Error {
  constructor(message = "Invalid webhook payload.") {
    super(message);
    this.name = "InvalidWebhookPayloadError";
  }
}

function getId(value: string | { id: string } | null | undefined): string {
  const id = typeof value === "string" ? value : value?.id;
  if (!id?.trim()) {
    throw new InvalidWebhookPayloadError("Stripe object reference is missing.");
  }
  return id;
}

function getOptionalId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return getId(value);
}

function parsePaymentMode(value: string | undefined): PaymentMode {
  if (value === "subscription" || value === "one_time") return value;
  throw new InvalidWebhookPayloadError("Payment mode metadata is invalid.");
}

function parseUnixTimestamp(value: number, label: string): Date {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new InvalidWebhookPayloadError(`${label} is invalid.`);
  }
  return new Date(value * 1000);
}

function resolveTier(priceId: string, metadataTierId?: string) {
  const tier = getProductTierByStripePriceId(priceId, getStripeEnvironment());
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Stripe object references an unknown price.",
    );
  }
  if (metadataTierId && metadataTierId !== tier.id) {
    throw new InvalidWebhookPayloadError(
      "Stripe price does not match its tier metadata.",
    );
  }
  return tier;
}

async function resolveUserId(
  customerId: string,
  metadataUserId: string | undefined,
  tx: Tx,
): Promise<string> {
  const userByCustomer = await findUserByCustomerId(customerId, tx);
  if (userByCustomer) {
    if (metadataUserId && metadataUserId !== userByCustomer.id) {
      throw new InvalidWebhookPayloadError(
        "Stripe customer ownership metadata does not match the stored user.",
      );
    }
    return userByCustomer.id;
  }

  if (!metadataUserId?.trim()) {
    throw new InvalidWebhookPayloadError(
      "Stripe event is missing user ownership metadata.",
    );
  }

  const [user] = await tx
    .select({
      id: users.id,
      paymentProviderCustomerId: users.paymentProviderCustomerId,
    })
    .from(users)
    .where(eq(users.id, metadataUserId))
    .limit(1);
  if (!user) {
    throw new InvalidWebhookPayloadError(
      "Stripe event references an unknown user.",
    );
  }
  if (
    user.paymentProviderCustomerId &&
    user.paymentProviderCustomerId !== customerId
  ) {
    throw new InvalidWebhookPayloadError(
      "Stripe event conflicts with the user's stored customer ID.",
    );
  }

  if (!user.paymentProviderCustomerId) {
    await tx
      .update(users)
      .set({ paymentProviderCustomerId: customerId })
      .where(eq(users.id, user.id));
  }
  return user.id;
}

function mapSubscriptionStatus(
  subscription: Stripe.Subscription,
): SubscriptionStatus {
  if (
    subscription.cancel_at_period_end &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    return "scheduled_cancel";
  }

  switch (subscription.status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "trialing":
      return "trialing";
    case "unpaid":
      return "unpaid";
    case "incomplete_expired":
      return "expired";
    default:
      throw new InvalidWebhookPayloadError(
        `Unsupported Stripe subscription status: ${subscription.status}`,
      );
  }
}

function getInvoiceSubscription(invoice: Stripe.Invoice): string | null {
  return getOptionalId(
    invoice.parent?.subscription_details?.subscription ?? null,
  );
}

function getInvoicePriceId(invoice: Stripe.Invoice): string {
  const price = invoice.lines.data.find(
    (line) => line.pricing?.price_details?.price,
  )?.pricing?.price_details?.price;
  return getId(price);
}

function getInvoiceMetadata(invoice: Stripe.Invoice): Stripe.Metadata {
  return (
    invoice.parent?.subscription_details?.metadata ?? invoice.metadata ?? {}
  );
}

export async function processCheckoutSession(
  session: Stripe.Checkout.Session,
  _eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  const customerId = getId(session.customer);
  const metadataUserId = session.metadata?.userId;
  if (
    session.client_reference_id &&
    metadataUserId &&
    session.client_reference_id !== metadataUserId
  ) {
    throw new InvalidWebhookPayloadError(
      "Checkout ownership references do not match.",
    );
  }
  const userId = await resolveUserId(
    customerId,
    session.client_reference_id ?? metadataUserId,
    tx,
  );
  const paymentMode = parsePaymentMode(session.metadata?.paymentMode);
  const tierId = session.metadata?.tierId;
  const tier = tierId ? getProductTierById(tierId) : undefined;
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Checkout is missing valid tier metadata.",
    );
  }

  await lockBillingProductScope(userId, tier.id, tx);

  if (paymentMode === "subscription") {
    getId(session.subscription);
    return;
  }

  const paymentId = getId(session.payment_intent);
  if (session.amount_total === null || !session.currency) {
    throw new InvalidWebhookPayloadError(
      "Paid checkout is missing amount or currency.",
    );
  }
  const [payment] = await upsertPayment(
    {
      userId,
      customerId,
      subscriptionId: null,
      productId: tier.id,
      paymentId,
      amount: session.amount_total,
      currency: session.currency,
      status: "succeeded",
      paymentType: "one_time",
    },
    tx,
  );
  if (payment?.status === "succeeded") {
    await grantProductEntitlement(
      { userId, productId: tier.id, sourcePaymentId: paymentId },
      tx,
    );
  }
}

export async function processSubscription(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const customerId = getId(subscription.customer);
  const userId = await resolveUserId(
    customerId,
    subscription.metadata.userId,
    tx,
  );
  const item = subscription.items.data[0];
  if (!item) {
    throw new InvalidWebhookPayloadError(
      "Stripe subscription has no price item.",
    );
  }
  const tier = resolveTier(item.price.id, subscription.metadata.tierId);

  await lockBillingProductScope(userId, tier.id, tx);
  await upsertSubscription(
    {
      userId,
      customerId,
      subscriptionId: subscription.id,
      productId: tier.id,
      status: mapSubscriptionStatus(subscription),
      currentPeriodStart: parseUnixTimestamp(
        item.current_period_start,
        "subscription.current_period_start",
      ),
      currentPeriodEnd: parseUnixTimestamp(
        item.current_period_end,
        "subscription.current_period_end",
      ),
      canceledAt: subscription.canceled_at
        ? parseUnixTimestamp(
            subscription.canceled_at,
            "subscription.canceled_at",
          )
        : null,
      lastWebhookCreatedAt: eventCreatedAt,
    },
    tx,
  );
}

export async function processInvoice(
  invoice: Stripe.Invoice,
  status: "failed" | "succeeded",
  _eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const subscriptionId = getInvoiceSubscription(invoice);
  if (!subscriptionId) return;

  const customerId = getId(invoice.customer);
  const metadata = getInvoiceMetadata(invoice);
  const userId = await resolveUserId(customerId, metadata.userId, tx);
  const tier = resolveTier(getInvoicePriceId(invoice), metadata.tierId);

  await lockBillingProductScope(userId, tier.id, tx);
  await upsertPayment(
    {
      userId,
      customerId,
      subscriptionId,
      productId: tier.id,
      paymentId: invoice.id,
      amount: status === "succeeded" ? invoice.amount_paid : invoice.amount_due,
      currency: invoice.currency,
      status,
      paymentType: "subscription",
    },
    tx,
  );
}

export async function processRefund(
  charge: Stripe.Charge,
  paymentReferences: string[],
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const paymentId = await lockPaymentAdjustmentScope(paymentReferences, tx);
  const isFullRefund =
    charge.refunded && charge.amount_refunded >= charge.amount;
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

export async function processDispute(
  paymentReferences: string[],
  eventCreatedAt: Date,
  tx: Tx,
): Promise<void> {
  const paymentId = await lockPaymentAdjustmentScope(paymentReferences, tx);
  const [payment] = await updatePaymentStatus(paymentId, "disputed", tx);
  await revokeProductEntitlementByPaymentId(paymentId, "disputed", tx);
  if (payment?.subscriptionId) {
    await suspendSubscriptionAccess(payment.subscriptionId, eventCreatedAt, tx);
  }
}
