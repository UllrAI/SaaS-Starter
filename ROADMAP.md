# Roadmap | 路线图

> **Language Select / 语言选择**: [English](#english) | [中文](#中文)

## English

### ✅ Shipped Foundation

These parts already exist in the repository today:

- Authentication with magic link, OAuth, and role-based access control
- Machine auth with API keys, CLI device login, CLI session review, and `/api/v1/*` endpoints
- Billing flow with Creem checkout, portal handoff, and webhook processing
- Dashboard and admin pages for users, payments, subscriptions, and uploads
- Cloudflare R2 upload flows for browser and server-side uploads
- Localization foundation with Lingo multiple language support
- Marketing pages, blog content, sitemap, and baseline SEO support
- Jest coverage and Playwright smoke tests for critical browser flows
- An agent-friendly developer workflow for scripts, coding agents, and local automation

### 🔭 Possible Evolution Directions

#### 1. Multi-tenant and team workflows

- Workspaces or organizations as a first-class data model
- Member invitation and role management inside a workspace
- Workspace-scoped billing, settings, and resource isolation
- Team-aware auditability for admin and operational actions

#### 2. Stronger product operations layer

- More complete admin workflows for moderation, cleanup, and support tasks
- Bulk operations and safer destructive actions in back-office tools
- Better status surfaces for uploads, subscriptions, and payment incidents
- Export-friendly views for operational and finance teams

#### 3. Billing and monetization depth

- Cleaner plan configuration for multiple product tiers
- Support for add-ons, credits, or usage-based extensions where needed
- Better invoicing, payment history, and customer-facing billing visibility
- Expanded regional billing options only when real demand justifies them

#### 4. Developer platform and integrations

- A more stable external API contract for customer or internal integrations
- Scoped API permissions, quotas, and better usage governance
- More webhook events beyond payment lifecycle callbacks
- CLI packaging, SDK generation, and deeper docs once the API surface becomes stable

#### 5. Product onboarding and lifecycle

- Guided onboarding for new accounts and first-run setup
- Better empty states and setup checklists across dashboard surfaces
- Lifecycle messaging tied to account state, billing state, or activation state
- Usage summaries that help teams understand product adoption

#### 6. Content, localization, and distribution

- More polished localization workflow for content-heavy pages
- Expanded language coverage when translation quality and maintenance costs make sense
- Better content templates for docs, changelog, and product education
- Stronger SEO primitives for teams building content-led acquisition

#### 7. Reliability and delivery

- Stronger CI checks and broader E2E coverage
- Seed/demo environments for safer product previews
- Better observability around auth, billing, uploads, and background failures
- Deployment workflows that make shared-environment releases more predictable

### ❌ Intentionally Not Assumed

These are not treated as default roadmap items unless a real use case appears:

- Generic “enterprise” features with no product context
- Large integration catalogs just for checklist value
- Deep feature decomposition before the underlying direction is validated

---

## 中文

### ✅ 已完成基础能力

这些能力今天已经真实存在于仓库中：

- 支持 magic link、OAuth 和基于角色权限控制的认证体系
- 支持 API Key、CLI 设备登录、CLI 会话查看，以及位于 `/api/v1/*` 下的机器认证接口
- 基于 Creem 的计费流程，包括 checkout、portal 跳转和 webhook 处理
- 用户、支付、订阅、上传等 Dashboard 与后台管理页面
- 面向浏览器直传和服务端上传的 Cloudflare R2 上传链路
- 基于 Lingo 的多语言本地化基础设施
- 营销页、博客内容、sitemap 和基础 SEO 支持
- 覆盖关键浏览器链路的 Jest 与 Playwright 冒烟测试
- 面向脚本、Coding Agent 和本地自动化工具的 Agent 友好工作流

### 🔭 可能的演进方向

#### 1. 多租户与团队协作

- 把 workspace / organization 作为一等数据模型引入
- 支持工作区内的成员邀请与角色管理
- 工作区级别的计费、设置和资源隔离
- 面向团队协作的操作审计能力

#### 2. 更强的后台运营层

- 更好的上传、订阅、支付异常状态可视化
- 面向运营和财务场景的导出与检索能力

#### 3. 更完整的计费与商业化

- 更清晰的多套餐与产品层级配置方式
- 在有真实需求时支持 add-on、credits 或 usage-based 扩展
- 更完善的发票、支付历史和用户侧账单可见性
- 只有在真实业务驱动下才扩展更多地区化计费能力

#### 4. 开发者平台与集成能力

- 更稳定的外部 API 契约，便于客户或内部系统集成
- Scoped API 权限、额度治理和更清晰的使用边界
- 除支付生命周期之外的更多 webhook 事件
- 在 API 稳定后补充 CLI 打包、SDK 生成和更完整文档

#### 5. 产品 onboarding 与生命周期能力

- 面向新账户的引导流程与首次配置体验
- 更完整的空状态、初始化清单和 setup checklist
- 与账户状态、计费状态、激活状态联动的生命周期消息
- 帮助团队理解采用情况的使用概览与汇总

#### 6. 内容、本地化与分发

- 面向内容型页面的更成熟本地化工作流
- 在翻译质量和维护成本可控时扩展更多语言
- 面向文档、更新日志、产品教育内容的模板能力
- 对内容驱动增长更友好的 SEO 基础设施

#### 7. 可靠性与交付能力

- 更强的 CI 检查和更广的 E2E 覆盖
- 更适合演示和预览的 seed / demo 环境
- 围绕认证、计费、上传、后台失败的可观测性增强
- 让共享环境发布更稳定的部署工作流
