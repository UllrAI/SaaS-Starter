# Lingo.dev i18n Workflow

This project uses `@lingo.dev/compiler` with Next.js App Router. The integration is configured through `withLingo()` in `next.config.ts`, and compiler options live in `lingo.config.ts`.

## Project Setup

- Source locale: `en`
- Target locales: `src/lib/config/i18n.ts`
- Locale routing: `src/lib/config/i18n-routing.ts`, `src/proxy.ts`
- Server locale helper: `src/lib/i18n/server-locale.ts`
- Client locale switcher: `src/components/locale-switcher.tsx`
- Lingo files: `src/.lingo/`

This repository uses `sourceRoot: "src"` and `lingoDir: ".lingo"`, so Lingo files intentionally live under `src/.lingo/`.

## Daily Workflow

When adding or changing user-visible copy, generate translations:

```bash
LINGO_BUILD_MODE=translate pnpm build
```

This uses the OpenRouter model from `lingo.config.ts`, so `OPENROUTER_API_KEY` must be set.

For deterministic production-style validation and deployment builds:

```bash
LINGO_BUILD_MODE=cache-only pnpm build
```

Commit `src/.lingo/cache/*` together with source copy changes. Do not commit temporary Lingo runtime files such as logs, metadata build files, LMDB files, or SQLite files.

## Authoring Rules

- Author source UI copy in English unless a feature intentionally uses another source language.
- Keep translatable copy in `.tsx` or `.jsx` render paths.
- Do not add a second i18n system such as `useTranslation`, `FormattedMessage`, or custom copy catalogs.
- Use `data-lingo-skip` for content that must stay unlocalized.
- Use `data-lingo-override` only for reviewed brand, legal, technical, or marketing copy.
- For localizable metadata, keep `title`, `description`, Open Graph, and Twitter fields visible in the route module's returned metadata object.
- Avoid expression template literals such as `` `${COMPANY_NAME} ...` `` for localizable metadata.

## Upgrades

`@lingo.dev/compiler` is still evolving. Before upgrading it, check the official docs, changelog, and installed package output for breaking changes, especially custom locale resolver exports, build modes, and metadata extraction behavior. After upgrading, verify with `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`.
