import crypto from "crypto";

import { db } from "@/database";
import { claimWebhookEvent, type Tx } from "@/lib/database/subscription";
import type { CreemWebhookPayload } from "@/types/billing";

import { getBillingConfig } from "@/lib/config/integrations";
import { logCreemWebhook } from "./webhook-log";
import {
  assertCreemObjectEnvironment,
  InvalidWebhookPayloadError,
  invalidEventObject,
  isCheckoutObject,
  isDisputeObject,
  isPaymentObject,
  isRefundObject,
  isSubscriptionObject,
  parseCreemWebhookPayload,
  toWebhookCreatedAt,
} from "./webhook-payload";
import {
  processCheckoutCompletedEvent,
  processDisputeCreatedEvent,
  processPaymentSucceededEvent,
  processRefundCreatedEvent,
  processSubscriptionEvent,
  processSubscriptionRenewal,
} from "./webhook-processors";

export { InvalidWebhookPayloadError } from "./webhook-payload";

export class CreemWebhookSignatureError extends Error {
  constructor(message = "Invalid signature.") {
    super(message);
    this.name = "CreemWebhookSignatureError";
  }
}

type ProcessingOutcome = "duplicate" | "ignored" | "processed";

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
  } catch {
    return false;
  }
}

async function dispatchCreemWebhook(
  event: CreemWebhookPayload,
  eventCreatedAt: Date,
  tx: Tx,
): Promise<"ignored" | "processed"> {
  const eventObject = event.object;
  switch (event.eventType) {
    case "checkout.completed":
      if (!isCheckoutObject(eventObject)) {
        invalidEventObject(event.eventType);
      }
      await processCheckoutCompletedEvent(eventObject, eventCreatedAt, tx);
      return "processed";
    case "payment.succeeded":
      if (!isPaymentObject(eventObject)) {
        invalidEventObject(event.eventType);
      }
      if (eventObject.billing_reason === "subscription_cycle") {
        await processSubscriptionRenewal(eventObject, eventCreatedAt, tx);
      } else {
        await processPaymentSucceededEvent(eventObject, tx);
      }
      return "processed";
    case "refund.created":
      if (!isRefundObject(eventObject)) {
        invalidEventObject(event.eventType);
      }
      await processRefundCreatedEvent(eventObject, eventCreatedAt, tx);
      return "processed";
    case "dispute.created":
      if (!isDisputeObject(eventObject)) {
        invalidEventObject(event.eventType);
      }
      await processDisputeCreatedEvent(eventObject, eventCreatedAt, tx);
      return "processed";
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
      return "processed";
    case "subscription.paid":
      if (!isSubscriptionObject(eventObject) && !isPaymentObject(eventObject)) {
        invalidEventObject(event.eventType);
      }
      await processSubscriptionRenewal(eventObject, eventCreatedAt, tx);
      return "processed";
    default:
      return "ignored";
  }
}

export async function handleCreemWebhook(
  payload: string,
  signature: string,
): Promise<{ received: true }> {
  const { environment, webhookSecret } = getBillingConfig();

  if (!verifyCreemSignature(payload, signature, webhookSecret)) {
    logCreemWebhook("warn", {
      eventId: null,
      eventType: null,
      outcome: "invalid_signature",
    });
    throw new CreemWebhookSignatureError();
  }

  let event: CreemWebhookPayload;
  try {
    event = parseCreemWebhookPayload(payload);
    assertCreemObjectEnvironment(event.object, environment);
  } catch (error) {
    logCreemWebhook("warn", {
      eventId: null,
      eventType: null,
      outcome: "invalid_payload",
    });
    throw error;
  }

  const eventId = event.id;
  const eventType = event.eventType;
  try {
    const eventCreatedAt = toWebhookCreatedAt(event.created_at);
    const outcome = await db.transaction<ProcessingOutcome>(async (tx) => {
      // The claim and all business writes commit or roll back together.
      const claimed = await claimWebhookEvent(eventId, eventType, "creem", tx);
      if (!claimed) {
        return "duplicate";
      }
      return dispatchCreemWebhook(event, eventCreatedAt, tx);
    });

    logCreemWebhook("log", { eventId, eventType, outcome });
    return { received: true };
  } catch (error) {
    logCreemWebhook(
      error instanceof InvalidWebhookPayloadError ? "warn" : "error",
      {
        eventId,
        eventType,
        outcome:
          error instanceof InvalidWebhookPayloadError
            ? "invalid_payload"
            : "failed",
      },
    );
    throw error;
  }
}
