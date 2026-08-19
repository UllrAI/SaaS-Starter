/**
 * Pinned so SDK upgrades cannot silently change request or response shapes.
 * The webhook endpoint in the Stripe dashboard must use this same version —
 * see `docs/webhooks.md`.
 */
export const STRIPE_API_VERSION = "2026-07-29.dahlia";

/**
 * Basil moved `invoice.parent`, invoice line `pricing`, and the subscription
 * item billing period into the shape this code reads. Events rendered on an
 * older version would parse into undefined and drop renewals silently.
 */
export const MIN_SUPPORTED_API_DATE = "2025-04-30";
