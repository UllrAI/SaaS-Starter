import type Stripe from "stripe";

import { getBillingConfig } from "@/lib/config/integrations";
import type { CreateCheckoutOptions } from "@/types/billing";

import type {
  CheckoutStatus,
  CheckoutStatusResult,
  PaymentProvider,
} from "../provider";
import { getStripeClient } from "./client";
import {
  getActiveStripePriceId,
  getStripePriceIds,
  type StripePriceVariant,
} from "./prices";
import { handleStripeWebhook } from "./webhook";

function getCheckoutPriceId(options: CreateCheckoutOptions): string {
  const environment = getBillingConfig().environment;
  if (!getStripePriceIds(options.tierId, environment)) {
    throw new Error(`Pricing tier with id "${options.tierId}" not found.`);
  }

  const variant: StripePriceVariant =
    options.paymentMode === "one_time"
      ? "oneTime"
      : options.billingCycle === "yearly"
        ? "yearly"
        : "monthly";
  const priceId = getActiveStripePriceId(options.tierId, environment, variant);
  if (!priceId) {
    throw new Error(
      `Stripe price ID not found for tier "${options.tierId}" with mode "${options.paymentMode}" and cycle "${options.billingCycle}". Run pnpm stripe:sync-products for the selected environment.`,
    );
  }

  return priceId;
}

function buildSuccessUrl(url: string): string {
  const successUrl = new URL(url);
  const placeholder = "STRIPE_CHECKOUT_SESSION_ID";
  successUrl.searchParams.set("session_id", placeholder);
  return successUrl.toString().replace(placeholder, "{CHECKOUT_SESSION_ID}");
}

function resolveCheckoutStatus(
  session: Stripe.Checkout.Session,
): CheckoutStatus {
  if (session.status === "expired") return "failed";
  if (
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  ) {
    return "success";
  }
  return "pending";
}

const stripeProvider: PaymentProvider = {
  async createCustomer({ userId, email, name }) {
    const customer = await getStripeClient().customers.create(
      {
        email,
        name: name ?? undefined,
        metadata: { userId },
      },
      { idempotencyKey: `billing-customer:${userId}` },
    );
    return { customerId: customer.id };
  },

  async createCheckoutSession(options) {
    if (!options.cancelUrl) {
      throw new Error("A checkout cancel URL is required.");
    }

    const priceId = getCheckoutPriceId(options);
    const metadata = {
      userId: options.userId,
      tierId: options.tierId,
      paymentMode: options.paymentMode,
      billingCycle: options.billingCycle ?? "",
    };
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: options.paymentMode === "subscription" ? "subscription" : "payment",
      customer: options.customerId,
      client_reference_id: options.userId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      success_url: buildSuccessUrl(options.successUrl),
      cancel_url: options.cancelUrl,
    };

    if (options.paymentMode === "subscription") {
      params.subscription_data = { metadata };
    } else {
      params.payment_intent_data = { metadata };
    }

    const session = await getStripeClient().checkout.sessions.create(params, {
      idempotencyKey: `billing-checkout:${options.requestId}`,
    });
    if (!session.url) {
      throw new Error("Stripe returned a checkout session without a URL.");
    }

    return { checkoutUrl: session.url };
  },

  async createCustomerPortalUrl(customerId) {
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
    });
    return { portalUrl: session.url };
  },

  async getCheckoutStatus(checkoutId): Promise<CheckoutStatusResult> {
    const session =
      await getStripeClient().checkout.sessions.retrieve(checkoutId);
    const paymentMode = session.metadata?.paymentMode;

    return {
      status: resolveCheckoutStatus(session),
      ownerId:
        session.client_reference_id ??
        (typeof session.metadata?.userId === "string"
          ? session.metadata.userId
          : null),
      paymentMode:
        paymentMode === "subscription" || paymentMode === "one_time"
          ? paymentMode
          : null,
    };
  },

  async cancelSubscription(subscriptionId, options) {
    if (options.mode === "immediate") {
      await getStripeClient().subscriptions.cancel(subscriptionId);
      return;
    }

    await getStripeClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  },

  async handleWebhook(payload, signature) {
    return handleStripeWebhook(payload, signature);
  },
};

export default stripeProvider;
