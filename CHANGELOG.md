# Changelog

This file records the major stages of the production-hardening iteration.
Routine formatting and test-only maintenance are omitted.

## Unreleased

### Quality, reliability, and deployment hardening

- Replaced the license-unclear Creem SDK with a small, typed REST client using
  the official test and production API origins, bounded requests, response
  validation, and controlled failures.
- Aligned checkout, refund, and dispute handling with Creem's documented order
  references, including checkout orders that do not contain a transaction ID.
- Separated Creem test and live product IDs and made checkout fail closed when
  the active environment is not configured. One-time product matching no longer
  invents a recurring billing period.
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
- Tightened required credential validation and enforced that Creem keys match
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
- Updated English and Chinese project documentation and added Zeabur release
  guidance.

Database migration `0014_adorable_dorian_gray` adds the cancelled upload-intent
state, a two-stage deletion marker, normalized payment currencies, and the
settled-payment reporting index.

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
