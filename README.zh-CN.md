# UllrAI SaaS Starter Kit

中文版 | [English](README.md) | [更新日志](CHANGELOG.md) | [路线图](ROADMAP.md)

这是一个免费、开源、生产就绪的全栈 SaaS 入门套件，旨在帮助您以前所未有的速度启动下一个项目。它集成了现代 Web 开发中备受推崇的工具和实践，为您提供了一个坚实的基础。

它也是一个 Agent 友好的 SaaS 模板：人类用户走浏览器会话，脚本与 Coding Agent 走 API Key，本地工具则可以通过浏览器批准的 CLI 设备登录完成鉴权。

![UllrAI SaaS Starter Kit](./public/og.png)

## ✨ 功能特性

本入门套件提供了一系列强大的功能，可帮助您快速构建功能齐全的 SaaS 应用：

- **身份验证 (Better-Auth + Resend):** 集成了 [Better-Auth](https://better-auth.com/)，提供安全的魔法链接登录和第三方 OAuth 功能。使用 [Resend](https://resend.com/) 提供可靠的邮件发送服务，并集成 Mailchecker 避免临时邮箱。
- **面向 API 与 Agent 的机器认证:** 内置按用户创建的 API Key、CLI access token、refresh token 轮换，以及面向机器客户端的版本化 `/api/v1/*` 接口层。
- **现代 Web 框架 (Next.js 16 + TypeScript):** 基于最新的 [Next.js 16](https://nextjs.org/)，使用 App Router 和服务器组件。整个项目采用严格的 TypeScript 类型检查。
- **国际化 (next-intl):** 基于显式语言目录、语言感知路由、本地化元数据与规范 hreflang 输出的服务端国际化方案。详见 [docs/i18n-next-intl.md](docs/i18n-next-intl.md)。
- **数据库与 ORM (Drizzle + PostgreSQL):** 使用 [Drizzle ORM](https://orm.drizzle.team/) 进行类型安全的数据库操作，并与 PostgreSQL 深度集成。支持模式迁移和优化的查询。
- **支付与订阅 (Creem):** 集成了 [Creem](https://creem.io/) 作为支付提供商，轻松处理订阅和一次性支付。
- **UI 组件库 (shadcn/ui + Tailwind CSS):** 使用 [shadcn/ui](https://ui.shadcn.com/) 构建，它是一个基于 Radix UI 和 Tailwind CSS 的可访问、可组合的组件库，内置主题支持。
- **表单处理 (Zod + React Hook Form):** 通过 [Zod](https://zod.dev/) 和 [React Hook Form](https://react-hook-form.com/) 实现强大的、类型安全的表单验证。
- **文件上传 (Cloudflare R2):** 基于 Cloudflare R2 的安全文件上传系统，支持客户端直传和多种文件类型与大小限制。
- **博客系统 (Content Collections):** 使用 [Content Collections](https://www.content-collections.dev/) 配合原生 Markdown 文件，提供类型安全的博客内容、元数据生成和站点地图输出。
- **Agent 友好的开发工作流:** 自带一等公民 `saas-cli`、浏览器批准的设备登录、API Key 管理，以及在独立的 Developer Access 工作区中查看和撤销已授权 CLI 会话的能力。
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
| **部署**   | [Zeabur](https://zeabur.com/) 或 Docker                                                                                                               |
| **包管理** | [pnpm](https://pnpm.io/)                                                                                                                              |

## 🚀 快速上手

### 1. 环境准备

确保您的开发环境中已安装以下软件：

- [Node.js](https://nodejs.org/en/) 22 或更高版本
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

| 变量名                           | 描述                                                  | 示例                                                |
| :------------------------------- | :---------------------------------------------------- | :-------------------------------------------------- |
| `DATABASE_URL`                   | **必需。** PostgreSQL 连接字符串。                    | `postgresql://user:password@localhost:5432/db_name` |
| `RATE_LIMIT_IP_HEADER`           | 由可信入口覆盖写入的客户端 IP 请求头。                | 以部署平台为准                                      |
| `NEXT_PUBLIC_APP_URL`            | **必需。** 您应用部署后的公开 URL。                   | `http://localhost:3000` 或 `https://yourdomain.com` |
| `BETTER_AUTH_SECRET`             | **必需。** 至少 32 个字符的随机会话密钥。             | 使用 `openssl rand -base64 32` 生成                 |
| `RESEND_API_KEY`                 | **必需。** 用于发送邮件的 Resend API Key。            | `re_xxxxxxxxxxxxxxxx`                               |
| `RESEND_EMAIL_FROM`              | **必需。** Resend 中已验证域名下的发件地址。          | `noreply@your-verified-domain.com`                  |
| `CREEM_API_KEY`                  | **必需。** 必须与所选 Creem 环境匹配。                | `creem_test_...` 或 `creem_...`                     |
| `CREEM_ENVIRONMENT`              | **必需。** Creem 环境模式。                           | `test_mode` 或 `live_mode`                          |
| `CREEM_WEBHOOK_SECRET`           | **必需。** Creem Webhook 密钥。                       | `whsec_your_webhook_secret`                         |
| `R2_ENDPOINT`                    | **必需。** Cloudflare R2 API 端点。                   | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`     |
| `R2_ACCESS_KEY_ID`               | **必需。** R2 访问密钥 ID。                           | `your_r2_access_key_id`                             |
| `R2_SECRET_ACCESS_KEY`           | **必需。** R2 秘密访问密钥。                          | `your_r2_secret_access_key`                         |
| `R2_BUCKET_NAME`                 | **必需。** R2 存储桶名称。                            | `your_r2_bucket_name`                               |
| `R2_PUBLIC_URL`                  | **必需。** R2 存储桶的公共访问 URL。                  | `https://your-bucket.your-account.r2.dev`           |
| `UPLOAD_CLEANUP_SECRET`          | **必需。** 上传清理端点使用的 32 位以上 Bearer 密钥。 | 使用 `openssl rand -base64 32` 生成                 |
| `UPLOAD_DAILY_QUOTA_BYTES`       | 可选。每用户滚动 24 小时上传额度。                    | `1073741824`（1 GiB）                               |
| `UPLOAD_TOTAL_QUOTA_BYTES`       | 可选。每用户已存储与预留的总字节额度。                | `5368709120`（5 GiB）                               |
| `UPLOAD_LEGACY_COMPLETION_SINCE` | 可选。v1 有界兼容窗口的 ISO-8601 开始时间。           | 仅与 `UPLOAD_LEGACY_COMPLETION_UNTIL` 同时设置      |
| `UPLOAD_LEGACY_COMPLETION_UNTIL` | 可选。v1 有界兼容窗口的 ISO-8601 结束时间。           | 最多晚于对应开始时间 24 小时                        |
| `GITHUB_CLIENT_ID`               | _可选。_ 用于 GitHub OAuth 的 Client ID。             | `your_github_client_id`                             |
| `GITHUB_CLIENT_SECRET`           | _可选。_ 用于 GitHub OAuth 的 Client Secret。         | `your_github_client_secret`                         |
| `GOOGLE_CLIENT_ID`               | _可选。_ 用于 Google OAuth 的 Client ID。             | `your_google_client_id`                             |
| `GOOGLE_CLIENT_SECRET`           | _可选。_ 用于 Google OAuth 的 Client Secret。         | `your_google_client_secret`                         |
| `LINKEDIN_CLIENT_ID`             | _可选。_ 用于 LinkedIn OAuth 的 Client ID。           | `your_linkedin_client_id`                           |
| `LINKEDIN_CLIENT_SECRET`         | _可选。_ 用于 LinkedIn OAuth 的 Client Secret。       | `your_linkedin_client_secret`                       |

> **提示:** 您可以使用以下命令生成一个安全的密钥：
> `openssl rand -base64 32`
>
> **可选的本地 CLI 鉴权方式：** 对于脚本、本地 Agent 或临时终端调用，您可以直接导出 `SAAS_CLI_API_KEY=ssk_...`，而不必把凭证写入 CLI 配置文件。

#### 数据统计

项目默认不包含统计服务或跟踪脚本。确有需要时再接入自己的服务；在依法需要用户授权的地区，必须先实现真实有效的同意管理，再加载非必要 Cookie 或跟踪器。

#### Creem 产品配置

`src/lib/config/products.ts` 会明确分开测试与生产产品 ID。先设置
`CREEM_ENVIRONMENT` 及其对应 API Key，再运行 `pnpm creem:sync-products`。
该命令会复用或创建产品，并且只更新当前环境的命名空间。部署前请审查并提交这次配置
变更；如果当前环境没有产品 ID，checkout 会安全失败，不会误用另一环境的产品。

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

# 2. 在目标 DATABASE_URL 上执行一次已提交的迁移
pnpm db:migrate

# 3. 迁移成功后再部署应用
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
- **生成内容数据:** 如需手动刷新生成结果，可运行 `pnpm content:build`。Next.js 插件负责开发与生产构建，测试和类型检查脚本会显式执行生成器。
- **生产行为:** 项目不再提供 CMS 管理后台路由或运行时内容 API，博客内容完全由仓库中的内容文件构建。

### 6. Agent 友好的 API 与 CLI 鉴权

这个模板明确区分了人类用户认证和机器认证：

- **浏览器用户：** Web App 使用 Better Auth session cookie
- **服务对服务、Agent、自动化脚本：** 使用用户自主管理的 API Key
- **本地开发工具：** 使用 `saas-cli` 的浏览器批准设备登录

当前已经提供：

- 位于 `/api/v1/*` 下的版本化机器接口
- Dashboard Settings 中的 API Key 创建与撤销
- Dashboard Settings 中的 CLI Sessions 查看与撤销
- 不复用浏览器 session token 的终端登录流程

快速示例：

```bash
# 通过浏览器批准 saas-cli 登录
pnpm saas-cli -- auth login --base-url http://localhost:3000

# 查看当前 CLI 登录状态
pnpm saas-cli -- auth status --base-url http://localhost:3000

# 用 API Key 驱动脚本或 Coding Agent
SAAS_CLI_API_KEY=ssk_your_key_here pnpm saas-cli -- auth status --base-url http://localhost:3000
```

Web 端对应的管理入口位于 `/dashboard/developer`，可以同时管理 API Key 和已授权 CLI 会话。

### 7. 启动开发服务器

```bash
pnpm dev
```

现在，您的应用应该已经在 [http://localhost:3000](http://localhost:3000) 上运行了！

### 8. 管理员账户设置

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

| 脚本                   | 描述                                            |
| :--------------------- | :---------------------------------------------- |
| `pnpm dev`             | 启动开发服务器。                                |
| `pnpm build`           | 为生产环境构建应用。                            |
| `pnpm start`           | 启动生产服务器。                                |
| `pnpm saas-cli`        | 运行一等公民 CLI，用于设备登录与 API 鉴权检查。 |
| `pnpm lint`            | 检查代码中的 linting 错误。                     |
| `pnpm dead-code:check` | 检查未使用的文件、导出与依赖。                  |
| `pnpm type-check`      | 运行 TypeScript 类型检查。                      |
| `pnpm test`            | 运行 Jest 测试套件。                            |
| `pnpm test:coverage`   | 运行 Jest 并生成覆盖率报告。                    |
| `pnpm test:e2e`        | 构建并运行 Playwright E2E 冒烟测试。            |
| `pnpm prettier:format` | 使用 Prettier 格式化所有代码。                  |
| `pnpm set:admin`       | 将指定邮箱的用户提升为超级管理员。              |

## 🧪 E2E 测试

仓库现在包含基于 Playwright 的 `e2e/` 冒烟测试，当前主要覆盖这些真实浏览器链路：

- 未登录访问 dashboard 的重定向
- 已登录用户访问 dashboard
- admin 权限拦截与后台访问
- marketing 路由的 locale 规范化
- API Key 创建与 machine-auth 校验
- 浏览器批准 device auth 后的 CLI 登录

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

Playwright 会通过 `pnpm start` 启动生产服务，并在测试期间启用仅供测试使用的会话入口：`E2E_TEST_MODE=true`。该入口要求显式配置至少 32 个字符的 `E2E_TEST_SECRET`，测试 cookie 会用该密钥签名，且非本机生产部署会禁用该入口。CI 未提供密钥时，Playwright 会为每次运行生成临时密钥。

#### 包体积分析脚本

| 脚本               | 描述                           |
| :----------------- | :----------------------------- |
| `pnpm analyze`     | 构建应用并生成包体积分析报告。 |
| `pnpm analyze:dev` | 在开发模式下启用包体积分析。   |

#### 数据库脚本

| 脚本               | 描述                                                          |
| :----------------- | :------------------------------------------------------------ |
| `pnpm db:generate` | 基于 schema 变更生成 SQL 迁移文件。                           |
| `pnpm db:migrate`  | 对 `DATABASE_URL` 指向的数据库应用已提交的迁移。              |
| `pnpm db:push`     | **仅限本地开发。** 不生成迁移文件，直接把 schema 推到数据库。 |

## 📁 文件上传功能

本项目集成了基于 Cloudflare R2 的安全文件上传系统。浏览器直传与服务端上传共用
短期上传意图、用户字节配额、一次性完成确认和孤儿对象清理流程。

### 1. Cloudflare R2 配置

1.  **创建 R2 存储桶**：登录 Cloudflare Dashboard，导航到 R2 并创建一个新的存储桶。
2.  **获取 API 令牌**：在 R2 概览页面，点击 "Manage R2 API Tokens"，创建一个具有"对象读写"权限的令牌。记下 `Access Key ID` 和 `Secret Access Key`。
3.  **设置环境变量**：将您的 R2 凭证和信息填入 `.env` 文件。
4.  **配置 CORS 策略**：为了允许浏览器直接上传文件，需要在您的 R2 存储桶的"设置"中配置 CORS 策略。添加以下配置，并将 `AllowedOrigins` 中的 URL 替换为您自己的：

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

浏览器直传使用第 2 版协议。预签名响应会明确给出必须发送的 `Content-Type` 与
`If-None-Match: *` 请求头，因此同一个对象键只能成功写入一次。签名链接有效期为
15 分钟，数据库预留有效期为一小时。取消会立即释放额度，但不会缩短原有到期时间。
预留到期后，清理任务先删除对象并保留 24 小时墓碑；移除上传意图前会再次删除对象，
从而清理在签名仍有效时才开始的晚到 PUT。部署该版本时，仍使用旧版未签名请求头协议
的客户端必须刷新。

执行 v1 到 v2 的滚动部署时，将 `UPLOAD_LEGACY_COMPLETION_SINCE` 设置为上线开始时间，
并将 `UPLOAD_LEGACY_COMPLETION_UNTIL` 设置为其后不超过 24 小时的绝对时间。兼容路径
仅接收开始时间前最多 15 分钟签发、属于当前登录用户的“时间戳 + UUID”旧版对象键，
校验声明 URL 与 R2 实际元数据、执行上传配额准入，并保持幂等。截止后应删除这两个变量；
随后对 R2 的 `uploads/` 前缀与上传记录的 `"fileKey"` 值做一次只读清单差异检查，
人工确认后再删除无记录的旧版对象。新客户端始终必须使用数据库支持的 v2 上传意图。

### 2. 调度上传清理

请在部署平台中至少每 5 分钟调用一次清理端点。它会认领已过期的上传意图，
删除遗留的 R2 对象；删除失败会延迟到下一个 5 分钟重试窗口再处理。

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $UPLOAD_CLEANUP_SECRET" \
  "https://yourdomain.com/api/internal/uploads/cleanup"
```

每次最多处理 5 批、每批 100 条意图，并会自动恢复超时的清理任务。该容量可覆盖每用户
取消限额在 5 分钟内产生的任务及两阶段墓碑删除。如果一次执行处理了完整 5 批，应提高
调度频率直至队列清空。R2 生命周期规则可以额外配置为一天后终止未完成的分片上传，
但不能替代这个理解数据库状态的清理流程。

### 3. 使用 `FileUploader` 组件

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

生产参考环境部署在 [Zeabur](https://zeabur.com/)，仓库同时提供可独立运行的多阶段
Docker 构建。

1. 将通过审查的 commit 推送到 Git 仓库，并连接到 Zeabur 服务。
2. 配置 `.env.example` 中的全部必需变量。构建前必须把 `NEXT_PUBLIC_APP_URL`
   设置为最终 HTTPS Origin，因为 canonical URL 与客户端配置会在构建时写入。
3. 使用生产 `DATABASE_URL` 把 `pnpm db:migrate` 作为一次性发布命令执行；不要挂在
   每个 Web 进程的启动钩子上。
4. 迁移成功后再部署应用。`/api/health` 用于存活检查，`/api/ready` 用于包含数据库
   检查的就绪探针。
5. 至少每五分钟调度一次带认证的 `POST /api/internal/uploads/cleanup`。
6. 验证公开 Origin、两种语言 URL、认证重定向、Dashboard、`robots.txt`、
   `sitemap.xml` 以及应用日志。

Docker Compose 使用相同顺序，并通过一次性的 `migrate` 服务执行迁移。自托管和本地
运行说明见 [docker/README.md](docker/README.md)。

## 📄 许可证

本项目采用 [MIT](https://github.com/ullrai/saas-starter/blob/main/LICENSE) 许可证。
