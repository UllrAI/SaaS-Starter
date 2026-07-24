# AGENTS.md

This file is the single source of truth for repository-specific agent instructions.
`CLAUDE.md` must only point here. If any other instruction file disagrees with this file, follow `AGENTS.md`.

## 1. Working Agreement

- Make minimal, correct, production-ready changes. Avoid over-engineering.
- Prefer simple modules, low cyclomatic complexity, and reusable logic.
- Check existing patterns before adding new abstractions.
- Keep user-visible behavior complete. Do not leave mock data, placeholder flows, or half-finished paths.
- When documentation in this file conflicts with the codebase, verify the codebase and update the documentation to match reality.

## 2. Development Commands

### Core commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm dead-code:check
pnpm type-check
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm analyze
pnpm analyze:dev
pnpm prettier:check
pnpm prettier:format
```

### Database commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
```

### Utilities

```bash
pnpm set:admin
pnpm creem:sync-products
```

## 3. Project Snapshot

- Framework: Next.js 16 App Router
- Runtime UI stack: React 19, Tailwind CSS v4, shadcn/ui, Radix UI
- Package manager: `pnpm`
- Database: PostgreSQL with Drizzle ORM
- Auth: Better Auth, magic link via Resend, optional OAuth providers
- Billing: provider abstraction in `src/lib/billing/provider.ts`, current implementation uses Creem
- Storage: Cloudflare R2 with presigned uploads
- Content: Content Collections plus repository-managed Markdown
- Localization: `next-intl`

## 4. Important Paths

- App routes: `src/app`
- Public marketing pages: `src/app/(pages)`
- Auth routes: `src/app/(auth)`
- Protected app: `src/app/dashboard`
- API routes: `src/app/api`
- Shared components: `src/components`
- UI primitives: `src/components/ui`
- Forms: `src/components/forms`
- Business logic: `src/lib`
- Auth logic: `src/lib/auth`
- Billing logic: `src/lib/billing`
- i18n helpers: `src/lib/i18n`, `src/lib/config/i18n.ts`, `src/lib/config/i18n-routing.ts`
- Translation catalogs: `src/messages`
- Database schema and migrations: `src/database`, `src/database/migrations`
- Email templates: `src/emails`
- Environment validation: `env.js`
- Route protection: `src/proxy.ts`
- Next config: `next.config.ts`
- next-intl request config: `src/i18n/request.ts`

## 5. Engineering Rules

### TypeScript and module design

- Keep types explicit and strict. Do not introduce `any`.
- Prefer small focused modules over large files.
- Reuse existing components and utilities before creating new ones.
- Follow repository naming patterns:
  - Components: PascalCase
  - Functions and variables: camelCase
- Keep code readable without clever indirection. If a pattern needs a long explanation, it is probably too complex.

### Next.js and React

- Default to Server Components. Add Client Components only when interactivity or browser APIs require them.
- Push `"use client"` down to the smallest interactive leaf.
- Follow App Router conventions for pages, layouts, route handlers, and colocated `_components`.
- Use real implementations. Do not ship fake data, fake success states, or dead-end UI.
- Add page metadata where appropriate.

### Layout and page width

- Use the semantic containers from `src/components/layout/page-container.tsx` instead of page-local `max-w-*` wrappers when working outside the dashboard.
- Use `ShellContainer` for global chrome and genuinely wide split layouts such as the marketing header, footer, and homepage hero.
- Use `SectionContainer` for standard marketing sections and most non-dashboard page bodies.
- Use `ReadingContainer` for article content, legal copy, and other long-form reading surfaces.
- Use `CompactContainer` for narrow auth flows.
- Use `FocusContainer` for status pages and single-card flows that need more space.
- Treat full-bleed backgrounds and content width as separate concerns: a section may span the viewport, but its content should still sit inside one semantic container.
- Do not add new ad hoc width systems or scatter `max-w-*` utilities through page modules unless a one-off component truly cannot be expressed with the existing containers.

### Forms and validation

- Use React Hook Form with Zod for form validation.
- Keep schemas close to the form or in a clearly named schema module.
- Handle loading, validation, and error states explicitly.

## 6. Localization and next-intl

### Core policy

- Do not hardcode user-visible language in code. Add copy to both `src/messages/en.json` and `src/messages/zh-Hans.json`.
- Treat free-form business data such as `banReason` as raw content. It does not need translation, but any surrounding UI copy still must follow i18n rules.
- Use stable, semantic message keys for new copy. Existing hash keys are retained only for migration compatibility.
- Shipped UI must respect the active locale and must not mix English with translated copy in the same view.

### Source of truth for locale behavior

- Keep `createNextIntlPlugin()` active in `next.config.ts` and request configuration in `src/i18n/request.ts`.
- Keep locale detection and persistence in `src/lib/i18n/server-locale.ts`, `src/lib/i18n/locale-client.ts`, and `src/proxy.ts`.
- In server code, read request locale through `src/lib/i18n/server-locale.ts`.
- If a locale switch must change the URL for locale-prefixed marketing routes, use canonical `href`s, persist locale, and let the browser navigate.
- Use `LocalizedLink` for links to public marketing routes so the active locale is preserved.
- For numbers and dates, format with the active locale via helpers such as `resolveIntlLocale`. Do not hardcode `en-US`.

### Message usage

- Use `useTranslation()` in synchronous components and `getServerTranslations()` in async Server Components or metadata.
- Pass an explicit `locale` to `getServerTranslations({ locale })` for work detached from the current request, such as email rendering.
- Keep English fallback text at the call site during the migrated-key transition and keep both catalogs in exact key parity.
- Use next-intl rich-text tags for mixed text and React elements. Catalog tag names and call-site values must match exactly.
- Use standard ICU `{name}` placeholders for primitive values and rich-text tags for React nodes. The compatibility adapter supports both forms.
- Mark technical content that browsers should not translate with the standard `translate="no"` attribute.
- Do not branch copy with locale conditionals or pass raw external error text to the UI.
- Prefer full-sentence messages over concatenated fragments.
- Prefer controlled UI message codes over raw strings in state for transient feedback such as payment status errors and checkout results; render the final localized message in JSX at the boundary.
- Real localization and SEO QA must use `pnpm build`, `pnpm start`, and inspect rendered HTML for every supported locale.

## 7. Data, Billing, and Security

- Validate environment variables only through `env.js`.
- Database CLI configuration may validate only `DATABASE_URL` so a one-shot
  migrator does not require unrelated application credentials.
- Keep server and client environment variables separated and validated.
- Preserve the billing provider abstraction. Route payment behavior through `src/lib/billing/provider.ts`.
- Follow existing upload security flow in `src/lib/config/upload.ts` and related server logic.
- Keep webhook handling idempotent and validation-first.
- Do not bypass existing auth, permission, or validation boundaries.

## 8. Database Workflow

- Maintain a single committed migration history in `src/database/migrations`.
- Use `pnpm db:push` only for fast local iteration against disposable or personal development databases.
- Use `pnpm db:generate` to create migration files that will be committed and shared across staging and production.
- Use `pnpm db:migrate` to apply committed migrations to whichever database is selected by `DATABASE_URL`.
- Do not split migration history by environment. Environment differences belong in deployment configuration, not in separate SQL trees.
- In CI/CD, run migrations as a dedicated one-shot release step, not on every app process startup.
- Keep schema, queries, and types aligned when data models change.

## 9. Testing and Verification

- After every meaningful change, run the narrowest relevant checks first, then the broader project checks.
- Minimum expectation for code changes:
  - `pnpm lint`
  - `pnpm type-check`
- Run `pnpm test` when logic, state handling, routing, validation, billing, auth, or i18n behavior changes.
- Run `pnpm build` when changing app structure, configuration, localization behavior, or anything that could affect production compilation.
- Do not mark work complete without reporting what was verified and what was not.

## 10. Commit Policy

- Commit both locale catalogs whenever message keys or copy change.
