# Changelog

This file records the major stages of the production-hardening iteration.
Routine formatting and test-only maintenance are omitted.

## Unreleased

## 0.1.12 — 2026-08-22

### AI reference images

- Added image attachments to AI chat with previews, upload progress, retry and removal controls,
  image-only messages, and durable display in conversation history.
- Restricted reference images to six PNG, JPEG, or WebP files per message and verified every stored
  URL belongs to the authenticated user before model access.

## 0.1.11 — 2026-08-22

### AI conversation controls and image aspect ratios

- Added a collapsible desktop history rail plus reversible conversation
  archiving and restoration.
- Kept GPT Image 2 output in the approved 1K tier while selecting square,
  landscape, or portrait dimensions from the latest user request.
- Corrected the canvas-open icon direction across the AI workspace.
- Kept assistant generation and persistence running independently of the
  browser connection, so closing or refreshing the page no longer drops the
  completed reply.
- Moved the AI accuracy notice into the scrollable conversation area with a
  quieter visual treatment.

## 0.1.10 — 2026-08-22

### Persistent AI conversations

- Added user-owned AI conversations and messages in PostgreSQL so chat history
  survives refreshes, sign-outs, and device changes.
- Added responsive conversation history, new-chat, switching, pagination, and
  signed Responses API context restoration.
- Persisted generated images to the existing R2 upload system so historical
  canvas results remain available without storing base64 payloads in PostgreSQL.

## 0.1.9 — 2026-08-22

### AI image streaming reliability

- Added SSE comment heartbeats to keep long-running image generations connected
  through mobile networks and reverse proxies without changing the AI message
  protocol or adding partial-image costs.

## 0.1.8 — 2026-08-22

### Responses API and AI workspace

- Migrated the AI agent from Chat Completions compatibility mode to the OpenAI
  Responses API so reasoning and function tools work together.
- Added signed native response chaining, a low-by-default reasoning selector,
  and restricted GPT Image 2 generation at 1024 × 1024 low quality.
- Rebuilt the assistant as a responsive Chat + Canvas workspace with structured
  reasoning, tool activity, Markdown documents, image and video artifacts, and
  localized controls.
- Added focused unit, route, end-to-end, and visual design QA coverage.

## 0.1.7 — 2026-08-21

### Agent-ready AI stack

- Added a Vercel AI SDK v7 agent loop behind a provider-neutral
  OpenAI-compatible endpoint, configured with `LLM_API_KEY`, `LLM_BASE_URL`,
  and `AI_DEFAULT_MODEL`.
- Added the `src/lib/ai` module: a tool registry, a composable skill system,
  and request-scoped agents whose context is built from the session.
- Added `POST /api/chat` with session auth, per-user rate limiting, body
  limits, and masked provider errors, plus a streaming chat page at
  `/dashboard/ai` localized in English and Simplified Chinese.
- Gated the whole feature behind `SITE_CONFIG.features.ai`. Deployments that
  keep it enabled must provide `LLM_API_KEY`.

## 0.1.6 — 2026-08-20

### Security

- Resolved the high-severity `deepmerge-ts` and `nanoid` advisories reported
  by Dependabot, with narrow dependency overrides and a refreshed lockfile.

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
