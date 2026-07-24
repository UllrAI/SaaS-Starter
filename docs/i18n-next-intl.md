# next-intl workflow

This project uses `next-intl` with the Next.js App Router. The plugin is
configured in `next.config.ts`, and request locale/message loading lives in
`src/i18n/request.ts`.

## Files

- Locale configuration: `src/lib/config/i18n.ts`
- Locale routing: `src/lib/config/i18n-routing.ts` and `src/proxy.ts`
- Request locale: `src/lib/i18n/server-locale.ts`
- Message catalogs: `src/messages/en.json` and `src/messages/zh-Hans.json`
- Translation adapters: `src/lib/i18n/translation`
- Locale-aware links: `src/components/localized-link.tsx`

## Adding copy

1. Add the same stable, semantic key to both message catalogs.
2. Use `useTranslation()` in synchronous components.
3. Use `getServerTranslations()` in async Server Components and metadata.
4. For email or other work detached from the request, pass the locale
   explicitly with `getServerTranslations({ locale })`.
5. Use standard ICU `{name}` placeholders for strings, numbers, and dates.
   Use next-intl rich-text tags when a message contains React elements.

Existing hash-shaped keys are preserved from the previous localization system
to keep the migration lossless. New code should use descriptive keys.

## Routing and SEO

English marketing URLs are unprefixed. Simplified Chinese URLs use the
`/zh-Hans` prefix. On an unprefixed marketing URL, the saved locale cookie
takes precedence over `Accept-Language`. A supported non-English preference
receives a temporary `307` redirect to its localized URL; unsupported
languages fall back to the canonical English URL. Explicit locale-prefixed
URLs do not undergo language detection.

Negotiated redirects vary on `Cookie` and `Accept-Language`. All unprefixed
marketing responses that participate in language detection are private and
not cacheable, which prevents an upstream shared cache from bypassing
negotiation or replaying one visitor's language choice. Locale-prefixed pages
remain statically generated and cacheable. Locale switcher links remain
explicit and crawlable. Canonical, `hreflang`, and `x-default` metadata always
point to stable language URLs.

When copy or routing changes, run:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm start
```

Inspect the rendered HTML for each locale, including `<html lang>`, title,
description, canonical, hreflang, internal links, and visible body copy.
