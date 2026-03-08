# UllrAI SaaS Starter Kit

中文版 | [English](README.md) | [📋 路线图](ROADMAP.md)

🚧 注意：此项目当前仍然在密集完善及修改中

---

<!-- [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ullrai/saas-starter) -->

这是一个免费、开源、生产就绪的全栈 SaaS 入门套件，旨在帮助您以前所未有的速度启动下一个项目。它集成了现代 Web 开发中备受推崇的工具和实践，为您提供了一个坚实的基础。

![UllrAI SaaS Starter Kit](./public/og.png)

## ✨ 功能特性

本入门套件提供了一系列强大的功能，可帮助您快速构建功能齐全的 SaaS 应用：

- **身份验证 (Better-Auth + Resend):** 集成了 [Better-Auth](https://better-auth.com/)，提供安全的魔法链接登录和第三方 OAuth 功能。使用 [Resend](https://resend.com/) 提供可靠的邮件发送服务，并集成 Mailchecker 避免临时邮箱。
- **现代 Web 框架 (Next.js 16 + TypeScript):** 基于最新的 [Next.js 16](https://nextjs.org/)，使用 App Router 和服务器组件。整个项目采用严格的 TypeScript 类型检查。
- **国际化 (Lingo.dev Compiler):** 基于 `@lingo.dev/compiler` 的本地化工作流，适配 App Router。详见 `docs/i18n-lingo-migration.md`。
- **数据库与 ORM (Drizzle + PostgreSQL):** 使用 [Drizzle ORM](https://orm.drizzle.team/) 进行类型安全的数据库操作，并与 PostgreSQL 深度集成。支持模式迁移和优化的查询。
- **支付与订阅 (Creem):** 集成了 [Creem](https://creem.io/) 作为支付提供商，轻松处理订阅和一次性支付。
- **UI 组件库 (shadcn/ui + Tailwind CSS):** 使用 [shadcn/ui](https://ui.shadcn.com/) 构建，它是一个基于 Radix UI 和 Tailwind CSS 的可访问、可组合的组件库，内置主题支持。
- **表单处理 (Zod + React Hook Form):** 通过 [Zod](https://zod.dev/) 和 [React Hook Form](https://react-hook-form.com/) 实现强大的、类型安全的表单验证。
- **文件上传 (Cloudflare R2):** 基于 Cloudflare R2 的安全文件上传系统，支持客户端直传和多种文件类型与大小限制。
- **博客系统 (Content Collections):** 使用 [Content Collections](https://www.content-collections.dev/) 配合原生 Markdown 文件，提供类型安全的博客内容、元数据生成和站点地图输出。
- **代码质量与验证:** 内置 ESLint、Prettier、Jest 和 Playwright 冒烟测试，用于守住关键链路不回退。

---

<p align="center">
  <a href="https://ko-fi.com/visoar" rel="nofollow">
    <img src="https://camo.githubusercontent.com/dba0df5d5ebd8c8897cceebfd5bdf7572e6242686daedda0dca714e60420ee7c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4275795f4d655f415f436f666665652d537570706f72745f4d795f576f726b2d4646444430303f7374796c653d666f722d7468652d6261646765266c6f676f3d6275792d6d652d612d636f66666565266c6f676f436f6c6f723d626c61636b" alt="Buy Me A Coffee" width="250" data-canonical-src="https://img.shields.io/badge/Buy_Me_A_Coffee-Support_My_Work-FFDD00?style=for-the-badge&amp;logo=buy-me-a-coffee&amp;logoColor=black" style="max-width: 100%;">
  </a>
</p>

<p align="center">
  如果您喜欢这个项目并想支持我的工作，请考虑给我买杯咖啡！☕
</p>

## 🛠️ 技术栈

| 分类       | 技术                                                                                                                                                  |
| :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **框架**   | [Next.js](https://nextjs.org/) 16                                                                                                                     |
| **语言**   | [TypeScript](https://www.typescriptlang.org/)                                                                                                         |
| **UI**     | [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (图标) |
| **认证**   | [Better-Auth](https://better-auth.com/)                                                                                                               |
| **数据库** | [PostgreSQL](https://www.postgresql.org/)                                                                                                             |
| **ORM**    | [Drizzle ORM](https://orm.drizzle.team/)                                                                                                              |
| **支付**   | [Creem](https://creem.io/)                                                                                                                            |
| **邮件**   | [Resend](https://resend.com/), [React Email](https://react.email/)                                                                                    |
| **表单**   | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)                                                                              |
| **部署**   | [Vercel](https://vercel.com/)                                                                                                                         |
| **包管理** | [pnpm](https://pnpm.io/)                                                                                                                              |

## 🚀 快速上手

### 1. 环境准备

确保您的开发环境中已安装以下软件：

- [Node.js](https://nodejs.org/en/) (推荐 v20.x 或更高版本)
- [pnpm](https://pnpm.io/installation)

### 2. 项目克隆与安装

```bash
# 克隆项目仓库
git clone https://github.com/ullrai/saas-starter.git

# 进入项目目录
cd saas-starter

# 使用 pnpm 安装依赖
pnpm install
```

### 3. 环境配置

项目通过环境变量进行配置。首先，复制示例文件：

```bash
cp .env.example .env
```

然后，编辑 `.env` 文件，填入所有必需的值。

#### 环境变量说明

| 变量名                   | 描述                                            | 示例                                                |
| :----------------------- | :---------------------------------------------- | :-------------------------------------------------- |
| `DATABASE_URL`           | **必需。** PostgreSQL 连接字符串。              | `postgresql://user:password@localhost:5432/db_name` |
| `NEXT_PUBLIC_APP_URL`    | **必需。** 您应用部署后的公开 URL。             | `http://localhost:3000` 或 `https://yourdomain.com` |
| `BETTER_AUTH_SECRET`     | **必需。** 用于加密会话的密钥，必须是32个字符。 | `a_very_secure_random_32_char_string`               |
| `RESEND_API_KEY`         | **必需。** 用于发送邮件的 Resend API Key。      | `re_xxxxxxxxxxxxxxxx`                               |
| `CREEM_API_KEY`          | **必需。** Creem 的 API Key。                   | `your_creem_api_key`                                |
| `CREEM_ENVIRONMENT`      | **必需。** Creem 环境模式。                     | `test_mode` 或 `live_mode`                          |
| `CREEM_WEBHOOK_SECRET`   | **必需。** Creem Webhook 密钥。                 | `whsec_your_webhook_secret`                         |
| `R2_ENDPOINT`            | **必需。** Cloudflare R2 API 端点。             | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`     |
| `R2_ACCESS_KEY_ID`       | **必需。** R2 访问密钥 ID。                     | `your_r2_access_key_id`                             |
| `R2_SECRET_ACCESS_KEY`   | **必需。** R2 秘密访问密钥。                    | `your_r2_secret_access_key`                         |
| `R2_BUCKET_NAME`         | **必需。** R2 存储桶名称。                      | `your_r2_bucket_name`                               |
| `R2_PUBLIC_URL`          | **必需。** R2 存储桶的公共访问 URL。            | `https://your-bucket.your-account.r2.dev`           |
| `GITHUB_CLIENT_ID`       | _可选。_ 用于 GitHub OAuth 的 Client ID。       | `your_github_client_id`                             |
| `GITHUB_CLIENT_SECRET`   | _可选。_ 用于 GitHub OAuth 的 Client Secret。   | `your_github_client_secret`                         |
| `GOOGLE_CLIENT_ID`       | _可选。_ 用于 Google OAuth 的 Client ID。       | `your_google_client_id`                             |
| `GOOGLE_CLIENT_SECRET`   | _可选。_ 用于 Google OAuth 的 Client Secret。   | `your_google_client_secret`                         |
| `LINKEDIN_CLIENT_ID`     | _可选。_ 用于 LinkedIn OAuth 的 Client ID。     | `your_linkedin_client_id`                           |
| `LINKEDIN_CLIENT_SECRET` | _可选。_ 用于 LinkedIn OAuth 的 Client Secret。 | `your_linkedin_client_secret`                       |

> **提示:** 您可以使用以下命令生成一个安全的密钥：
> `openssl rand -base64 32`

### 4. 数据库设置

本项目使用单一 Drizzle 配置文件 `src/database/config.ts`，并维护一套提交到仓库的迁移历史 `src/database/migrations/`。目标数据库仅由 `DATABASE_URL` 决定。

#### 本地开发

如果只是对自己的本地数据库做快速迭代：

```bash
pnpm db:push
```

如果这次 schema 变更需要评审、提交或同步到其他环境，请生成正式迁移：

```bash
pnpm db:generate
pnpm db:migrate
```

#### Staging / Production

共享环境只应使用已提交的 SQL 迁移：

```bash
# 1. 根据 schema 变更生成并提交迁移文件
pnpm db:generate

# 2. 部署包含新迁移文件的代码

# 3. 在目标 DATABASE_URL 上执行一次迁移
pnpm db:migrate
```

> **推荐发布实践**
>
> - **不要**在 staging 或 production 使用 `pnpm db:push`。
> - 所有环境共用一套迁移历史，不要再维护 dev/prod 两棵 SQL 目录。
> - 在 CI/CD 或部署平台中，把 `pnpm db:migrate` 作为单次执行的发布步骤。
> - **不要**把迁移挂在每个应用实例启动时自动执行。
> - 尽量保持 schema 变更向后兼容，降低迁移和应用切换的发布风险。

### 5. 内容管理 (Content Collections)

项目使用 Content Collections 配合原生 Markdown 文件来管理博客内容。文章位于 `content/blog/en/*.md`、`content/blog/zh-Hans/*.md` 等按语言划分的目录中，作者信息位于 `content/authors/*.json`，构建时会生成带类型的内容集合供博客页面和 sitemap 使用。

- **编写方式:** 直接在仓库中新增或编辑带 frontmatter 的 Markdown 文件。
- **生成内容数据:** 如需手动刷新生成结果，可运行 `pnpm content:build`。构建、测试和类型检查脚本已自动串联该命令。
- **生产行为:** 项目不再提供 CMS 管理后台路由或运行时内容 API，博客内容完全由仓库中的内容文件构建。

### 6. 启动开发服务器

```bash
pnpm dev
```

现在，您的应用应该已经在 [http://localhost:3000](http://localhost:3000) 上运行了！

### 7. 管理员账户设置

为了安全起见，系统不会自动把第一个注册用户提升为超级管理员。请在目标用户正常注册后执行：

```bash
pnpm set:admin --email=your-email@example.com
```

该命令会在存在时自动加载 `.env`，否则直接使用当前进程环境变量，因此本地和服务器都使用同一个命令。

执行成功后，该用户将获得 `super_admin` 权限，并可访问 `/dashboard/admin`。

**安全提示**

- 只将该权限授予可信用户。
- 请在确认 `DATABASE_URL` 正确的安全环境中执行此命令。

## 📜 可用脚本

#### 应用脚本

| 脚本                   | 描述                               |
| :--------------------- | :--------------------------------- |
| `pnpm dev`             | 启动开发服务器。                   |
| `pnpm build`           | 为生产环境构建应用。               |
| `pnpm start`           | 启动生产服务器。                   |
| `pnpm lint`            | 检查代码中的 linting 错误。        |
| `pnpm type-check`      | 运行 TypeScript 类型检查。         |
| `pnpm test`            | 运行单元测试并生成覆盖率报告。     |
| `pnpm test:e2e`        | 构建并运行 Playwright E2E 冒烟测试。 |
| `pnpm prettier:format` | 使用 Prettier 格式化所有代码。     |
| `pnpm set:admin`       | 将指定邮箱的用户提升为超级管理员。 |

## 🧪 E2E 测试

仓库现在包含基于 Playwright 的 `e2e/` 冒烟测试，当前主要覆盖这些真实浏览器链路：

- 未登录访问 dashboard 的重定向
- 已登录用户访问 dashboard
- admin 权限拦截与后台访问
- marketing 路由的 locale 规范化

## 页面宽度约定

- `ShellContainer` 用于 marketing 的 header、footer 以及真正需要大画布的宽布局。
- `SectionContainer` 用于常规 marketing section 和大多数非 dashboard 页面主体。
- `ReadingContainer` 用于博客正文、法律条款等长文本阅读场景。
- `CompactContainer` 用于登录这种窄单卡片流程。
- `FocusContainer` 用于支付状态这类需要更多展示空间的单卡片流程。
- 全宽背景与内容宽度要分开处理。背景可以铺满视口，内容仍应落在一个语义化容器内。

运行方式：

```bash
pnpm test:e2e
```

Playwright 会通过 `pnpm start` 启动生产服务，并在测试期间启用仅供测试使用的会话入口：`E2E_TEST_MODE=true`。该入口受 `E2E_TEST_SECRET` 保护，只应在 Playwright 或 CI 环境下启用。

#### 包体积分析脚本

| 脚本               | 描述                           |
| :----------------- | :----------------------------- |
| `pnpm analyze`     | 构建应用并生成包体积分析报告。 |
| `pnpm analyze:dev` | 在开发模式下启用包体积分析。   |

#### 数据库脚本

| 脚本               | 描述                                                         |
| :----------------- | :----------------------------------------------------------- |
| `pnpm db:generate` | 基于 schema 变更生成 SQL 迁移文件。                          |
| `pnpm db:migrate`  | 对 `DATABASE_URL` 指向的数据库应用已提交的迁移。             |
| `pnpm db:push`     | **仅限本地开发。** 不生成迁移文件，直接把 schema 推到数据库。 |

## 📁 文件上传功能

本项目集成了基于 Cloudflare R2 的安全文件上传系统。

### 1. Cloudflare R2 配置

1.  **创建 R2 存储桶**：登录 Cloudflare Dashboard，导航到 R2 并创建一个新的存储桶。
2.  **获取 API 令牌**：在 R2 概览页面，点击 "Manage R2 API Tokens"，创建一个具有"对象读写"权限的令牌。记下 `Access Key ID` 和 `Secret Access Key`。
3.  **设置环境变量**：将您的 R2 凭证和信息填入 `.env` 文件。
4.  **配置 CORS 策略**：为了允许浏览器直接上传文件，需要在您的 R2 存储桶的"设置"中配置 CORS 策略。添加以下配置，并将 `AllowedOrigins` 中的 URL 替换为您自己的：

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

### 2. 使用 `FileUploader` 组件

我们提供了一个强大的 `FileUploader` 组件，支持拖拽、进度显示、图片压缩和错误处理。

#### 基本用法

```tsx
import { FileUploader } from "@/components/ui/file-uploader";

function MyComponent() {
  const handleUploadComplete = (files) => {
    console.log("上传完成:", files);
    // 在此处理上传成功的文件信息
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

> **注意**: 此项目使用 `src` 目录结构，所有组件和库文件都位于 `src/` 目录中，通过 `@/` 路径映射可以直接访问 `src/` 目录下的文件。

#### 图片压缩

组件内置了客户端图片压缩功能，可在上传前减小图片体积，节省带宽和存储空间。

```tsx
<FileUploader
  acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
  enableImageCompression={true}
  imageCompressionQuality={0.7} // 压缩质量 (0.1-1.0)
  imageCompressionMaxWidth={1200} // 压缩后最大宽度
/>
```

## 📊 包体积监控与优化

本项目集成了 `@next/bundle-analyzer`，帮助您分析和优化应用的包体积。

### 如何运行分析

```bash
# 分析生产构建
pnpm analyze

# 在开发模式下进行分析
pnpm analyze:dev
```

执行后，会自动在浏览器中打开客户端和服务端的包体积分析报告。

### 优化策略

- **动态导入**：对非首屏必需的大型组件或库使用 `next/dynamic` 进行代码分割。
- **依赖优化**：
  - **Tree Shaking**: 确保只从库中导入您需要的部分，例如 `import { debounce } from 'lodash-es';` 而不是 `import _ from 'lodash';`。
  - **轻量替代**: 考虑使用更轻量的库，例如用 `date-fns` 替代 `moment.js`。
- **图片优化**: 优先使用 Next.js 的 `<Image>` 组件，并启用 WebP 格式。

## ☁️ 部署

推荐使用 [Vercel](https://vercel.com) 进行部署，因为它与 Next.js 无缝集成。

1.  **推送到 Git 仓库:**
    将您的代码推送到 GitHub、GitLab 或 Bitbucket 仓库。

2.  **在 Vercel 中导入项目:**
    - 登录您的 Vercel 账户，点击 "Add New... > Project"，然后选择您的 Git 仓库。
    - Vercel 会自动检测到这是一个 Next.js 项目并配置好构建设置。

3.  **配置环境变量:**
    - 在 Vercel 项目的 "Settings" -> "Environment Variables" 中，添加您在 `.env` 文件中定义的所有环境变量。**请勿将 `.env` 文件提交到 Git 仓库中**。

4.  **把数据库迁移配置为发布步骤:**
    在 CI/CD 或部署平台中，使用生产环境的 `DATABASE_URL` 单独执行一次 `pnpm db:migrate`。不要把迁移挂在 Web 进程启动钩子上。

5.  **部署!**
    完成上述步骤后，Vercel 会在您每次推送到主分支时自动构建和部署您的应用。

## 📄 许可证

本项目采用 [MIT](https://github.com/ullrai/saas-starter/blob/main/LICENSE) 许可证。
