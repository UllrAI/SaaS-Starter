# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a production-ready SaaS starter kit built with Next.js 15, featuring authentication, payments, file uploads, and admin management. The codebase uses Chinese documentation but code is in English.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19 + shadcn/ui + Tailwind CSS v4
- **Authentication**: Better-Auth (magic link + OAuth)
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Creem payment provider
- **File Storage**: Cloudflare R2
- **Email**: Resend + React Email
- **Package Manager**: pnpm

## Common Commands

### Development

```bash
pnpm dev              # Start development server with Turbo
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm test             # Run Jest tests with coverage
pnpm prettier:format  # Format code with Prettier
```

### Database Operations

```bash
# Development (use push for rapid iteration)
pnpm db:push          # Push schema changes directly to DB

# Migration-based approach
pnpm db:generate      # Generate migration files (development)
pnpm db:migrate:dev   # Apply migrations (development)

# Production (ALWAYS use migrations, never push)
pnpm db:generate:prod # Generate production migration files
pnpm db:migrate:prod  # Apply migrations to production DB
```

### Admin Management

```bash
pnpm set:admin --email=user@example.com      # Set admin (development)
pnpm set:admin:prod --email=user@example.com # Set admin (production)
```

### Bundle Analysis

```bash
pnpm analyze     # Analyze production bundle
pnpm analyze:dev # Analyze development bundle
```

## Architecture

### App Router Structure

- `app/(auth)/` - Authentication pages (login, signup, sent)
- `app/(pages)/` - Public marketing pages (home, about, pricing, blog)
- `app/dashboard/` - Protected user dashboard
- `app/dashboard/admin/` - Admin panel (super_admin only)
- `app/api/` - API routes (auth, billing, upload, webhooks)

### Role-Based Access Control

Three-tier system: `user` → `admin` → `super_admin`

- Users must be manually promoted to admin via CLI script
- Admin panel access controlled by middleware
- Super admin has full access to configurable table management

### Database Configuration

Two separate configs for environment isolation:

- `database/config.ts` - Development (outputs to `database/migrations/development/`)
- `database/config.prod.ts` - Production (outputs to `database/migrations/production/`)

### Key Components

- **FileUploader**: Advanced file upload with R2 integration, image compression, and progress tracking
- **AdminTableManager**: Generic CRUD operations for any database table
- **Better-Auth**: Magic link authentication with OAuth providers

## Environment Variables

Required variables (see .env.example for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - 32-character encryption key
- `RESEND_API_KEY` - Email service API key
- `CREEM_API_KEY` & `CREEM_ENVIRONMENT` - Payment provider
- R2 variables: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

## Development Guidelines

### Database Workflow

- **Development**: Use `pnpm db:push` for rapid schema iteration
- **Production**: ALWAYS use migration files via `pnpm db:generate:prod` → `pnpm db:migrate:prod`
- Never use `db:push` in production

### Code Patterns

- Follow existing TypeScript strict mode conventions
- Use Zod for validation schemas
- Leverage next-safe-action for API endpoints
- Components follow shadcn/ui patterns with class-variance-authority

### File Upload System

- Client-side direct upload to Cloudflare R2
- Presigned URLs for security
- Built-in image compression and validation
- Progress tracking with error handling

### Admin Panel

- Configurable via `app/dashboard/admin/admin-tables.ts`
- Automatic user relationship filtering
- Generic table operations with type safety

## Security Notes

- Magic link authentication prevents password-related attacks
- Admin promotion requires CLI access (no automatic first-user admin)
- R2 CORS must be configured for direct uploads
- Webhook signature verification for payment events
- Environment variable validation with @t3-oss/env-nextjs

## Content Management

- Keystatic CMS for blog content (development only)
- Disabled in production for security
- Markdown/MDX support with Git-based storage

## Other

- No more than 400 lines in a single document, beyond that need to be split and consider component reusability
- Prioritize checking existing reusable components before development
- Use PascalCase for component naming and camelCase for function naming.
- Prioritize Server Components, use Client Components when interaction is needed.
- All functions should be implemented correctly, do not Mock data or hard-code example data.

## Interface Specification

- The user will chat with me in Chinese. The user-facing interface of the application should be in English.
- Copywriting needs to be SEO optimized
