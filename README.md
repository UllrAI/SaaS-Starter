# UllrAI SaaS Starter Kit

[中文版](README.zh-CN.md) | English | [📋 Roadmap](ROADMAP.md)

🚧 Note: This project is currently under intensive development and modification

---

<!-- [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ullrai/saas-starter) -->

This is a free, open-source, production-ready full-stack SaaS starter kit designed to help you launch your next project at unprecedented speed. It integrates modern web development tools and practices to provide you with a solid foundation.

![UllrAI SaaS Starter Kit](./public/og.png)

## ✨ Features

This starter kit provides a comprehensive set of powerful features to help you quickly build full-featured SaaS applications:

- **Authentication (Better-Auth + Resend):** Integrated with [Better-Auth](https://better-auth.com/), providing secure magic link login and third-party OAuth functionality. Uses [Resend](https://resend.com/) for reliable email delivery with Mailchecker integration to avoid temporary emails.
- **Modern Web Framework (Next.js 16 + TypeScript):** Built on the latest [Next.js 16](https://nextjs.org/) with App Router and Server Components. The entire project uses strict TypeScript type checking.
- **Internationalization (Lingo.dev Compiler):** Built-in localization workflow powered by `@lingo.dev/compiler` for App Router. See `docs/i18n-lingo-migration.md`.
- **Database & ORM (Drizzle + PostgreSQL):** Uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations with deep PostgreSQL integration. Supports schema migrations and optimized queries.
- **Payments & Subscriptions (Creem):** Integrated with [Creem](https://creem.io/) as the payment provider for easy subscription and one-time payment handling.
- **UI Component Library (shadcn/ui + Tailwind CSS):** Built with [shadcn/ui](https://ui.shadcn.com/), an accessible, composable component library based on Radix UI and Tailwind CSS with built-in theme support.
- **Form Handling (Zod + React Hook Form):** Powerful, type-safe form validation through [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/).
- **File Upload (Cloudflare R2):** Secure file upload system based on Cloudflare R2, supporting client-side direct upload with various file type and size restrictions.
- **Blog System (Content Collections):** Uses [Content Collections](https://www.content-collections.dev/) with plain Markdown files for type-safe blog content, metadata generation, and sitemap output.
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
| **Deployment**      | [Vercel](https://vercel.com/)                                                                                                                          |
| **Package Manager** | [pnpm](https://pnpm.io/)                                                                                                                               |

## 🚀 Quick Start

### 1. Environment Setup

Ensure you have the following software installed in your development environment:

- [Node.js](https://nodejs.org/en/) (recommended v20.x or higher)
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

| Variable Name            | Description                                                       | Example                                             |
| :----------------------- | :---------------------------------------------------------------- | :-------------------------------------------------- |
| `DATABASE_URL`           | **Required.** PostgreSQL connection string.                       | `postgresql://user:password@localhost:5432/db_name` |
| `NEXT_PUBLIC_APP_URL`    | **Required.** Public URL of your deployed app.                    | `http://localhost:3000` or `https://yourdomain.com` |
| `BETTER_AUTH_SECRET`     | **Required.** Key for encrypting sessions, must be 32 characters. | `a_very_secure_random_32_char_string`               |
| `RESEND_API_KEY`         | **Required.** Resend API Key for sending emails.                  | `re_xxxxxxxxxxxxxxxx`                               |
| `CREEM_API_KEY`          | **Required.** Creem API Key.                                      | `your_creem_api_key`                                |
| `CREEM_ENVIRONMENT`      | **Required.** Creem environment mode.                             | `test_mode` or `live_mode`                          |
| `CREEM_WEBHOOK_SECRET`   | **Required.** Creem webhook secret.                               | `whsec_your_webhook_secret`                         |
| `R2_ENDPOINT`            | **Required.** Cloudflare R2 API endpoint.                         | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`     |
| `R2_ACCESS_KEY_ID`       | **Required.** R2 access key ID.                                   | `your_r2_access_key_id`                             |
| `R2_SECRET_ACCESS_KEY`   | **Required.** R2 secret access key.                               | `your_r2_secret_access_key`                         |
| `R2_BUCKET_NAME`         | **Required.** R2 bucket name.                                     | `your_r2_bucket_name`                               |
| `R2_PUBLIC_URL`          | **Required.** Public access URL for R2 bucket.                    | `https://your-bucket.your-account.r2.dev`           |
| `GITHUB_CLIENT_ID`       | _Optional._ GitHub OAuth Client ID.                               | `your_github_client_id`                             |
| `GITHUB_CLIENT_SECRET`   | _Optional._ GitHub OAuth Client Secret.                           | `your_github_client_secret`                         |
| `GOOGLE_CLIENT_ID`       | _Optional._ Google OAuth Client ID.                               | `your_google_client_id`                             |
| `GOOGLE_CLIENT_SECRET`   | _Optional._ Google OAuth Client Secret.                           | `your_google_client_secret`                         |
| `LINKEDIN_CLIENT_ID`     | _Optional._ LinkedIn OAuth Client ID.                             | `your_linkedin_client_id`                           |
| `LINKEDIN_CLIENT_SECRET` | _Optional._ LinkedIn OAuth Client Secret.                         | `your_linkedin_client_secret`                       |

> **Tip:** You can generate a secure key using the following command:
> `openssl rand -base64 32`

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

# 2. Deploy the code that includes the new migration files

# 3. Run migrations once against the target DATABASE_URL
pnpm db:migrate
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
- **Generated content data:** Run `pnpm content:build` to refresh the generated collections manually. The command is already wired into the build, test, and type-check scripts.
- **Production behavior:** There is no CMS admin route or runtime content API. All blog content is built from the repository content files.

### 6. Start Development Server

```bash
pnpm dev
```

Now your application should be running at [http://localhost:3000](http://localhost:3000)!

### 7. Admin Account Setup

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

| Script                 | Description                                  |
| :--------------------- | :------------------------------------------- |
| `pnpm dev`             | Start development server.                    |
| `pnpm build`           | Build application for production.            |
| `pnpm start`           | Start production server.                     |
| `pnpm lint`            | Check code for linting errors.               |
| `pnpm type-check`      | Run TypeScript type checking.                |
| `pnpm test`            | Run unit tests and generate coverage report. |
| `pnpm test:e2e`        | Build and run Playwright E2E smoke tests.    |
| `pnpm prettier:format` | Format all code using Prettier.              |
| `pnpm set:admin`       | Promote specified email user to super admin. |

## 🧪 E2E Testing

This repository includes a Playwright smoke test suite in `e2e/` for the most important browser-level flows:

- unauthenticated dashboard redirect
- authenticated dashboard access
- admin permission gating
- locale canonicalization for marketing routes

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

The Playwright runner starts the production server through `pnpm start` and enables a test-only session route with `E2E_TEST_MODE=true`. That route is guarded by `E2E_TEST_SECRET` and should only be enabled from the Playwright runner or CI.

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

### 1. Cloudflare R2 Configuration

1. **Create R2 Bucket**: Log into Cloudflare Dashboard, navigate to R2 and create a new bucket.
2. **Get API Token**: In the R2 overview page, click "Manage R2 API Tokens", create a token with "Object Read & Write" permissions. Note down the `Access Key ID` and `Secret Access Key`.
3. **Set Environment Variables**: Fill your R2 credentials and information into the `.env` file.
4. **Configure CORS Policy**: To allow browsers to upload files directly, you need to configure CORS policy in your R2 bucket's "Settings". Add the following configuration, replacing the URLs in `AllowedOrigins` with your own:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2. Using the `FileUploader` Component

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

We recommend using [Vercel](https://vercel.com) for deployment as it seamlessly integrates with Next.js.

1. **Push to Git Repository:**
   Push your code to a GitHub, GitLab, or Bitbucket repository.

2. **Import Project in Vercel:**
   - Log into your Vercel account, click "Add New... > Project", then select your Git repository.
   - Vercel will automatically detect this is a Next.js project and configure the build settings.

3. **Configure Environment Variables:**
   - In your Vercel project's "Settings" -> "Environment Variables", add all the environment variables you defined in your `.env` file. **Do not commit the `.env` file to your Git repository**.

4. **Configure Database Migration as a Release Step:**
   Run `pnpm db:migrate` once in a dedicated CI/CD or platform release step using the production `DATABASE_URL`. Avoid running migrations from web process startup hooks.

5. **Deploy!**
   After completing the above steps, Vercel will automatically build and deploy your application every time you push to the main branch.

## 📄 License

This project is licensed under the [MIT](https://github.com/ullrai/saas-starter/blob/main/LICENSE) license.
