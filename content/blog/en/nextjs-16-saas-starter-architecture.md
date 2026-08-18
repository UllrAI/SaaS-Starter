---
slug: nextjs-16-saas-starter-architecture
title: "Next.js 16 SaaS Starter Architecture: Auth, Billing, Data, and Deployment"
publishedDate: 2026-08-12
author: admin
excerpt: >-
  A code-level tour of a production-ready Next.js 16 SaaS starter with Better Auth, Stripe billing, Drizzle, PostgreSQL, R2 uploads, i18n, and release checks.
tags:
  - Next.js 16
  - SaaS Starter
  - Better Auth
  - Stripe
  - Drizzle ORM
  - PostgreSQL
featured: true
---

A useful SaaS starter is not a landing-page screenshot with a login form attached. It is a set of boundaries that continue to work when authentication, billing, data migrations, background callbacks, localization, and production releases interact. This guide maps those boundaries to the actual modules in UllrAI SaaS Starter so you can judge the architecture before cloning it.

## Start with the request boundaries

The application uses the Next.js 16 App Router. Public marketing pages live under `src/app/(pages)`, authentication pages under `src/app/(auth)`, protected product screens under `src/app/dashboard`, and HTTP integrations under `src/app/api`. Route groups keep the public URL clean while letting layouts enforce different security and presentation rules.

Server Components remain the default. Interactive leaves such as checkout controls and authentication forms opt into client rendering. This keeps database and credential access on the server and prevents a broad client boundary from pulling unnecessary code into every page.

The public site has two URL families:

- English pages use canonical unprefixed paths such as `/pricing`.
- Simplified Chinese pages use explicit paths such as `/zh-Hans/pricing`.

Canonical metadata, reciprocal hreflang links, and the sitemap use the same routing helpers. That consistency matters more than adding one-off SEO tags to individual pages.

## Authentication for people and machines

Better Auth owns browser sessions and magic-link or OAuth sign-in. Permission checks stay in `src/lib/auth/permissions.ts`, so protected pages do not reproduce authorization logic.

Machine clients use a separate boundary:

- API keys authenticate scripts and server-to-server callers.
- The first-party CLI uses a browser-approved device flow.
- CLI access and refresh tokens can be reviewed and revoked from the dashboard.
- Versioned machine routes live under `/api/v1/*`.

This avoids the common shortcut of copying browser cookies into automation. For the security trade-offs and flow selection, read [API Keys vs OAuth vs Device Flow](/blog/api-keys-oauth-device-flow-saas-agents).

## Billing through a provider contract

Product code calls the interface in `src/lib/billing/provider.ts`. The current provider is Stripe, but checkout ownership, payment modes, billing cycles, webhook validation, and idempotency live behind stable application types.

The checkout route validates the requested tier and the authenticated user before it creates a provider session. Webhooks validate first, record provider event IDs, and process state changes idempotently. Production catalog IDs are separate from test-mode IDs so a release cannot silently charge against the wrong catalog.

The complete implementation path is covered in [Stripe Billing with Next.js](/blog/stripe-nextjs-billing-production-guide).

## PostgreSQL and Drizzle without startup migrations

Drizzle schemas and queries live under `src/database` and `src/lib/database`. The repository keeps one committed migration history for every environment.

The operational rule is deliberate:

1. Use `pnpm db:push` only for disposable personal databases.
2. Generate reviewable SQL with `pnpm db:generate`.
3. Apply committed migrations once with `pnpm db:migrate`.
4. Deploy application processes only after the migration succeeds.

Running migrations inside every application startup couples availability to schema locks and makes multi-instance rollouts unpredictable. A dedicated release step is easier to audit and retry.

## Uploads use explicit intents

Cloudflare R2 uploads are not exposed as an unrestricted bucket credential. The server validates file metadata and quota, creates an upload intent, and signs a bounded upload request. Completion validates that the uploaded object still matches the reserved metadata before it becomes application data.

This model supports direct browser uploads without trusting the browser to declare success. It also keeps server-proxied uploads available for use cases where direct upload is not appropriate.

## Production is a verification workflow

The repository treats these commands as part of the product:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

The release workflow also verifies that a `release/vX.Y.Z` tag matches `package.json`, comes from the default branch, and promotes that commit to the production branch. That makes the tag an auditable production decision instead of a decorative version label.

## When this architecture fits

Choose this starter when you need an open-source Next.js foundation with Stripe, self-managed PostgreSQL, R2 uploads, internationalized public pages, and first-class machine access. A smaller demo may be better when you only need to prototype UI. A multi-tenant enterprise boilerplate may be better when organizations, SSO, and audit exports are already hard requirements.

Inspect the [full developer guide](/blog/saas-starter-kit-developer-guide), review the [source repository](https://github.com/UllrAI/SaaS-Starter), and run the verification commands before replacing any boundary with project-specific code.
