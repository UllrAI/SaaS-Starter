type WebhookLogLevel = "log" | "warn" | "error";

interface CreemWebhookLog {
  eventId: string | null;
  eventType: string | null;
  outcome:
    | "body_too_large"
    | "configuration_error"
    | "duplicate"
    | "failed"
    | "ignored"
    | "invalid_payload"
    | "invalid_signature"
    | "missing_signature"
    | "processed"
    | "request_failed";
}

export function logCreemWebhook(
  level: WebhookLogLevel,
  entry: CreemWebhookLog,
): void {
  console[level](
    JSON.stringify({
      provider: "creem",
      eventId: entry.eventId,
      eventType: entry.eventType,
      outcome: entry.outcome,
    }),
  );
}
