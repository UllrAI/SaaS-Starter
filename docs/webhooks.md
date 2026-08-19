# Billing webhook operations

The Stripe endpoint verifies the request signature and payload before opening a
database transaction. Inside that transaction it claims the provider event ID
and applies every related billing change. The claim and the business writes
therefore commit or roll back together.

## Delivery and retry behavior

- A successful event leaves one row in `webhook_events`, keyed by
  `(provider, eventId)`. Later deliveries of the same event return success
  without applying the event again.
- A processing failure returns a non-2xx response. Its event claim and billing
  writes are rolled back, so Stripe can retry the complete event safely.
- Invalid signatures and invalid payloads return `400`. Fix the sender or
  endpoint configuration before replaying them.
- Logs contain only `provider`, `eventId`, `eventType`, and `outcome`. Raw
  payloads and signatures are neither logged nor stored.

The event ledger intentionally contains only successful event metadata. Keep
these rows for idempotency; deleting them can allow an old delivery to run
again.

## Manual replay

Use Stripe's dashboard to resend an event to the existing webhook endpoint. Do
not insert or delete ledger rows by hand. A previously successful event will be
recognized as a duplicate, while an event whose transaction failed can be
processed normally.

This starter does not include a second retry queue or replay UI. Stripe remains
the delivery source, and the database transaction is the local consistency
boundary.

Configure the Stripe endpoint as `/api/billing/webhooks/stripe` and subscribe
to `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `customer.subscription.paused`,
`customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`,
`charge.refunded`, and `charge.dispute.created`.

## Endpoint API version

Each Stripe endpoint is pinned to the API version that was current when it was
created, and that version decides the shape of the payloads it receives. This
starter reads `invoice.parent.subscription_details` and per-item billing
periods, both introduced in `2025-04-30`. An endpoint older than that delivers
subscription and invoice events the handler cannot read, so those events are
rejected with `400` and logged as `api_version_unsupported`. Recreate the
endpoint, or upgrade its version in the dashboard, to fix it.
