# UllrAI SaaS Starter Kit

[中文版](README.zh-CN.md) | English | [📋 Roadmap](ROADMAP.md)

🚧 Note: This project is currently under intensive development and modification

⚠️ Not recommended for production use yet

---

<!-- [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ullrai/saas-starter) -->

This is a free, open-source, production-ready full-stack SaaS starter kit designed to help you launch your next project at unprecedented speed. It integrates modern web development tools and practices to provide you with a solid foundation.

![UllrAI SaaS Starter Kit](./public/og.png)

## ✨ Features

This starter kit provides a comprehensive set of powerful features to help you quickly build full-featured SaaS applications:

- **Authentication (Better-Auth + Resend):** Integrated with [Better-Auth](https://better-auth.com/), providing secure magic link login and third-party OAuth functionality. Uses [Resend](https://resend.com/) for reliable email delivery with Mailchecker integration to avoid temporary emails.
- **Modern Web Framework (Next.js 16 + TypeScript):** Built on the latest [Next.js 16](https://nextjs.org/) with App Router and Server Components. The entire project uses strict TypeScript type checking.
- **Internationalization (Lingo.dev Compiler):** Built-in localization workflow powered by `@lingo.dev/compiler` for App Router. See `docs/i18n-lingo.md`.
- **Database & ORM (Drizzle + PostgreSQL):** Uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations with deep PostgreSQL integration. Supports schema migrations and optimized queries.
- **Payments & Subscriptions (Creem):** Integrated with [Creem](https://creem.io/) as the payment provider for easy subscription and one-time payment handling.
- **UI Component Library (shadcn/ui + Tailwind CSS):** Built with [shadcn/ui](https://ui.shadcn.com/), an accessible, composable component library based on Radix UI and Tailwind CSS with built-in theme support.
- **Form Handling (Zod + React Hook Form):** Powerful, type-safe form validation through [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/).
- **File Upload (Cloudflare R2):** Secure file upload system based on Cloudflare R2, supporting client-side direct upload with various file type and size restrictions.
- **Blog System (Keystatic):** Integrated [Keystatic](https://keystatic.com/) as CMS, providing Markdown/MDX content management capabilities for easy blog creation and management.
- **Code Quality:** Built-in ESLint and Prettier to ensure consistent code style and quality.

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

This project uses Drizzle ORM for database migrations. To ensure isolation between development and production environments, the project is configured with two separate database configuration files:

- `src/database/config.ts` - Development environment configuration, migration files output to `src/database/migrations/development/`
- `src/database/config.prod.ts` - Production environment configuration, migration files output to `src/database/migrations/production/`

#### Development Environment

For local development, we recommend using the `push` command to directly sync `schema.ts` changes to the database:

```bash
# Ensure local PostgreSQL database is running
pnpm db:push
```

Alternatively, you can use the traditional migration file approach:

```bash
pnpm db:generate  # Generate migration files based on schema changes
pnpm db:migrate:dev # Apply migration files to development database
```

#### Production Environment

**Important:** Production environments **must** use SQL migration file-based approach to ensure traceability and security of database changes.

```bash
# 1. In development environment, generate migration files based on schema changes
pnpm db:generate

# 2. Generate migration files for production environment (using separate production config)
pnpm db:generate:prod

# 3. Deploy code (including newly generated migration files) to production environment

# 4. In production environment (usually through CI/CD pipeline), apply migrations
pnpm db:migrate:prod
```

> **Security Tips:**
>
> - **Never** use `pnpm db:push` in production environment.
> - Production environment migrations should be automated through CI/CD pipelines.
> - Always backup production database before applying migrations.

### 5. Content Management (Keystatic)

The project uses Keystatic as a Content Management System (CMS) for managing blog posts and other content.

- **Access Method:** In development environment, you can access Keystatic's management interface by visiting the `/keystatic` path.
- **Production Environment Limitation:** For security reasons, Keystatic's management interface and related APIs are disabled by default in production environment. This means you cannot access the management backend through the `/keystatic` path after deployment to production servers.

### 6. Start Development Server

```bash
pnpm dev
```

Now your application should be running at [http://localhost:3000](http://localhost:3000)!

### 7. Admin Account Setup

For security reasons, the system no longer automatically sets the first registered user as super admin. You need to manually specify the super admin through a secure script.

**Setup Process:**

1. First, ensure the user you want to promote to admin has already registered an account in the system through normal registration.
2. In your server (using environment variables) or local development environment (using .env file as environment variables), run the following command.
   Available in server environment:

   ```bash
   pnpm set:admin:prod --email=your-email@example.com
   ```

   Available in local development environment:

   ```bash
   pnpm set:admin --email=your-email@example.com
   ```

   Replace `your-email@example.com` with the registered email of the user you want to promote.

3. After successful script execution, the user will have super admin (`super_admin`) privileges and can access all management functions under the `/dashboard/admin` path.

**Security Tips:**

- Please ensure this privilege is only granted to trusted users.
- This command should be executed in a secure environment to avoid exposing sensitive information.

## 📜 Available Scripts

#### Application Scripts

| Script                 | Description                                  |
| :--------------------- | :------------------------------------------- |
| `pnpm dev`             | Start development server.                    |
| `pnpm build`           | Build application for production.            |
| `pnpm start`           | Start production server.                     |
| `pnpm lint`            | Check code for linting errors.               |
| `pnpm test`            | Run unit tests and generate coverage report. |
| `pnpm prettier:format` | Format all code using Prettier.              |
| `pnpm set:admin`       | Promote specified email user to super admin. |

#### Bundle Analysis Scripts

| Script             | Description                                            |
| :----------------- | :----------------------------------------------------- |
| `pnpm analyze`     | Build application and generate bundle analysis report. |
| `pnpm analyze:dev` | Enable bundle analysis in development mode.            |

#### Database Scripts

| Script                  | Description                                                       | Environment |
| :---------------------- | :---------------------------------------------------------------- | :---------- |
| `pnpm db:generate`      | Generate SQL migration files based on schema changes.             | Development |
| `pnpm db:generate:prod` | Generate SQL migration files for production.                      | Production  |
| `pnpm db:push`          | **Development only.** Push schema changes directly to database.   | Development |
| `pnpm db:migrate:dev`   | Apply migration files to development database.                    | Development |
| `pnpm db:migrate:prod`  | **Production use.** Apply migration files to production database. | Production  |

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

4. **Configure Production Database Migration:**
   After successful deployment, execute database migration separately: `pnpm db:migrate:prod`

5. **Deploy!**
   After completing the above steps, Vercel will automatically build and deploy your application every time you push to the main branch.

## 📄 License

This project is licensed under the [MIT](https://github.com/ullrai/saas-starter/blob/main/LICENSE) license.
