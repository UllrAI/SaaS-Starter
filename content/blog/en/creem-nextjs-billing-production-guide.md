---
slug: creem-nextjs-billing-production-guide
title: "Creem Billing with Next.js: Production Checkout and Webhook Guide"
publishedDate: 2026-08-12
author: admin
excerpt: >-
  Implement Creem checkout, subscriptions, one-time purchases, idempotent webhooks, catalog sync, and production release checks in a Next.js SaaS.
tags:
  - Creem
  - Next.js
  - SaaS Billing
  - Webhooks
  - TypeScript
featured: false
---

Adding a checkout button is the shortest part of a billing integration. Production reliability depends on what happens before the redirect, after the provider callback, during retries, and when test and live catalogs diverge. UllrAI SaaS Starter keeps those responsibilities visible instead of hiding them inside a page component.

## Keep product intent independent from the provider

The application-level contract lives in `src/lib/billing/provider.ts`. Callers provide a tier ID, payment mode, optional billing cycle, authenticated owner, and return URLs. They receive a validated checkout URL rather than a raw provider response.

The current Creem adapter maps that intent to the matching product ID in `src/lib/billing/creem/products.ts`. Subscription and one-time purchase flows share the contract while retaining different entitlement behavior.

This is enough abstraction to protect business code without pretending every billing provider has identical concepts.

## Validate checkout before leaving the application

`POST /api/billing/checkout` is an authenticated boundary. It validates:

- the feature is enabled;
- the user session is valid;
- the request body matches the supported tier, payment mode, and billing cycle;
- a live or test product ID exists for the active Creem environment;
- an existing entitlement does not conflict with the purchase;
- repeated browser attempts reuse a request ID instead of creating accidental duplicate sessions.

The client then allowlists the returned redirect host before calling `window.location.assign`. A successful HTTP response containing an unexpected URL is treated as an error, not as permission to redirect anywhere.

## Separate test and live catalogs

`CREEM_ENVIRONMENT` selects `test_mode` or `live_mode`. Product IDs are stored separately for the two environments. The sync command updates only the active namespace:

```bash
pnpm creem:sync-products
```

Review and commit the resulting catalog configuration. A production release should fail closed when a live product ID is missing; it should never fall back to the test catalog or create products during an application request.

## Treat webhooks as the source of durable state

The browser returning from checkout is useful feedback, but it is not durable billing evidence. The webhook path verifies the Creem signature before parsing business data, records the provider event ID, and processes each event idempotently.

Relevant transitions include:

- checkout completion;
- subscription creation or renewal;
- cancellation and expiration;
- payment success, failure, refund, and dispute states.

Ownership metadata is allowlisted and checked against the checkout record. Product and payment-mode metadata must match the configured tier before an entitlement is written.

Retries are expected. The handler distinguishes “already processed” from “failed before completion,” allowing safe replay without applying the same entitlement twice.

## Verify the return path without trusting it

The payment status page polls the application API with the provider checkout reference. The server retrieves the current checkout and verifies ownership. The client presents `success`, `pending`, `failed`, or `cancelled` only from this controlled result.

Analytics records `payment_start` before the redirect and `payment_success` only after the controlled status reaches success. Provider webhooks and database rows remain the accounting source; analytics events are journey signals, not revenue records.

## Release checklist

Before enabling live mode:

1. Configure the live Creem API key and webhook secret.
2. Sync and review live catalog IDs.
3. Register the exact production webhook endpoint in Creem.
4. Exercise subscription and one-time checkouts with an authenticated test account.
5. Replay a webhook and confirm the database changes only once.
6. Test cancellation, refund, and failed-payment paths.
7. Run `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`.

Do not log provider secrets, full webhook headers, or customer payment data during verification.

## Extend the integration safely

Add a new tier by extending the typed product catalog and its tests, not by accepting arbitrary product IDs from the client. Add a new provider by implementing the application contract and preserving validation, ownership, and idempotency boundaries.

For the surrounding application structure, see the [Next.js 16 SaaS starter architecture](/blog/nextjs-16-saas-starter-architecture) and the [complete developer guide](/blog/saas-starter-kit-developer-guide).
