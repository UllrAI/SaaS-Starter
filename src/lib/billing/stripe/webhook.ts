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
  constructor(apiVersion: string) {
    super(
      `Stripe webhook endpoint uses API version ${apiVersion}. Recreate it on ${MIN_SUPPORTED_API_DATE} or later, otherwise subscription and invoice events cannot be read.`,
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

async function getAdjustmentPaymentReferences(
  event: Stripe.Event,
): Promise<string[]> {
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
  if (!paymentIntentId) return references;

  try {
    const invoicePayments = await getStripeClient().invoicePayments.list({
      payment: {
        type: "payment_intent",
        payment_intent: paymentIntentId,
      },
      limit: 10,
    });
    for (const invoicePayment of invoicePayments.data) {
      const invoiceId = getOptionalId(invoicePayment.invoice);
      if (invoiceId) references.push(invoiceId);
    }
  } catch (error) {
    // Subscription payments are keyed by invoice, so losing this lookup only
    // matters for them. Keep the charge and intent references and let the
    // processor decide, instead of failing a one-time refund on an API blip.
    logStripeWebhook("warn", {
      eventId: event.id,
      eventType: event.type,
      outcome: "invoice_lookup_failed",
    });
    console.warn("[Stripe Webhook] Invoice payment lookup failed.", error);
  }

  return [...new Set(references)];
}

async function dispatchStripeWebhook(
  event: Stripe.Event,
  eventCreatedAt: Date,
  adjustmentPaymentReferences: string[],
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
      await processInvoice(event.data.object, "succeeded", eventCreatedAt, tx);
      return "processed";
    case "invoice.payment_failed":
      await processInvoice(event.data.object, "failed", eventCreatedAt, tx);
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

  const apiDate = event.api_version?.slice(0, 10);
  if (apiDate && apiDate < MIN_SUPPORTED_API_DATE) {
    logStripeWebhook("error", {
      eventId: event.id,
      eventType: event.type,
      outcome: "api_version_unsupported",
    });
    throw new StripeWebhookApiVersionError(event.api_version as string);
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

    const adjustmentPaymentReferences =
      await getAdjustmentPaymentReferences(event);
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
