# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Development

```bash
pnpm install              # Install dependencies
pnpm run dev             # Start development server with Turbo
pnpm run build           # Build for production
pnpm run start           # Start production server
pnpm run lint            # Run ESLint
pnpm run type-check      # Run TypeScript compiler check
pnpm tsc --noEmit        # Type validation without emit
```

### Testing

```bash
pnpm test                # Run all tests
pnpm run test:coverage   # Run tests with coverage report
pnpm run test -- ComponentName.test.tsx  # Run specific test file
```

### Database Operations

```bash
pnpm run db:generate     # Generate migration files (development)
pnpm run db:generate:prod # Generate migration files (production)
pnpm run db:migrate:dev  # Run dev migrations
pnpm run db:migrate:prod # Run production migrations
pnpm run db:push         # Push schema changes (development only)
pnpm run db:studio       # Open Drizzle Studio
pnpm run db:seed         # Seed database with sample data
```

### Quality Assurance & Utilities

```bash
pnpm run analyze         # Analyze bundle size with @next/bundle-analyzer
pnpm run prettier:check  # Check code formatting
pnpm run prettier:format # Format code with Prettier
pnpm run set:admin       # Promote user to admin (development)
pnpm run set:admin:prod  # Promote user to admin (production)
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router and Server Components
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better-Auth with Magic Link via Resend
- **Payments**: Creem payment provider with webhook integration
- **File Storage**: Cloudflare R2 with presigned URL uploads
- **Content**: Content Collections with repository-managed Markdown
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Email**: React Email with Resend
- **Package Manager**: pnpm

### Key Architectural Patterns

#### Payment Provider Abstraction

The billing system uses a provider pattern. All payment logic goes through `lib/billing/provider.ts`, making it easy to switch providers. Current implementation uses Creem but supports extending to other providers.

#### Environment Variable Management

Uses `@t3-oss/env-nextjs` with Zod validation in `env.js`. Server and client variables are strictly separated and validated at runtime.

#### File Upload Security

All uploads go through:

1. Server-side validation (`lib/config/upload.ts`)
2. Presigned URL generation for direct R2 uploads
3. Database tracking in the `uploads` table
4. Type and size restrictions enforced

#### Database Schema Organization

- Users have role-based permissions (user, admin, super_admin)
- Sessions track device/browser information with parsed user agent fields
- Subscriptions and payments are linked for billing
- Webhook events ensure idempotency
- Accounts table for OAuth provider integration

### Directory Structure

This project uses Next.js App Router with a `src` directory structure for better organization and consistency.

#### Core Structure

- `src/` - All application source code
- `styles/` - Global CSS and styling (at root level)
- `public/` - Static assets
- `content/` - CMS content files

#### App Router Organization (src/app/)

- `app/(auth)/` - Authentication pages (login, signup, auth/sent)
- `app/(pages)/` - Public marketing pages
- `app/dashboard/` - Protected user area
- `app/api/` - API routes and webhooks

#### Library Organization (src/lib/)

- `lib/auth/` - Better-Auth configuration and utilities
- `lib/billing/` - Payment provider abstractions
- `lib/config/` - Application constants and configuration
- `lib/database/` - Database utilities and queries
- `lib/actions/` - Server actions
- `lib/admin/` - Admin functionality

#### Component Co-location (src/components/)

- Page-specific components in `_components/` directories
- Shared UI components in `components/ui/`
- Form components in `components/forms/`

#### Database (src/database/)

- `database/schema.ts` - Database schema definitions
- `database/migrations/` - Migration files
- `database/config.ts` - Development database configuration
- `database/config.prod.ts` - Production database configuration

#### Key Configuration Files

- `env.js` - Environment variable validation
- `tsconfig.json` - TypeScript configuration with path mappings for `@/*` to `src/*`
- `jest.config.js` - Jest configuration with proper module resolution for src structure
- `proxy.ts` - Route protection and redirects
- `lib/config/products.ts` - Product and pricing configuration
- `content-collections.ts` - Content Collections configuration

## Code Quality Standards

### TypeScript Requirements

- **Strict Type Safety**: Never use `any` type - follows `@typescript-eslint/no-explicit-any` rule
- **File Size Limit**: Maximum 400 lines per file - split larger files and consider component reusability
- **Component Reuse**: Always check for existing reusable components before creating new ones
- **Naming Conventions**:
  - Components: PascalCase (`UserProfile`, `PaymentForm`)
  - Functions: camelCase (`getUserData`, `handleSubmit`)

### Next.js Best Practices

- **Server Components First**: Default to Server Components, use Client Components only when interactivity is needed
- **No Mock Data**: All functionality must be properly implemented - no mock data or hardcoded examples
- **Real Implementation**: Every feature should have complete, working implementation

### i18n With Lingo

- **Resolver Source of Truth**: Keep locale detection and persistence in `.lingo/locale-resolver.server.ts` and `.lingo/locale-resolver.client.ts`. Do not fork locale logic inside random components.
- **Server Locale Access**: In app code, read locale through `src/lib/i18n/server-locale.ts` so request-level locale reads are cached and stay server-only.
- **Client Locale Switching**: Prefer `useLingoContext().setLocale()` for same-route locale updates. If the URL itself must change for locale-prefixed marketing routes behind `proxy` rewrites, render real canonical `href`s, persist the locale on click, and let the browser navigate. App Router route replacement can treat prefixed and rewritten routes as the same internal page and fail to update the browser URL.
- **Locale Display Names**: Language pickers should show each language in its own native name, for example `English` and `简体中文`. Do not translate locale names into the currently active locale.
- **Boundary Discipline**: Keep `LingoProvider` in the root layout, but do not turn whole trees into client components just to access locale. Push `'use client'` down to the interactive leaf.
- **Extraction-Friendly Copy**: Do not store translatable copy as raw strings or `ReactNode` values inside module-level config arrays/objects. Keep localized text in component render functions, or store component references like `Title`/`Description` so Lingo can extract them reliably.
- **No Runtime Locale Branching For Copy**: Never render copy with locale conditionals such as `isChineseLocale ? "登录" : "Login"` or `locale.startsWith("zh") ? ... : ...`. Locale-dependent UI text must come from extraction-friendly JSX copy components, typed component maps, or Lingo hooks so the source stays DRY and translation extraction remains reliable.
- **Production Translation QA**: Do not treat `pnpm dev` pseudotranslator output as final translation verification. For real locale QA, run `pnpm build` and `pnpm start`, then check the built app.
- **Locale Verification Scope**: Locale-prefixed marketing routes can be verified via `/zh-Hans/...`. Non-prefixed routes such as `/login` inherit locale from resolver state, so verify them with the locale cookie/storage already set instead of assuming `/zh-Hans/login` should exist.

### UI/UX Guidelines

- **Language**: Author source copy in English unless the feature requires another canonical source language. Shipped UI must respect the active locale and must not mix English and translated strings on the same view.
- **SEO Optimization**: All copy should be SEO-friendly and descriptive
- **Metadata**: Every page must have appropriate metadata configuration

## Development Workflow

### Pre-deployment Checklist

1. Run `pnpm run lint` for code quality
2. Run `pnpm tsc --noEmit` for type validation
3. Run `pnpm run build` to ensure successful production build
4. Run `pnpm test` to verify all tests pass

### Database Development Workflow

**Development**: Use `pnpm run db:push` for rapid schema iteration without migration files.

**Production**: Always use `pnpm run db:generate:prod` followed by `pnpm run db:migrate:prod` to create traceable migration files.

### Testing Strategy

- Jest with React Testing Library
- Tests are co-located with source files
- Coverage excludes UI-only components
- Run `pnpm test` to see current coverage metrics
- Use predefined mock interfaces in `jest.setup.ts` for sessions, users, subscriptions

## Key Implementation Details

### Authentication Flow

Better-Auth handles all authentication through magic links sent via Resend. OAuth providers (Google, GitHub, LinkedIn) are configured but optional. Sessions last 30 days with automatic renewal. User roles: user, admin, super_admin.

- Auth screen loading should be action-scoped: only the button the user triggered should change copy or show an inline spinner. Other auth actions should be disabled to prevent duplicate submissions, but their labels should remain unchanged.

### Content Management

Blog content is stored as Markdown files in `content/blog/` and indexed through Content Collections at build time. Authors live in `content/authors/`. There is no runtime CMS dashboard or content API.

### Payment Integration

- Creem payment provider with webhook integration
- Subscription and one-time payment support
- Customer management with provider customer ID linking
- Webhook events for payment status updates

### Security Considerations

- File uploads are validated server-side before R2 storage
- Environment variables are validated at startup with Zod schemas
- CMS access is restricted to local development
- Rate limiting capabilities are built-in
- Never bypass established validation patterns
- All authentication routes are protected by middleware

### Common Development Tasks

#### Adding New Database Tables

1. Define the schema in `src/database/schema.ts`
2. Run `pnpm run db:push` for development testing
3. Run `pnpm run db:generate:prod` for production migrations
4. Update database types and utilities as needed

#### Creating New API Routes

1. Add route in `src/app/api/` following Next.js App Router conventions
2. Implement proper error handling and validation
3. Add appropriate TypeScript types
4. Test with both success and error cases

#### Adding New Components

1. Check existing components in `src/components/ui/` first
2. Follow shadcn/ui patterns for new UI components
3. Use TypeScript interfaces for props
4. Keep components under 400 lines
5. Co-locate page-specific components in `_components/` directories
6. Keep localizable copy directly in JSX text nodes/fragments or JSX string attributes (`placeholder`/`alt`/`aria-label`/`title`)
7. For reusable copy, prefer small JSX subcomponents instead of exported string maps/helpers

#### Working with Forms

1. Use React Hook Form with Zod validation
2. Define schemas in form components or separate schema files
3. Handle loading states and error messages
4. Use proper TypeScript types for form data

### Environment Variables

All environment variables are validated in `env.js` using Zod schemas. Never add variables without proper validation. Key variables include:

- Database connection strings
- Authentication secrets
- Payment provider credentials
- Email service configuration
- Cloudflare R2 credentials
- CMS configuration (development only)

### Performance Considerations

- Use Next.js 15 Turbo for faster development
- Implement proper loading states with React Suspense
- Optimize images with Next.js Image component
- Use bundle analyzer to identify size issues
- Consider database query optimization with proper indexes

# Localization

This project uses Lingo.dev Compiler for localization.

Lingo.dev Compiler is a cutting-edge localization tool for React-based apps.

## Warning

- Lingo.dev Compiler is not like any other localization tool.
- You must not make assumptions about how Lingo.dev Compiler works.
- If you make assumptions, the user's app will break.

## How it works

Unlike many other localization tools, Lingo.dev Compiler:

- Traverses the Abstract Syntax Tree (AST) of the app's source code
- Deterministically extracts localizable content
- Uses large language models to automatically localize content

## Unsupported features

Unlike many other localization tools, Lingo.dev Compiler does not have:

- Any kind of `useTranslation` hook (or similar)
- Any kind of `FormattedMessage` component (or similar)
- Any kind of `localizeText` method (or similar)

These kinds of features are diametrically opposed to the entire purpose, philosophy, and behavior of Lingo.dev Compiler.

You must always carefully understand and consider these fundamental differences from other tools.

## Supported file extensions

These rules are only relevant to files with `.jsx` and `.tsx` extensions.

Files that don't have these extensions are invisible to Lingo.dev Compiler and are therefore out of scope.

## Auto-generated files

At build time, Lingo.dev Compiler auto-generates the following files:

- `meta.json` (for storing extracted content)
- `dictionary.js` (for storing translated content)

You must not edit these files. You can read them for debugging purposes and to explain things to the user, but that's it.

## Responsibilities

You have the following responsiblities:

- Ensure that content that should be localized is in a localizable format.
- Ensure that content that should not be localized is in an unlocalizable format.
- Help the user understand why (or why not) content is being localized.

That's it.

Lingo.dev Compiler will take care of everything else. Do not get in its way.

## Localizable content

This section lists the kinds of content that Lingo.dev Compiler extracts and localizes.

This list is exhaustive. If a certain kind of content is not listed here, assume that it is not localizable.

### JSX elements

```tsx
import React from "react";

export function App() {
  return <div>This text will be localized.</div>;
}
```

### JSX fragments

#### Syntax 1

```tsx
import React from "react";

export function App() {
  return <React.Fragment>This text will be localized.</React.Fragment>;
}
```

#### Syntax 2

```tsx
import { Fragment } from "react";

export function App() {
  return <Fragment>This text will be localized.</Fragment>;
}
```

#### Syntax 3

```tsx
import React from "react";

export function App() {
  return <>This text will be localized.</>;
}
```

### Conditional elements or fragments

```tsx
import React, { Fragment, useState } from "react";

export function App() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {isVisible && <div>This text will be localized.</div>}
      {isVisible && (
        <React.Fragment>This text will be localized.</React.Fragment>
      )}
      {isVisible && <Fragment>This text will be localized.</Fragment>}
      {isVisible && <>This text will be localized.</>}
    </>
  );
}
```

### `alt` attribute values

```tsx
import React from "react";

export function App() {
  return <img src="/logo.png" alt="This text will be localized" />;
}
```

### `aria-label` attribute values

```tsx
import React from "react";

export function App() {
  return <button aria-label="This text will be localized">×</button>;
}
```

### `label` attribute values

```tsx
import React from "react";

export function App() {
  return (
    <select>
      <option value="option1" label="This text will be localized">
        This text will be localized
      </option>
      <option value="option2" label="This text will be localized">
        This text will be localized
      </option>
    </select>
  );
}
```

### `placeholder` attribute values

```tsx
import React from "react";

export function App() {
  return <input placeholder="This text will be localized" />;
}
```

### `title` attribute values

```tsx
import React from "react";

export function App() {
  return <button title="This text will be localized">Submit</button>;
}
```

## Unlocalizable content

This section lists the kinds of content that Lingo.dev Compiler does not extract or localize.

Unlike the "Localizable content" list, this list is not exhaustive.

### `data-` attributes

```tsx
import React from "react";

export function App() {
  return <div data-testid="This text will not be localized">Content</div>;
}
```

### String literals

```tsx
import React from "react";

const exampleText = "This text will not be localized.";

export function App() {
  return <div>{exampleText}</div>;
}
```

### Template literals

```tsx
import React from "react";

const exampleText = `This text will not be localized.`;

export function App() {
  return <div>{exampleText}</div>;
}
```

### Conditional strings

```tsx
import { Fragment, useState } from "react";

export function App() {
  const [isVisible, setIsVisible] = useState(false);

  return <>{isVisible && "This text will not be localized."}</>;
}
```

## Restrictions

- Do not localize content yourself.
- Do not explicitly load localized content into the app.
- Do not hallucinate React hooks (e.g., `useTranslation`).
- Do not hallucinate React components (e.g., `FormattedMessage`).
- Do not hallucinate methods (e.g., `localizeText`).

## i18n 方案（公共组件文案约束）

- 原因：Lingo 编译器通过 Babel AST 解析，仅会提取 JSX 渲染树内的可翻译内容；变量/对象中的字符串不会被翻译。
- 可提取内容（示例）：JSX 文本节点、JSX fragment 文本、JSX 字符串属性（`placeholder`/`alt`/`aria-label`/`title`/`label`）、以及 JSX 文本 + 表达式组合（如 `<p>Hello {name}</p>`）。
- 所有需要本地化的文案必须以 JSX 文本节点或 JSX fragment 直接出现在组件渲染树内。
- 避免在组件外部用 helper/switch 返回 JSX 文案；需要复用时，封装小型 JSX 组件并在渲染树内使用；列表用组件内联数组定义 `title`/`desc` 等内容。
- 避免将可本地化文案放在字符串变量、模板字面量或对象映射表中（这些不会被提取）；保持文案与 JSX 直接相邻。
- 需要复用文案时，优先封装小型 JSX 组件（如 `StylePresetLabel`），不要导出字符串映射。
- 动态文本用 JSX 组合（例如 `<span data-lingo-skip>{count}</span> <>items</>`），避免模板字符串拼接；`data-lingo-skip` 必须是属性，不要写在 `className` 中。
- 避免 IIFE/匿名函数包裹 JSX（例如 `{(() => { ... })()}`）；避免在 `map`/回调等嵌套函数中直接写 JSX 文案，改用子组件或将文案提升到渲染树。
- `placeholder`/`alt`/`aria-label`/`title` 等属性若是可本地化文案，必须在 JSX 中直接写字符串字面量，避免在组件外先拼接再传入。
- 如需自定义 locale 解析器，路径应为 `src/.lingo/locale-resolver.server.ts` 与 `src/.lingo/locale-resolver.client.ts`（受 `sourceRoot=src` 与 `lingoDir=.lingo` 影响）。
- 语言切换与读取统一使用 `@lingo.dev/compiler/react`（当前使用 `useLingoContext` 提供 `locale`/`setLocale`，或 `useLocale`/`setLocale`），避免混用 `lingo.dev/react/client` 造成 locale/cookie 不一致。
- 数字/日期格式化使用当前 locale（如 `useLingoContext().locale` + `resolveIntlLocale` 或 `resolveLocale`），避免写死 `en-US` 或省略 locale。
