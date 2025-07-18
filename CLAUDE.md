# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Development

```bash
pnpm install              # Install dependencies
pnpm run dev             # Start development server
pnpm run build           # Build for production
pnpm run start           # Start production server
pnpm run lint            # Run ESLint
pnpm run type-check      # Run TypeScript compiler check
```

### Testing

```bash
pnpm test                # Run all tests
pnpm run test:watch      # Run tests in watch mode
pnpm run test:coverage   # Run tests with coverage report
pnpm run test -- ComponentName.test.tsx  # Run specific test file
```

### Quality Assurance

```bash
pnpm run lint            # ESLint validation
pnpm run type-check      # TypeScript type checking
pnpm tsc --noEmit        # Type validation without emit
pnpm run build           # Pre-deployment build verification
```

### Database Operations

```bash
pnpm run db:generate     # Generate migration files
pnpm run db:migrate      # Run migrations (production)
pnpm run db:push         # Push schema changes (development)
pnpm run db:studio       # Open Drizzle Studio
pnpm run db:seed         # Seed database with sample data
```

### Bundle Analysis

```bash
pnpm run analyze         # Analyze bundle size with @next/bundle-analyzer
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router and Server Components
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better-Auth with Magic Link via Resend
- **Payments**: Creem payment provider with webhook integration
- **File Storage**: Cloudflare R2 with presigned URL uploads
- **CMS**: Keystatic (local development only)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Email**: React Email with Resend

### Key Patterns

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
- Sessions track device/browser information
- Subscriptions and payments are linked for billing
- Webhook events ensure idempotency

### Directory Structure

This project uses Next.js App Router with a `src` directory structure for better organization and consistency.

#### Core Structure
- `src/` - All application source code
- `styles/` - Global CSS and styling (at root level)
- `public/` - Static assets
- `content/` - CMS content files

#### App Router Organization (src/app/)

- `app/(auth)/` - Authentication pages
- `app/(pages)/` - Public marketing pages
- `app/dashboard/` - Protected user area
- `app/keystatic/` - CMS interface (development only)
- `app/api/` - API routes and webhooks

#### Library Organization (src/lib/)

- `lib/auth/` - Better-Auth configuration and utilities
- `lib/billing/` - Payment provider abstractions
- `lib/config/` - Application constants and configuration
- `lib/database/` - Database utilities and queries

#### Component Co-location (src/components/)

- Page-specific components in `_components/` directories
- Shared UI components in `components/ui/`
- Form components in `components/forms/`

#### Database (src/database/)
- `database/schema.ts` - Database schema definitions
- `database/migrations/` - Migration files
- `database/config.ts` - Database configuration

#### Key Files
- `tsconfig.json` - TypeScript configuration with path mappings for `@/*` to `src/*`
- `jest.config.js` - Jest configuration with proper module resolution for src structure
- `styles/globals.css` - Global styles and Tailwind configuration

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

### UI/UX Guidelines

- **Language**: All interface text in English
- **SEO Optimization**: All copy should be SEO-friendly and descriptive
- **Metadata**: Every page must have appropriate metadata configuration

### Development Workflow

- **Core Feature Changes**: Run `pnpm run lint` and `pnpm tsc --noEmit` for type validation
- **Pre-deployment**: Always run `pnpm run build` to ensure successful production build
- **Quality Gates**: All code must pass linting, type checking, and build verification

### Database Development Workflow

**Development**: Use `pnpm run db:push` for rapid schema iteration without migration files.

**Production**: Always use `pnpm run db:generate` followed by `pnpm run db:migrate` to create traceable migration files.

The schema is defined in `database/schema.ts` with separate connection configurations for different environments.

### Authentication Flow

Better-Auth handles all authentication through magic links sent via Resend. OAuth providers (Google, GitHub, LinkedIn) are configured but optional. Sessions last 30 days with automatic renewal.

### Content Management

Keystatic CMS is configured for local development only (security measure). Blog content uses Markdoc for rendering. Production deployments should use headless CMS or static content.

### Testing Strategy

Jest with React Testing Library. Tests are co-located with source files. Coverage excludes UI-only components. Run `pnpm test` to see current coverage metrics.

### Important Configuration Files

- `env.js` - Environment variable validation
- `database/schema.ts` - Database schema definitions
- `lib/config/products.ts` - Product and pricing configuration
- `keystatic.config.ts` - CMS configuration
- `middleware.ts` - Route protection and redirects

### Security Considerations

- File uploads are validated server-side before R2 storage
- Environment variables are validated at startup
- CMS access is restricted to local development
- Rate limiting capabilities are built-in
- Never bypass established validation patterns
