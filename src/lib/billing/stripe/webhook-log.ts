type StripeWebhookOutcome =
  | "body_too_large"
  | "duplicate"
  | "environment_mismatch"
  | "failed"
  | "ignored"
  | "invalid_payload"
  | "invalid_signature"
  | "missing_signature"
  | "processed"
  | "request_failed";

interface StripeWebhookLogEntry {
  eventId: string | null;
  eventType: string | null;
  outcome: StripeWebhookOutcome;
}

export function logStripeWebhook(
  level: "error" | "log" | "warn",
  entry: StripeWebhookLogEntry,
): void {
  console[level]("[Stripe Webhook]", entry);
}
