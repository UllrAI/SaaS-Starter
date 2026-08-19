import type Stripe from "stripe";

import { db } from "@/database";
import { getBillingConfig } from "@/lib/config/integrations";
import {
  claimWebhookEvent,
  isWebhookEventProcessed,
  type Tx,
} from "@/lib/database/subscription";

import { MIN_SUPPORTED_API_DATE } from "./api-version";
import { getStripeClient } from "./client";
import { logStripeWebhook } from "./webhook-log";
import {
  InvalidWebhookPayloadError,
  processCheckoutSession,
  processDispute,
  processInvoice,
  processRefund,
  processSubscription,
} from "./webhook-processors";

export class StripeWebhookSignatureError extends Error {
  constructor(message = "Invalid signature.") {
    super(message);
    this.name = "StripeWebhookSignatureError";
  }
}

export class StripeWebhookEnvironmentError extends Error {
  constructor() {
    super("Webhook event mode does not match STRIPE_ENVIRONMENT.");
    this.name = "StripeWebhookEnvironmentError";
  }
}

export class StripeWebhookApiVersionError extends Error {
  constructor(apiVersion: string | null) {
    super(
      `Stripe webhook endpoint uses API version ${apiVersion ?? "unknown"}. Recreate it on ${MIN_SUPPORTED_API_DATE} or later, otherwise subscription and invoice events cannot be read.`,
    );
    this.name = "StripeWebhookApiVersionError";
  }
}

type ProcessingOutcome = "duplicate" | "ignored" | "processed";

function getOptionalId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  const id = typeof value === "string" ? value : value.id;
  return id?.trim() ? id : null;
}

function getAdjustmentPaymentReferences(event: Stripe.Event): string[] {
  let paymentIntentId: string | null = null;
  let chargeId: string | null = null;

  if (event.type === "charge.refunded") {
    chargeId = event.data.object.id;
    paymentIntentId = getOptionalId(event.data.object.payment_intent);
  } else if (event.type === "charge.dispute.created") {
    chargeId = getOptionalId(event.data.object.charge);
    paymentIntentId = getOptionalId(event.data.object.payment_intent);
  } else {
    return [];
  }

  const references = [chargeId, paymentIntentId].filter(
    (value): value is string => Boolean(value),
  );
  // Payment records persist the PaymentIntent ID. This makes subscription
  // refunds deterministic and avoids a second Stripe API call inside webhook
  // handling; a missing record causes Stripe to retry the event.
  return [...new Set(references)];
}

async function getInvoicePaymentIntentId(
  invoice: Stripe.Invoice,
  eventId: string,
  eventType: "invoice.paid" | "invoice.payment_failed",
): Promise<string | null> {
  for (const payment of invoice.payments?.data ?? []) {
    if (payment.payment.type !== "payment_intent") continue;
    const paymentIntentId = getOptionalId(payment.payment.payment_intent);
    if (paymentIntentId) return paymentIntentId;
  }

  try {
    const invoicePayments = await getStripeClient().invoicePayments.list({
      invoice: invoice.id,
      limit: 10,
    });
    for (const invoicePayment of invoicePayments.data) {
      if (invoicePayment.payment.type !== "payment_intent") continue;
      const paymentIntentId = getOptionalId(
        invoicePayment.payment.payment_intent,
      );
      if (paymentIntentId) return paymentIntentId;
    }
    return null;
  } catch (error) {
    logStripeWebhook("warn", {
      eventId,
      eventType,
      outcome: "invoice_payment_lookup_failed",
    });
    throw error;
  }
}

async function dispatchStripeWebhook(
  event: Stripe.Event,
  eventCreatedAt: Date,
  adjustmentPaymentReferences: string[],
  invoicePaymentIntentId: string | null,
  tx: Tx,
): Promise<"ignored" | "processed"> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await processCheckoutSession(event.data.object, eventCreatedAt, tx);
      return "processed";
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await processSubscription(event.data.object, eventCreatedAt, tx);
      return "processed";
    case "invoice.paid":
      await processInvoice(
        event.data.object,
        "succeeded",
        eventCreatedAt,
        tx,
        invoicePaymentIntentId,
      );
      return "processed";
    case "invoice.payment_failed":
      await processInvoice(
        event.data.object,
        "failed",
        eventCreatedAt,
        tx,
        invoicePaymentIntentId,
      );
      return "processed";
    case "charge.refunded":
      await processRefund(
        event.data.object,
        adjustmentPaymentReferences,
        eventCreatedAt,
        tx,
      );
      return "processed";
    case "charge.dispute.created":
      await processDispute(adjustmentPaymentReferences, eventCreatedAt, tx);
      return "processed";
    default:
      return "ignored";
  }
}

export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<{ received: true }> {
  const { environment, webhookSecret } = getBillingConfig();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    logStripeWebhook("warn", {
      eventId: null,
      eventType: null,
      outcome: "invalid_signature",
    });
    throw new StripeWebhookSignatureError(
      error instanceof Error ? error.message : undefined,
    );
  }

  const expectedLivemode = environment === "live_mode";
  if (event.livemode !== expectedLivemode) {
    logStripeWebhook("warn", {
      eventId: event.id,
      eventType: event.type,
      outcome: "environment_mismatch",
    });
    throw new StripeWebhookEnvironmentError();
  }

  const requiresStructuredPayload =
    event.type.startsWith("customer.subscription.") ||
    event.type.startsWith("invoice.");
  const apiDate = event.api_version?.slice(0, 10);
  if (
    requiresStructuredPayload &&
    (!apiDate || apiDate < MIN_SUPPORTED_API_DATE)
  ) {
    logStripeWebhook("error", {
      eventId: event.id,
      eventType: event.type,
      outcome: "api_version_unsupported",
    });
    throw new StripeWebhookApiVersionError(event.api_version);
  }

  try {
    const eventCreatedAt = new Date(event.created * 1000);
    if (Number.isNaN(eventCreatedAt.getTime())) {
      throw new InvalidWebhookPayloadError(
        "Stripe event creation timestamp is invalid.",
      );
    }

    // Stripe redelivers aggressively. Short-circuit before the adjustment
    // lookup so replays cost neither a Stripe API call nor a transaction.
    if (await isWebhookEventProcessed(event.id, "stripe")) {
      logStripeWebhook("log", {
        eventId: event.id,
        eventType: event.type,
        outcome: "duplicate",
      });
      return { received: true };
    }

    const adjustmentPaymentReferences = getAdjustmentPaymentReferences(event);
    const invoicePaymentIntentId =
      event.type === "invoice.paid" || event.type === "invoice.payment_failed"
        ? await getInvoicePaymentIntentId(
            event.data.object,
            event.id,
            event.type,
          )
        : null;
    const outcome = await db.transaction<ProcessingOutcome>(async (tx) => {
      const claimed = await claimWebhookEvent(
        event.id,
        event.type,
        "stripe",
        tx,
      );
      if (!claimed) return "duplicate";
      return dispatchStripeWebhook(
        event,
        eventCreatedAt,
        adjustmentPaymentReferences,
        invoicePaymentIntentId,
        tx,
      );
    });

    logStripeWebhook("log", {
      eventId: event.id,
      eventType: event.type,
      outcome,
    });
    return { received: true };
  } catch (error) {
    logStripeWebhook(
      error instanceof InvalidWebhookPayloadError ? "warn" : "error",
      {
        eventId: event.id,
        eventType: event.type,
        outcome:
          error instanceof InvalidWebhookPayloadError
            ? "invalid_payload"
            : "failed",
      },
    );
    throw error;
  }
}
