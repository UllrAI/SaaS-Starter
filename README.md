# UllrAI SaaS Starter Kit

[中文版](README.zh-CN.md) | English | [Changelog](CHANGELOG.md) | [Roadmap](ROADMAP.md)

This is a free, open-source, production-ready full-stack SaaS starter kit designed to help you launch your next project at unprecedented speed. It integrates modern web development tools and practices to provide you with a solid foundation.

It is also an agent-friendly SaaS template: humans use browser sessions, scripts and coding agents use API keys, and local tools can sign in through a browser-approved CLI device flow.

![UllrAI SaaS Starter Kit](./public/og.png)

## ✨ Features

This starter kit provides a comprehensive set of powerful features to help you quickly build full-featured SaaS applications:

- **Authentication (Better-Auth + Resend):** Integrated with [Better-Auth](https://better-auth.com/), providing secure magic link login and third-party OAuth functionality. Uses [Resend](https://resend.com/) for reliable email delivery with Mailchecker integration to avoid temporary emails.
- **Machine Auth for APIs and Agents:** Includes per-user API keys, CLI access tokens, refresh-token rotation, and a versioned `/api/v1/*` surface for machine clients.
- **Modern Web Framework (Next.js 16 + TypeScript):** Built on the latest [Next.js 16](https://nextjs.org/) with App Router and Server Components. The entire project uses strict TypeScript type checking.
- **Internationalization (next-intl):** Server-rendered localization with explicit catalogs, locale-aware routing, localized metadata, and canonical hreflang output. See [docs/i18n-next-intl.md](docs/i18n-next-intl.md).
- **Database & ORM (Drizzle + PostgreSQL):** Uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations with deep PostgreSQL integration. Supports schema migrations and optimized queries.
- **Payments & Subscriptions (Creem):** Integrated with [Creem](https://creem.io/) as the payment provider for easy subscription and one-time payment handling.
- **UI Component Library (shadcn/ui + Tailwind CSS):** Built with [shadcn/ui](https://ui.shadcn.com/), an accessible, composable component library based on Radix UI and Tailwind CSS with built-in theme support.
- **Form Handling (Zod + React Hook Form):** Powerful, type-safe form validation through [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/).
- **File Upload (Cloudflare R2):** Secure file upload system based on Cloudflare R2, supporting client-side direct upload with various file type and size restrictions.
- **Blog System (Content Collections):** Uses [Content Collections](https://www.content-collections.dev/) with plain Markdown files for type-safe blog content, metadata generation, and sitemap output.
- **Agent-Friendly Developer Workflow:** Ships with a first-party `saas-cli`, browser-approved device login, API key management, and a dedicated Developer Access workspace for reviewing authorized CLI sessions.
- **Code Quality & Verification:** Built-in ESLint, Prettier, Jest, and Playwright smoke tests to keep critical flows from regressing.

---

<p align="center">
  <a href="https://ko-fi.com/visoar" rel="nofollow">
    <img src="https://camo.githubusercontent.com/dba0df5d5ebd8c8897cceebfd5bdf7572e6242686daedda0dca714e60420ee7c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4275795f4d655f415f436f666665652d537570706f72745f4d795f576f726b2d4646444430303f7374796c653d666f722d7468652d6261646765266c6f676f3d6275792d6d652d612d636f66666565266c6f676f436f6c6f723d626c61636b" alt="Buy Me A Coffee" width="250" data-canonical-src="https://img.shields.io/badge/Buy_Me_A_Coffee-Support_My_Work-FFDD00?style=for-the-badge&amp;logo=buy-me-a-coffee&amp;logoColor=black" style="max-width: 100%;">
  </a>
</p>

<p align="center">
  If you like this project and want to support my work, consider buying me a coffee! ☕
</p>

## 🛠️ Tech Stack

| Category            | Technology                                                                                                                                             |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**       | [Next.js](https://nextjs.org/) 16                                                                                                                      |
| **Language**        | [TypeScript](https://www.typescriptlang.org/)                                                                                                          |
| **UI**              | [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (icons) |
| **Auth**            | [Better-Auth](https://better-auth.com/)                                                                                                                |
| **Database**        | [PostgreSQL](https://www.postgresql.org/)                                                                                                              |
| **ORM**             | [Drizzle ORM](https://orm.drizzle.team/)                                                                                                               |
| **Payments**        | [Creem](https://creem.io/)                                                                                                                             |
| **Email**           | [Resend](https://resend.com/), [React Email](https://react.email/)                                                                                     |
| **Forms**           | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)                                                                               |
| **Deployment**      | [Zeabur](https://zeabur.com/) or Docker                                                                                                                |
| **Package Manager** | [pnpm](https://pnpm.io/)                                                                                                                               |

## 🚀 Quick Start

### 1. Environment Setup

Ensure you have the following software installed in your development environment:

- [Node.js](https://nodejs.org/en/) 22 or newer
- [pnpm](https://pnpm.io/installation)

### 2. Project Clone & Installation

```bash
# Clone the repository
git clone https://github.com/ullrai/saas-starter.git

# Enter project directory
cd saas-starter

# Install dependencies with pnpm
pnpm install
```

### 3. Environment Configuration

The project is configured through environment variables. First, copy the example file:

```bash
cp .env.example .env
```

Then edit the `.env` file and fill in all required values.

#### Environment Variables

| Variable Name                    | Description                                                     | Example                                             |
| :------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------- |
| `DATABASE_URL`                   | **Required.** PostgreSQL connection string.                     | `postgresql://user:password@localhost:5432/db_name` |
| `RATE_LIMIT_IP_HEADER`           | Client-IP header overwritten by your trusted ingress.           | Platform-specific                                   |
| `NEXT_PUBLIC_APP_URL`            | **Required.** Public URL of your deployed app.                  | `http://localhost:3000` or `https://yourdomain.com` |
| `BETTER_AUTH_SECRET`             | **Required.** Random session secret, at least 32 characters.    | Generate with `openssl rand -base64 32`             |
| `RESEND_API_KEY`                 | **Required.** Resend API Key for sending emails.                | `re_xxxxxxxxxxxxxxxx`                               |
| `RESEND_EMAIL_FROM`              | **Required.** Sender on a domain verified in Resend.            | `noreply@your-verified-domain.com`                  |
| `CREEM_API_KEY`                  | **Required.** Key matching the selected Creem environment.      | `creem_test_...` or `creem_...`                     |
| `CREEM_ENVIRONMENT`              | **Required.** Creem environment mode.                           | `test_mode` or `live_mode`                          |
| `CREEM_WEBHOOK_SECRET`           | **Required.** Creem webhook secret.                             | `whsec_your_webhook_secret`                         |
| `R2_ENDPOINT`                    | **Required.** Cloudflare R2 API endpoint.                       | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`     |
| `R2_ACCESS_KEY_ID`               | **Required.** R2 access key ID.                                 | `your_r2_access_key_id`                             |
| `R2_SECRET_ACCESS_KEY`           | **Required.** R2 secret access key.                             | `your_r2_secret_access_key`                         |
| `R2_BUCKET_NAME`                 | **Required.** R2 bucket name.                                   | `your_r2_bucket_name`                               |
| `R2_PUBLIC_URL`                  | **Required.** Public access URL for R2 bucket.                  | `https://your-bucket.your-account.r2.dev`           |
| `UPLOAD_CLEANUP_SECRET`          | **Required.** 32+ character bearer secret for upload cleanup.   | Generate with `openssl rand -base64 32`             |
| `UPLOAD_DAILY_QUOTA_BYTES`       | Optional rolling 24-hour upload quota per user.                 | `1073741824` (1 GiB)                                |
| `UPLOAD_TOTAL_QUOTA_BYTES`       | Optional total stored and reserved bytes per user.              | `5368709120` (5 GiB)                                |
| `UPLOAD_LEGACY_COMPLETION_SINCE` | Optional ISO-8601 start of the bounded v1 compatibility window. | Set with `UPLOAD_LEGACY_COMPLETION_UNTIL` only      |
| `UPLOAD_LEGACY_COMPLETION_UNTIL` | Optional ISO-8601 end of the bounded v1 compatibility window.   | At most 24 hours after the matching start           |
| `GITHUB_CLIENT_ID`               | _Optional._ GitHub OAuth Client ID.                             | `your_github_client_id`                             |
| `GITHUB_CLIENT_SECRET`           | _Optional._ GitHub OAuth Client Secret.                         | `your_github_client_secret`                         |
| `GOOGLE_CLIENT_ID`               | _Optional._ Google OAuth Client ID.                             | `your_google_client_id`                             |
| `GOOGLE_CLIENT_SECRET`           | _Optional._ Google OAuth Client Secret.                         | `your_google_client_secret`                         |
| `LINKEDIN_CLIENT_ID`             | _Optional._ LinkedIn OAuth Client ID.                           | `your_linkedin_client_id`                           |
| `LINKEDIN_CLIENT_SECRET`         | _Optional._ LinkedIn OAuth Client Secret.                       | `your_linkedin_client_secret`                       |

> **Tip:** You can generate a secure key using the following command:
> `openssl rand -base64 32`
>
> **Optional local CLI auth:** for scripts, local agents, or quick terminal access, you can export `SAAS_CLI_API_KEY=ssk_...` instead of storing credentials in the CLI config.

#### Analytics

No analytics provider or tracking script is bundled. Add your own provider only when needed, and implement a real consent flow before loading non-essential cookies or trackers in jurisdictions where consent is required.

#### Creem product setup

Test and live product IDs are intentionally separate in
`src/lib/config/products.ts`. Set `CREEM_ENVIRONMENT` and its matching API key,
then run `pnpm creem:sync-products`. The command reuses or creates the catalog
products and updates only the selected environment namespace. Review and commit
that configuration change before deploying. Checkout fails closed when the
active environment has no configured product ID.

### 4. Database Setup

This project uses a single Drizzle config file, `src/database/config.ts`, and a single committed migration history in `src/database/migrations/`. The target database is selected only by `DATABASE_URL`.

#### Local development

For fast local iteration against your own database:

```bash
pnpm db:push
```

If the schema change should be reviewed, committed, or shared with other environments, create and apply a real migration instead:

```bash
pnpm db:generate
pnpm db:migrate
```

#### Staging and production

Shared environments should use committed SQL migrations only:

```bash
# 1. Generate and commit the migration from your schema change
pnpm db:generate

# 2. Run the committed migration once against the target DATABASE_URL
pnpm db:migrate

# 3. Deploy the application after the migration succeeds
```

> **Recommended release practice**
>
> - **Never** use `pnpm db:push` in staging or production.
> - Keep one migration history for all environments. Do not split migrations into dev/prod trees.
> - Run `pnpm db:migrate` as a dedicated one-shot release step in CI/CD or your deploy platform.
> - Do **not** run migrations on every application process startup.
> - Make schema changes backward-compatible when possible, so app rollout and migration timing stay safe.

### 5. Content Management (Content Collections)

The project uses Content Collections plus plain Markdown files for blog content. Posts live in locale-scoped paths such as `content/blog/en/*.md` and `content/blog/zh-Hans/*.md`, authors live in `content/authors/*.json`, and build-time generation produces typed collections for the blog pages and sitemap.

- **Authoring workflow:** Add or edit posts directly in the repository with frontmatter and Markdown content.
- **Generated content data:** Run `pnpm content:build` to refresh the generated collections manually. The Next.js plugin handles development and production builds; test and type-check scripts invoke the generator explicitly.
- **Production behavior:** There is no CMS admin route or runtime content API. All blog content is built from the repository content files.

### 6. Agent-Friendly API and CLI Auth

This starter distinguishes clearly between human auth and machine auth:

- **Browser users:** Better Auth session cookies for the web app
- **Server-to-server and agent access:** user-managed API keys
- **Local developer tools:** browser-approved device login via `saas-cli`

What ships today:

- versioned machine endpoints under `/api/v1/*`
- API key creation and revocation in Dashboard Settings
- CLI session review and revocation in Dashboard Settings
- a terminal workflow for signing in from local tools without reusing browser session tokens

Quick examples:

```bash
# Sign in a local CLI through the browser
pnpm saas-cli -- auth login --base-url http://localhost:3000

# Check current CLI auth state
pnpm saas-cli -- auth status --base-url http://localhost:3000

# Use an API key for scripts or coding agents
SAAS_CLI_API_KEY=ssk_your_key_here pnpm saas-cli -- auth status --base-url http://localhost:3000
```

The web app exposes management surfaces at `/dashboard/developer` for both API keys and authorized CLI sessions.

### 7. Start Development Server

```bash
pnpm dev
```

Now your application should be running at [http://localhost:3000](http://localhost:3000)!

### 8. Admin Account Setup

For security reasons, the first registered user is not promoted automatically. Use the admin script after the user has signed up normally:

```bash
pnpm set:admin --email=your-email@example.com
```

The command loads `.env` if it exists and otherwise uses the current process environment, so the same command works locally and on a server.

After successful execution, the user receives `super_admin` privileges and can access `/dashboard/admin`.

**Security tips**

- Grant this role only to trusted users.
- Run the command in a secure environment with the correct `DATABASE_URL`.

## 📜 Available Scripts

#### Application Scripts

| Script                 | Description                                                    |
| :--------------------- | :------------------------------------------------------------- |
| `pnpm dev`             | Start development server.                                      |
| `pnpm build`           | Build application for production.                              |
| `pnpm start`           | Start production server.                                       |
| `pnpm saas-cli`        | Run the first-party CLI for device login and API verification. |
| `pnpm lint`            | Check code for linting errors.                                 |
| `pnpm dead-code:check` | Detect unused files, exports, and dependencies.                |
| `pnpm type-check`      | Run TypeScript type checking.                                  |
| `pnpm test`            | Run the Jest test suite.                                       |
| `pnpm test:coverage`   | Run Jest and generate a coverage report.                       |
| `pnpm test:e2e`        | Build and run Playwright E2E smoke tests.                      |
| `pnpm prettier:format` | Format all code using Prettier.                                |
| `pnpm set:admin`       | Promote specified email user to super admin.                   |

## 🧪 E2E Testing

This repository includes a Playwright smoke test suite in `e2e/` for the most important browser-level flows:

- unauthenticated dashboard redirect
- authenticated dashboard access
- admin permission gating
- locale canonicalization for marketing routes
- API key creation and machine-auth verification
- browser-approved device auth for CLI sign-in

## Layout Widths

- Use `ShellContainer` for the marketing header, footer, and other truly wide layouts.
- Use `SectionContainer` for standard marketing sections and non-dashboard page bodies.
- Use `ReadingContainer` for blog articles, legal pages, and other long-form reading surfaces.
- Use `CompactContainer` for auth flows.
- Use `FocusContainer` for payment status and other centered cards that need more space.
- Keep full-bleed backgrounds separate from content width. Backgrounds can span the viewport while content stays inside one semantic container.

Run the suite with:

```bash
pnpm test:e2e
```

The Playwright runner starts the production server through `pnpm start` and enables a test-only session route with `E2E_TEST_MODE=true`. That route requires an explicit `E2E_TEST_SECRET` of at least 32 characters, signs the test cookie with that secret, and is disabled for non-local production deployments. Playwright generates a per-run secret when one is not provided by CI.

#### Bundle Analysis Scripts

| Script             | Description                                            |
| :----------------- | :----------------------------------------------------- |
| `pnpm analyze`     | Build application and generate bundle analysis report. |
| `pnpm analyze:dev` | Enable bundle analysis in development mode.            |

#### Database Scripts

| Script             | Description                                                                 |
| :----------------- | :-------------------------------------------------------------------------- |
| `pnpm db:generate` | Generate SQL migration files from schema changes.                           |
| `pnpm db:migrate`  | Apply committed migrations to the database selected by `DATABASE_URL`.      |
| `pnpm db:push`     | **Local development only.** Sync schema directly without creating migration |

## 📁 File Upload Feature

This project integrates a secure file upload system based on Cloudflare R2.
Direct and server-side uploads share the same short-lived upload intent,
per-user byte quotas, one-time completion, and orphan cleanup flow.

### 1. Cloudflare R2 Configuration

1. **Create R2 Bucket**: Log into Cloudflare Dashboard, navigate to R2 and create a new bucket.
2. **Get API Token**: In the R2 overview page, click "Manage R2 API Tokens", create a token with "Object Read & Write" permissions. Note down the `Access Key ID` and `Secret Access Key`.
3. **Set Environment Variables**: Fill your R2 credentials and information into the `.env` file.
4. **Configure CORS Policy**: To allow browsers to upload files directly, you need to configure CORS policy in your R2 bucket's "Settings". Add the following configuration, replacing the URLs in `AllowedOrigins` with your own:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "If-None-Match"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Direct uploads use protocol version 2. The presign response declares the
required `Content-Type` and `If-None-Match: *` headers, so an issued object key
can only be written once. The signed URL lasts 15 minutes and its database
reservation lasts one hour. Cancelling releases quota immediately without
shortening that original expiry. After expiry, cleanup deletes the object but
retains a tombstone for 24 hours and deletes the object again before removing
the intent. This second check catches a late PUT that began while the signed URL
was still valid. Clients built against the older unsigned-header protocol must
be refreshed when this version is deployed.

For a rolling v1-to-v2 deployment, set `UPLOAD_LEGACY_COMPLETION_SINCE` to the
rollout start and `UPLOAD_LEGACY_COMPLETION_UNTIL` to an absolute timestamp no
more than 24 hours later. The compatibility path only accepts the authenticated
user's timestamp-and-UUID v1 keys issued up to 15 minutes before that start,
verifies the declared URL and actual R2 metadata, applies upload quotas, and is
idempotent. Remove both variables after the cutoff. Then perform a one-time,
dry-run inventory comparison between R2's `uploads/` prefix and the upload
records' `"fileKey"` values; review the difference before deleting untracked
legacy objects. New clients always require a database-backed v2 intent.

### 2. Schedule Upload Cleanup

Call the cleanup endpoint at least every five minutes from your deployment
platform. It claims expired upload intents and deletes abandoned R2 objects.
Failed object deletions are deferred until the next five-minute retry window.

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $UPLOAD_CLEANUP_SECRET" \
  "https://yourdomain.com/api/internal/uploads/cleanup"
```

The endpoint processes up to five batches of 100 intents per run and recovers
stale cleanup claims automatically. This capacity covers the five-minute
arrival window allowed by the per-user cancellation limit, including both
tombstone deletion stages. If a run reports five full batches, schedule it more
frequently until the queue is drained. R2 lifecycle rules may additionally
abort incomplete multipart uploads after one day, but they do not replace this
database-aware cleanup.

### 3. Using the `FileUploader` Component

We provide a powerful `FileUploader` component that supports drag-and-drop, progress display, image compression, and error handling.

#### Basic Usage

```tsx
import { FileUploader } from "@/components/ui/file-uploader";

function MyComponent() {
  const handleUploadComplete = (files) => {
    console.log("Upload complete:", files);
    // Handle uploaded file information here
  };

  return (
    <FileUploader
      acceptedFileTypes={["image/png", "image/jpeg", "application/pdf"]}
      maxFileSize={5 * 1024 * 1024} // 5MB
      maxFiles={3}
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

> **Note**: This project uses a `src` directory structure. All components and library files are located in the `src/` directory and can be accessed through the `@/` path mapping which resolves to `src/`.

#### Image Compression

The component includes built-in client-side image compression functionality that can reduce image file size before upload, saving bandwidth and storage space.

```tsx
<FileUploader
  acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
  enableImageCompression={true}
  imageCompressionQuality={0.7} // Compression quality (0.1-1.0)
  imageCompressionMaxWidth={1200} // Maximum width after compression
/>
```

## 📊 Bundle Size Monitoring & Optimization

This project integrates `@next/bundle-analyzer` to help you analyze and optimize your application's bundle size.

### How to Run Analysis

```bash
# Analyze production build
pnpm analyze

# Analyze in development mode
pnpm analyze:dev
```

After execution, bundle size analysis reports for both client and server will automatically open in your browser.

### Optimization Strategies

- **Dynamic Imports**: Use `next/dynamic` for code splitting of large components or libraries that aren't needed on first screen.
- **Dependency Optimization**:
  - **Tree Shaking**: Ensure you only import what you need from libraries, e.g., `import { debounce } from 'lodash-es';` instead of `import _ from 'lodash';`.
  - **Lightweight Alternatives**: Consider using lighter libraries, e.g., replace `moment.js` with `date-fns`.
- **Image Optimization**: Prioritize using Next.js `<Image>` component and enable WebP format.

## ☁️ Deployment

The production reference deployment uses [Zeabur](https://zeabur.com/). The
repository also includes a standalone multi-stage Docker build.

1. Push the reviewed commit to your Git repository and connect it to a Zeabur
   service.
2. Configure every required variable from `.env.example`. Set
   `NEXT_PUBLIC_APP_URL` to the final HTTPS origin before building because
   canonical URLs and client configuration are compiled from it. Set
   `R2_PUBLIC_URL` before building so Next.js includes the storage hostname in
   its image optimization allowlist.
3. Run `pnpm db:migrate` once as a dedicated release command against the
   production `DATABASE_URL`. Do not attach migrations to every web process
   startup.
4. Deploy the application only after the migration succeeds. Use
   `/api/health` for liveness and `/api/ready` for database-backed readiness.
5. Schedule an authenticated `POST /api/internal/uploads/cleanup` at least
   every five minutes.
6. Verify the public origin, both locale URL variants, authentication redirects,
   Dashboard access, `robots.txt`, `sitemap.xml`, and application logs.

Docker Compose follows the same order with a one-shot `migrate` service. See
[docker/README.md](docker/README.md) for local and self-hosted instructions.

## 📄 License

This project is licensed under the [MIT](https://github.com/ullrai/saas-starter/blob/main/LICENSE) license.
