import type {
  CreemCheckoutObject,
  CreemDisputeObject,
  CreemPaymentObject,
  CreemRefundObject,
  CreemSubscriptionObject,
  CreemWebhookPayload,
  SubscriptionStatus,
} from "@/types/billing";
import type { CreemEnvironment } from "./products";

export class InvalidWebhookPayloadError extends Error {
  constructor(message = "Invalid webhook payload.") {
    super(message);
    this.name = "InvalidWebhookPayloadError";
  }
}

const subscriptionStatuses = new Set<SubscriptionStatus>([
  "active",
  "canceled",
  "expired",
  "past_due",
  "unpaid",
  "paused",
  "scheduled_cancel",
  "trialing",
  "incomplete",
]);

export function getCustomerId(
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

export function isIdReference(
  value: unknown,
): value is string | { id: string } {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "object" &&
      value !== null &&
      typeof (value as { id?: unknown }).id === "string" &&
      (value as { id: string }).id.trim().length > 0)
  );
}

export function isSubscriptionObject(
  object: unknown,
): object is CreemSubscriptionObject {
  return (
    typeof object === "object" &&
    object !== null &&
    isIdReference((object as { customer?: unknown }).customer) &&
    isIdReference((object as { product?: unknown }).product) &&
    typeof (object as { status?: unknown }).status === "string" &&
    subscriptionStatuses.has((object as { status: SubscriptionStatus }).status)
  );
}

function isCheckoutSubscriptionObject(
  object: unknown,
): object is CreemSubscriptionObject {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as { id?: unknown }).id === "string" &&
    isIdReference((object as { product?: unknown }).product) &&
    typeof (object as { status?: unknown }).status === "string" &&
    subscriptionStatuses.has((object as { status: SubscriptionStatus }).status)
  );
}

export function isCheckoutObject(
  object: unknown,
): object is CreemCheckoutObject {
  if (typeof object !== "object" || object === null || !("order" in object)) {
    return false;
  }

  const order = (object as { order?: unknown }).order;
  const subscription = (object as { subscription?: unknown }).subscription;
  if (typeof order !== "object" || order === null) {
    return false;
  }

  const checkoutOrder = order as {
    id?: unknown;
    transaction?: unknown;
    amount?: unknown;
    amount_due?: unknown;
    currency?: unknown;
  };
  const amount = checkoutOrder.amount_due ?? checkoutOrder.amount;

  return (
    typeof checkoutOrder.id === "string" &&
    checkoutOrder.id.trim().length > 0 &&
    (checkoutOrder.transaction === undefined ||
      (typeof checkoutOrder.transaction === "string" &&
        checkoutOrder.transaction.trim().length > 0)) &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    typeof checkoutOrder.currency === "string" &&
    checkoutOrder.currency.trim().length > 0 &&
    (subscription == null || isCheckoutSubscriptionObject(subscription))
  );
}

function isTransactionReference(
  value: unknown,
): value is CreemRefundObject["transaction"] {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    (value as { id: string }).id.trim().length > 0 &&
    (!("order" in value) ||
      (typeof (value as { order?: unknown }).order === "string" &&
        (value as { order: string }).order.trim().length > 0)) &&
    typeof (value as { amount?: unknown }).amount === "number" &&
    [
      "pending",
      "paid",
      "refunded",
      "partialRefund",
      "chargedBack",
      "uncollectible",
      "declined",
      "canceled",
      "void",
    ].includes(String((value as { status?: unknown }).status))
  );
}

export function isRefundObject(object: unknown): object is CreemRefundObject {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as { id?: unknown }).id === "string" &&
    typeof (object as { refund_amount?: unknown }).refund_amount === "number" &&
    ["pending", "requiresAction", "succeeded", "failed", "canceled"].includes(
      String((object as { status?: unknown }).status),
    ) &&
    isTransactionReference((object as { transaction?: unknown }).transaction)
  );
}

export function isDisputeObject(object: unknown): object is CreemDisputeObject {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as { id?: unknown }).id === "string" &&
    typeof (object as { amount?: unknown }).amount === "number" &&
    isTransactionReference((object as { transaction?: unknown }).transaction)
  );
}

export function isPaymentObject(object: unknown): object is CreemPaymentObject {
  return (
    typeof object === "object" &&
    object !== null &&
    isIdReference((object as { customer?: unknown }).customer) &&
    (typeof (object as { amount?: unknown }).amount === "number" ||
      typeof (object as { amount_paid?: unknown }).amount_paid === "number")
  );
}

export function parseCreemWebhookPayload(payload: string): CreemWebhookPayload {
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
    candidate.eventType.trim().length === 0 ||
    typeof candidate.created_at !== "number" ||
    !Number.isFinite(candidate.created_at) ||
    !candidate.object ||
    typeof candidate.object !== "object" ||
    typeof candidate.object.id !== "string" ||
    candidate.object.id.trim().length === 0
  ) {
    throw new InvalidWebhookPayloadError();
  }

  return {
    ...(candidate as CreemWebhookPayload),
    id: candidate.id.trim(),
    eventType: candidate.eventType.trim(),
  };
}

export function toWebhookCreatedAt(timestamp: number): Date {
  // Creem sends Unix milliseconds; accept seconds for older integrations.
  const milliseconds =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const createdAt = new Date(milliseconds);
  if (Number.isNaN(createdAt.getTime())) {
    throw new InvalidWebhookPayloadError();
  }
  return createdAt;
}

export function invalidEventObject(eventType: string): never {
  throw new InvalidWebhookPayloadError(
    `Invalid object for Creem webhook event type ${eventType}.`,
  );
}

export function parseWebhookDate(value: unknown, fieldName: string): Date {
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

export function parseOptionalWebhookDate(
  value: unknown,
  fieldName: string,
): Date | undefined {
  return value === undefined ? undefined : parseWebhookDate(value, fieldName);
}

export function parseUnixSecondsDate(value: unknown, fieldName: string): Date {
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

export function assertCreemObjectEnvironment(
  object: unknown,
  environment: CreemEnvironment,
): void {
  if (!object || typeof object !== "object") {
    return;
  }

  const mode = (object as Record<string, unknown>).mode;
  if (typeof mode !== "string") {
    return;
  }

  const allowedModes =
    environment === "live_mode" ? ["prod"] : ["test", "sandbox"];
  if (!allowedModes.includes(mode)) {
    throw new InvalidWebhookPayloadError(
      "Webhook object mode does not match the configured Creem environment.",
    );
  }
}
