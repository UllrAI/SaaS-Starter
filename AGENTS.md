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
- Localization: `@lingo.dev/compiler`

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
- Database schema and migrations: `src/database`, `src/database/migrations`
- Email templates: `src/emails`
- Environment validation: `env.js`
- Route protection: `src/proxy.ts`
- Next config: `next.config.ts`

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

### Forms and validation

- Use React Hook Form with Zod for form validation.
- Keep schemas close to the form or in a clearly named schema module.
- Handle loading, validation, and error states explicitly.

## 6. Localization and Lingo

### Core policy

- Do not hardcode user-visible language in code. Use the repository's Lingo-based i18n flow.
- Treat free-form business data such as `banReason` as raw content. It does not need translation, but any surrounding UI copy still must follow i18n rules.
- Source copy should be authored in English unless a feature explicitly requires a different canonical source language.
- Shipped UI must respect the active locale and must not mix English with translated copy in the same view.

### Source of truth for locale behavior

- Keep locale detection and persistence in `src/.lingo/locale-resolver.server.ts` and `src/.lingo/locale-resolver.client.ts`.
- In server code, read request locale through `src/lib/i18n/server-locale.ts`.
- For client-side locale switching, prefer `useLingoContext().setLocale()` for same-route updates.
- If a locale switch must change the URL for locale-prefixed marketing routes, use canonical `href`s, persist locale, and let the browser navigate.
- For numbers and dates, format with the active locale via helpers such as `resolveIntlLocale`. Do not hardcode `en-US`.

### Extraction rules

- Lingo only extracts localizable copy from `.tsx` and `.jsx`.
- Keep translatable copy directly in the JSX render tree.
- Allowed localizable patterns include:
  - JSX text nodes and fragments
  - String literal JSX attributes such as `placeholder`, `alt`, `aria-label`, `title`, and `label`
  - JSX text combined with expressions
- Avoid storing translatable copy in module-level strings, template literals, object maps, or helper-returned string tables.
- Do not branch translated copy with runtime locale conditionals such as `locale === "zh-Hans" ? "..." : "..."`.
- Prefer small JSX subcomponents for reusable copy instead of exported string maps.
- Avoid IIFEs or nested callback structures that hide localizable JSX from extraction when a small subcomponent would be clearer.
- When content must stay unlocalized, use supported patterns such as `data-lingo-skip` as an attribute, not in `className`.

### Lingo integration constraints

- Do not invent `useTranslation`, `FormattedMessage`, `localizeText`, or similar patterns.
- Do not manually implement a parallel i18n system beside Lingo.
- Keep `LingoProvider` at the root layout. Do not convert large trees to client components only to read locale.
- Real translation QA must use a production build: run `pnpm build` and `pnpm start`.

## 7. Data, Billing, and Security

- Validate environment variables only through `env.js`.
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

- When a change touches Lingo outputs, always commit Lingo cache and language files together in the same commit.
- Required include: `src/.lingo/cache/*` and related locale/language output files generated by Lingo.
