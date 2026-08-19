import type Stripe from "stripe";
import { and, eq, isNull } from "drizzle-orm";

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
import { getProductTierByStripeProductId } from "./prices";

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

function resolveTier(productId: string, metadataTierId?: string) {
  const tier = getProductTierByStripeProductId(
    productId,
    getStripeEnvironment(),
  );
  if (!tier) {
    throw new InvalidWebhookPayloadError(
      "Stripe object references an unknown product.",
    );
  }
  // The Product is the stable tier identity. Subscription metadata is only a
  // checkout-time snapshot and can become stale after a portal plan switch.
  if (metadataTierId && metadataTierId !== tier.id) {
    console.warn("[Stripe Webhook] Tier metadata is stale.", {
      productId,
      metadataTierId,
      resolvedTierId: tier.id,
    });
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
  if (user.paymentProviderCustomerId !== customerId) {
    if (user.paymentProviderCustomerId) {
      throw new InvalidWebhookPayloadError(
        "Stripe customer ownership does not match the stored customer.",
      );
    }

    const claimed = await tx
      .update(users)
      .set({ paymentProviderCustomerId: customerId })
      .where(
        and(eq(users.id, user.id), isNull(users.paymentProviderCustomerId)),
      )
      .returning({ id: users.id });
    if (claimed.length === 0) {
      throw new InvalidWebhookPayloadError(
        "Stripe customer ownership changed while processing the event.",
      );
    }
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

function getPriceProductId(price: Stripe.Price): string {
  return getId(price.product);
}

function getInvoiceProductId(invoice: Stripe.Invoice): string {
  const subscriptionId = getInvoiceSubscription(invoice);
  const candidates: Array<{
    productId: string;
    amount: number;
    proration: boolean;
  }> = [];
  for (const line of invoice.lines.data) {
    const details = line.pricing?.price_details;
    const lineSubscription =
      line.parent?.subscription_item_details?.subscription ??
      line.parent?.invoice_item_details?.subscription ??
      getOptionalId(line.subscription);
    if (!details?.product) continue;
    if (lineSubscription && lineSubscription !== subscriptionId) continue;
    candidates.push({
      productId: details.product,
      amount: line.amount,
      proration:
        line.parent?.subscription_item_details?.proration ??
        line.parent?.invoice_item_details?.proration ??
        false,
    });
  }

  const uniqueProduct = (entries: typeof candidates): string | undefined => {
    const productIds = new Set(entries.map(({ productId }) => productId));
    return productIds.size === 1 ? [...productIds][0] : undefined;
  };
  const productId =
    uniqueProduct(candidates.filter(({ proration }) => !proration)) ??
    uniqueProduct(candidates.filter(({ amount }) => amount > 0)) ??
    uniqueProduct(candidates);
  if (!productId) {
    throw new InvalidWebhookPayloadError(
      "Stripe invoice does not resolve to exactly one subscription product.",
    );
  }
  return productId;
}

function getInvoiceMetadata(invoice: Stripe.Invoice): Stripe.Metadata {
  return (
    invoice.parent?.subscription_details?.metadata ?? invoice.metadata ?? {}
  );
}

function getInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  for (const payment of invoice.payments?.data ?? []) {
    if (payment.payment.type !== "payment_intent") continue;
    const paymentIntentId = getOptionalId(payment.payment.payment_intent);
    if (paymentIntentId) return paymentIntentId;
  }
  return null;
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

  // Stripe skips the PaymentIntent when nothing is charged, e.g. a 100% off
  // coupon, so fall back to the session as the payment reference.
  const paymentId = getOptionalId(session.payment_intent) ?? getId(session.id);
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
      paymentIntentId: getOptionalId(session.payment_intent),
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
  if (subscription.items.data.length !== 1) {
    throw new InvalidWebhookPayloadError(
      "Stripe subscription must contain exactly one price item.",
    );
  }
  const tier = resolveTier(
    getPriceProductId(item.price),
    subscription.metadata.tierId,
  );

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
  paymentIntentId?: string | null,
): Promise<void> {
  const subscriptionId = getInvoiceSubscription(invoice);
  if (!subscriptionId) return;

  const customerId = getId(invoice.customer);
  const metadata = getInvoiceMetadata(invoice);
  const userId = await resolveUserId(customerId, metadata.userId, tx);
  const tier = resolveTier(getInvoiceProductId(invoice), metadata.tierId);

  await lockBillingProductScope(userId, tier.id, tx);
  await upsertPayment(
    {
      userId,
      customerId,
      subscriptionId,
      productId: tier.id,
      paymentId: invoice.id,
      paymentIntentId: paymentIntentId ?? getInvoicePaymentIntentId(invoice),
      // `amount_due` is fixed at finalization and identical across the failed
      // and paid events for one invoice. `amount_paid` would differ and trip
      // the immutable-payment guard on retry.
      amount: invoice.amount_due,
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
