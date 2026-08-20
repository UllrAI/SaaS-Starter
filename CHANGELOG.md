# Changelog

This file records the major stages of the production-hardening iteration.
Routine formatting and test-only maintenance are omitted.

## Unreleased

## 0.1.5 — 2026-08-20

### Stripe migration completion

- Added the configured Stripe test catalog used by local development and the
  hosted reference deployment.
- Replaced the partial Creem customer cleanup with a forward migration that
  removes all legacy billing records while preserving users and administrator
  roles, and corrected the provider default without rewriting migration
  history.
- Reconciled subscription webhooks against Stripe's current state so
  same-second, out-of-order deliveries cannot regress access.
- Added durable asynchronous checkout failure handling and complete dispute
  closure reconciliation, including access restoration after a won dispute.
- Made catalog tests accept reviewed test or live IDs instead of requiring an
  unusable empty configuration.

## 0.1.4 — 2026-08-19

### Quality, reliability, and deployment hardening

- Replaced the billing integration with the official Stripe Node SDK, hosted
  Checkout, Billing Portal, signed webhooks, and idempotent subscription,
  invoice, refund, and dispute processing.
- Added deterministic Stripe Product and Price synchronization. Each tier has
  a stable Product identity, while price changes create a new checkout Price
  without breaking existing subscriptions. Test and live catalog IDs remain
  isolated, reviewed in source, and never created during an application
  request.
- Added Stripe checkout ownership checks, metadata-backed Customer recovery,
  idempotency keys, environment-mode validation, and controlled payment-status
  polling.
- Persisted PaymentIntent references for invoice payments and made refund and
  dispute processing deterministic. Webhooks now fail closed on ambiguous
  customer ownership, subscription items, invoice products, and unsupported
  API versions.
- Added checkout idempotency and synchronous duplicate-click protection.
- Added bounded request bodies and persistent rate limits to sensitive API
  creation flows.
- Added device authorization details so users can inspect the requesting CLI
  before approval.
- Standardized PostgreSQL sessions and legacy timestamp parsing on UTC so
  expiring credentials behave correctly regardless of database host timezone.
- Split liveness and database-backed readiness probes, made timed-out readiness
  queries cancellable, and bounded database connection attempts to four seconds.
- Added immediate upload-quota release for cancelled and failed direct uploads,
  plus a two-stage orphan tombstone that deletes again after 24 hours to catch
  late signed PUT requests.
- Corrected financial reporting to count only settled USD payments and added
  the supporting composite index. Currency values are normalized, and chart
  month labels are fixed to the same UTC boundary used by the SQL aggregation.
- Tightened required credential validation and enforced that Stripe keys match
  the selected test or live environment at startup.
- Removed unused components, dependencies, compatibility exports, assets, and
  deployment configuration.
- Tightened Node, CI, Docker, database configuration, dependency, lint, and
  formatting contracts.
- Configured Zeabur to use the existing multi-stage standalone Dockerfile
  instead of packaging the full Node.js build environment into the Web image.
- Enforced an unprivileged Web process even when the hosting platform overrides
  the Docker image user.
- Added an opt-in daily production maintenance workflow for upload orphan
  cleanup on hosts without a native scheduler.
- Added release-tag promotion: `release/*` tags are validated against the
  repository's default branch before moving the Zeabur-tracked `prod` branch.
- Updated English and Chinese project documentation and added Zeabur release
  guidance.

Database migration `0014_adorable_dorian_gray` adds the cancelled upload-intent
state, a two-stage deletion marker, normalized payment currencies, and the
settled-payment reporting index.

## 0.1.3 — 2026-08-13

### SEO measurement and organic growth foundations

- Added optional, environment-validated Umami tracking with a deployment-specific
  website ID, hostname filtering, Do Not Track support, and stable funnel events.
- Added true new-user signup measurement through Better Auth's dedicated
  new-user callback, plus source, clone, pricing, checkout, and payment events.
- Restored the externally linked SaaS introduction URL with a permanent,
  single-hop redirect to the current developer guide.
- Added optional Bing Webmaster verification metadata for per-deployment site
  ownership without committing a maintainer token to downstream forks.
- Enforced one article H1, exposed meaningful update dates, and added Article and
  BreadcrumbList structured data to blog posts.
- Refreshed both developer-guide locales and published three repository-backed
  English guides for Next.js 16 architecture, Stripe billing, and machine auth.
- Documented the keyword map, index inventory, analytics contract, 20 qualified
  discovery prospects, campaign logging rules, and dated review schedule.

## 2026-07-24

### PR #37 — Locale negotiation and static marketing delivery

- Added saved-locale and `Accept-Language` negotiation with unsupported
  languages falling back to English.
- Preserved explicit localized URLs while keeping localized marketing pages
  statically generated and cacheable.
- Added regression coverage for language selection, cache behavior, and
  localized metadata.

### PR #36 — Secure upload lifecycle

- Added database-backed upload intents, one-time object keys, quota reservation,
  object metadata verification, and retryable orphan cleanup.
- Added a bounded compatibility window for older upload clients.

### PR #35 — Billing, authentication, and container reliability

- Hardened billing callbacks, webhook validation, authentication behavior, and
  standalone Docker deployment.
- Applied the associated committed database migrations.

### PR #34 — Core authorization and data integrity

- Added compare-and-swap credential rotation, ownership checks, payment and
  entitlement integrity, persistent PostgreSQL rate limiting, indexes, and CI
  database validation.
- Applied the associated committed database migrations.

### PR #33 — next-intl and SEO foundation

- Removed Lingo and migrated localization to `next-intl`.
- Added canonical localized routes, `hreflang`, sitemap, structured metadata,
  and hardened security headers.
