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
- **CMS**: Keystatic (local development only)
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
- `app/keystatic/` - CMS interface (development only)
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
- `middleware.ts` - Route protection and redirects
- `lib/config/products.ts` - Product and pricing configuration
- `keystatic.config.ts` - CMS configuration

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

### Content Management
Keystatic CMS is configured for local development only (security measure). Blog content uses Markdoc for rendering. Production deployments should use headless CMS or static content.

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