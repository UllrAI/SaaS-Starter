# Billing webhook operations

The Creem endpoint verifies the request signature and payload before opening a
database transaction. Inside that transaction it claims the provider event ID
and applies every related billing change. The claim and the business writes
therefore commit or roll back together.

## Delivery and retry behavior

- A successful event leaves one row in `webhook_events`, keyed by
  `(provider, eventId)`. Later deliveries of the same event return success
  without applying the event again.
- A processing failure returns a non-2xx response. Its event claim and billing
  writes are rolled back, so Creem can retry the complete event safely.
- Invalid signatures and invalid payloads return `400`. Fix the sender or
  endpoint configuration before replaying them.
- Logs contain only `provider`, `eventId`, `eventType`, and `outcome`. Raw
  payloads and signatures are neither logged nor stored.

The event ledger intentionally contains only successful event metadata. Keep
these rows for idempotency; deleting them can allow an old delivery to run
again.

## Manual replay

Use Creem's dashboard to resend an event to the existing webhook endpoint. Do
not insert or delete ledger rows by hand. A previously successful event will be
recognized as a duplicate, while an event whose transaction failed can be
processed normally.

This starter does not include a second retry queue or replay UI. Creem remains
the delivery source, and the database transaction is the local consistency
boundary.
