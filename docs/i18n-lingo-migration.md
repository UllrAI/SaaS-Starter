---
title: 快速开始
---

在不到 5 分钟内为你的 React 应用添加多语言支持。

## 前置条件

- Node.js 18+
- 使用 Next.js（App Router）或 Vite 的 React 应用

## 安装

```bash
pnpm install @lingo.dev/compiler
```

## 配置

### Next.js

将你的配置改为 async，并用 `withLingo` 包裹：

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withLingo } from "@lingo.dev/compiler/next";

const nextConfig: NextConfig = {};

export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {
    sourceRoot: "./app",
    sourceLocale: "en",
    targetLocales: ["es", "de", "fr"],
    models: "lingo.dev",
    dev: {
      usePseudotranslator: true, // Fake translations for development
    },
  });
}
```

### Vite

在 Vite 配置中添加 Lingo 插件：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { lingoCompilerPlugin } from "@lingo.dev/compiler/vite";

export default defineConfig({
  plugins: [
    lingoCompilerPlugin({
      sourceRoot: "src",
      sourceLocale: "en",
      targetLocales: ["es", "de", "fr"],
      models: "lingo.dev",
      dev: {
        usePseudotranslator: true,
      },
    }),
    // ...other plugins
  ],
});
```

## 设置 Provider

### Next.js

在根布局中用 `LingoProvider` 包裹你的应用：

```tsx
// app/layout.tsx
import { LingoProvider } from "@lingo.dev/compiler/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LingoProvider>
      <html>
        <body>{children}</body>
      </html>
    </LingoProvider>
  );
}
```

### Vite

在入口文件中用 `LingoProvider` 包裹你的应用：

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LingoProvider } from "@lingo.dev/compiler/react";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LingoProvider>
      <App />
    </LingoProvider>
  </StrictMode>
);
```

## 认证

编译器默认使用 Lingo.dev Engine 进行翻译。

### 选项 1：Lingo.dev Engine（推荐）

在 [lingo.dev](https://lingo.dev) 注册并进行认证：

```bash
npx lingo.dev@latest login
```

这会将你的 API 密钥本地保存。免费 Hobby 方案已足够满足大多数项目需求。

**遇到身份验证问题？** 如果你的浏览器阻止了认证流程，请手动将 API 密钥添加到 `.env`：

```bash
LINGODOTDEV_API_KEY=your_key_here
```

你可以在 Lingo.dev 项目设置中找到 API 密钥。

### 选项 2：直接使用 LLM 提供商

或者，直接使用任意受支持的 LLM 提供商。请更新你的配置：

```ts
{
  models: {
    "*:*": "groq:llama-3.3-70b-versatile",
    // or "google:gemini-2.0-flash"
    // or "openai:gpt-4o"
    // or "anthropic:claude-3-5-sonnet"
  }
}
```

将相应的 API 密钥添加到 `.env`：

```bash
GROQ_API_KEY=your_key
# or GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY
```

查看 [Translation Providers](/compiler/configuration/providers) 以获取所有受支持的提供商。

## 运行开发服务器

启动你的开发服务器：

```bash
npm run dev
```

编译器将会：
1. 扫描你的 JSX 以查找可翻译文本
2. 生成伪翻译（用于可视化哪些内容会被翻译）
3. 注入到你的组件中
4. 将元数据存储在 `.lingo/metadata.json`

**为什么要用伪翻译？** 它们即时生成（无需 API 调用），能准确显示哪些内容被翻译，并帮助你测试 UI 在不同文本长度下的表现——而且不会消耗 API 配额。

## 测试翻译

添加一个简单组件：

```tsx
export function Welcome() {
  return (
    <div>
      <h1>Welcome to our app</h1>
      <p>This text will be translated automatically</p>
    </div>
  );
}
```

无需更改代码——文本会被自动提取并翻译。

## 添加语言切换器（可选）

允许用户切换语言：

```tsx
"use client"; // For Next.js

import { useLocale, setLocale } from "@lingo.dev/compiler/react";

export function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="de">Deutsch</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

## 生成真实翻译

准备好生成真实翻译时，请更新你的配置：

```ts
{
  dev: {
    usePseudotranslator: false, // Disable fake translations
  }
}
```

重启你的 dev 服务器。编译器现在会为所有新增或更改的文本生成真实的 AI 翻译。

**关注成本？**伪翻译免费且即时。只有在需要审核实际翻译质量时才建议关闭。

## 常见问题

**我需要标记每一个可翻译字符串吗？**
不需要。编译器会自动检测 JSX 文本。如果你想手动选择，可设置 `useDirective: true` 并在需要翻译的文件顶部添加 `'use i18n'`。

**动态内容或 props 怎么办？**
编译器会自动处理像 `alt`、`aria-label` 和 `placeholder` 这样的字符串属性。对于动态文本，请使用模板语法：`<p>Hello {name}</p>` 可正常工作。

**可以自定义特定翻译吗？**
可以。请使用 `data-lingo-override` 属性：

```tsx
<h1 data-lingo-override={{ es: "Bienvenido", de: "Willkommen" }}>
  Welcome
</h1>
```

**如何提交翻译？**
将 `.lingo/` 目录提交到版本控制。该目录包含元数据和缓存的翻译，安全可提交，建议与代码一同进行版本管理。

---
title: 工作原理
---

@lingo.dev/compiler 通过智能代码分析和 AI 驱动的翻译，在构建时将您的 React 应用转化为多语言应用。

## 构建时转换

传统的运行时 i18n 库（如 i18next、react-intl）在应用运行时加载翻译、插值变量并格式化消息。这会增加包体积、运行时开销和实现复杂度。

@lingo.dev/compiler 的工作方式不同：它在构建过程中转换您的代码。您的 React 组件保持简洁，翻译内容会被预编译为优化后的包。

**结果：** 零运行时开销、更小的包体积，无需手动管理翻译键。

## 流程说明

### 1. AST 分析

编译器使用 Babel 将您的 React 代码解析为抽象语法树（AST），遍历 JSX，识别可翻译内容：

- 文本节点（`<p>Hello</p>`）
- 字符串属性（`<img alt="Logo" />`）
- 模板表达式中的文本（`<p>Hello {name}</p>`）

编译器能够理解 React 组件边界，并维护上下文信息以确保翻译准确。技术标识符、代码片段和不可翻译元素会被自动过滤。

### 2. 内容提取

对于每个可翻译字符串，编译器会：
- 生成稳定的基于哈希的标识符
- 保留组件上下文（文件、位置、周边元素）
- 提取富文本结构（支持嵌套元素如 `<strong>` 和 `<em>`）
- 保持插值占位符

这些元数据会存储在 `.lingo/metadata.json` 中——这是一个带版本的文件，用于追踪应用中所有可翻译内容。

### 3. 翻译生成

在开发过程中，翻译服务器会按需处理翻译：
- **伪翻译模式**（默认）：即时生成假翻译，便于查看哪些内容会被翻译且无需 API 成本
- **真实翻译模式**：调用您配置的 LLM 提供方（Lingo.dev Engine 或直接 LLM）

该翻译服务为无状态架构，并能优雅地处理部分失败——即使部分翻译失败，仍会使用已缓存的翻译结果。

### 4. 代码注入

编译器会将翻译查找逻辑注入到你的 JSX 中：

```tsx
// Your source code
<p>Hello {name}</p>

// Transformed code (simplified)
<p>{t('abc123', { name })}</p>
```

`t()` 函数经过优化并自动注入。它会在预加载的翻译字典中基于哈希进行查找。

### 5. 包优化

在构建时：
- 按语言生成独立包
- 仅包含实际使用的翻译
- 未使用的翻译会被死代码消除
- 字典会按组件进行 tree-shaking

## 开发工作流

### 开发模式

```ts
{
  dev: {
    usePseudotranslator: true,
  }
}
```

当你运行 `npm run dev` 时：
1. 编译器启动翻译服务器（自动查找 60000-60099 端口）
2. 应用向服务器请求翻译
3. 伪翻译器即时生成假翻译
4. 翻译结果缓存在 `.lingo/metadata.json` 中
5. HMR 正常工作——状态得以保留

开发小部件（如启用）允许你在浏览器中编辑翻译并实时查看更改。

### 生产模式

```ts
{
  buildMode: "cache-only",
}
```

当你运行 `npm run build` 时：
1. 不会启动翻译服务器
2. 仅使用 `.lingo/metadata.json` 中的缓存翻译
3. 如有缺失翻译，构建会因明确错误而失败
4. 不会发起 API 调用——无需 API 密钥

**为什么只用缓存？** 在生产环境中，你需要确定性的构建。翻译应在 CI（有 API 密钥）中生成，而不是在生产构建时生成。

## 推荐工作流

**本地开发：**
- 使用伪翻译器
- 快速反馈循环
- 无 API 成本

**CI/CD：**

```ts
{
  buildMode: "translate",
  dev: {
    usePseudotranslator: false,
  }
}
```

- 生成真实翻译
- 每次部署仅运行一次
- 提交 `.lingo/` 变更

**生产构建：**

```ts
{
  buildMode: "cache-only",
}
```

- 使用预生成的翻译
- 无需 API 密钥
- 构建快速且可复现

## 架构

编译器围绕关注点分离的原则进行组织：

**元数据管理器**
- 针对 `.lingo/metadata.json` 的 CRUD 操作
- 线程安全，支持文件锁
- 基于哈希的翻译标识符

**翻译服务**
- 协调翻译工作流
- 处理缓存策略
- 管理部分失败情况
- 返回成功的翻译和错误信息

**翻译器**（无状态）
- 伪翻译器：即时生成假翻译
- LCP Translator：集成 Lingo.dev 引擎
- LLM Translator：直接对接第三方翻译服务
- 不自带缓存——由服务层统一处理

**翻译服务器**
- 用于开发的 HTTP 服务器
- 支持 WebSocket，实现实时小部件更新
- 自动端口管理
- 批量请求处理

有关实现细节，请参阅 [源代码架构文档](https://github.com/lingodotdev/lingo.dev/blob/main/packages/new-compiler/docs/TRANSLATION_ARCHITECTURE.md)。

## 框架集成

### Next.js

编译器通过 `withLingo()` 封装集成：
- 支持 Webpack 和 Turbopack
- 兼容 React Server Components
- 异步配置，支持插件懒加载
- 自动基于 locale 的路由（如已配置）

### Vite

编译器通过 `lingoCompilerPlugin` 集成：
- 基于 unplugin（兼容 Vite、Webpack、Rollup）
- 完全支持 HMR
- 高效的开发服务器集成
- 自动生成虚拟模块

## 常见问题

**支持 Server Components 吗？**
支持。在 Next.js 中，编译器会转换 Server 和 Client Components。翻译查找支持同构运行。

**如何处理代码分割？**
翻译会随着组件自动分割。每个 chunk 只包含所需的翻译内容。

**翻译如何缓存？**
所有翻译都存储在 `.lingo/metadata.json` 文件中。该文件受版本控制，并作为翻译缓存。编译器使用内容哈希，只有新增或变更的文本才会触发重新翻译。

**如果翻译失败怎么办？**
服务会返回部分结果。成功的翻译会被缓存并使用，错误会带上下文记录以便调试。应用不会崩溃——会回退到缓存翻译或源文本。

**我可以查看转换后的代码吗？**
可以。在构建输出中，查找已转换的文件。转换非常少，仅包含 `t()` 函数调用和基于哈希的查找。


---
title: 迁移指南
---

将项目从旧版编译器（`lingo.dev/compiler`）迁移到新版 @lingo.dev/compiler。

## 为什么要迁移？

新版编译器带来：
- **更优 DX** — 默认自动化（无需 `'use i18n'`）
- **更高性能** — 构建更快，HMR 更高效
- **构建模式** — 区分 dev/CI/prod 场景
- **手动覆盖** — `data-lingo-override` 属性
- **自定义语言环境解析器** — 灵活的本地化检测
- **开发工具** — 伪翻译器、开发小部件（即将推出）
- **更清晰的架构** — 职责分离更明确

## 重大变更

### 1. 包名

**旧版：**

```bash
npm install lingo.dev
```

**新版：**

```bash
npm install @lingo.dev/compiler
```

### 2. 导入路径

**旧版：**

```ts
import lingoCompiler from "lingo.dev/compiler";
import { LingoProvider } from "lingo.dev/react/rsc";
```

**新版：**

```ts
import { withLingo } from "@lingo.dev/compiler/next";
import { LingoProvider } from "@lingo.dev/compiler/react";
```

### 3. 配置 API

#### Next.js

**旧版：**

```ts
// next.config.js
import lingoCompiler from "lingo.dev/compiler";

export default lingoCompiler.next({
  sourceLocale: "en",
  targetLocales: ["es", "de"],
  models: "lingo.dev",
})(nextConfig);
```

**新版：**

```ts
// next.config.ts
import { withLingo } from "@lingo.dev/compiler/next";

export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {
    sourceRoot: "./app", // New: specify source directory
    sourceLocale: "en",
    targetLocales: ["es", "de"],
    models: "lingo.dev",
  });
}
```

**变更点：**
- 配置必须为 **async function**
- 新增 `sourceRoot` 选项
- 使用 `withLingo` 包裹，替代 `lingoCompiler.next`

#### Vite

**旧版：**

```ts
import lingoCompiler from "lingo.dev/compiler";

export default defineConfig(() =>
  lingoCompiler.vite({
    sourceRoot: "src",
    targetLocales: ["es", "de"],
    models: "lingo.dev",
  })(viteConfig)
);
```

**新版：**

```ts
import { lingoCompilerPlugin } from "@lingo.dev/compiler/vite";

export default defineConfig({
  plugins: [
    lingoCompilerPlugin({
      sourceRoot: "src",
      sourceLocale: "en", // New: required
      targetLocales: ["es", "de"],
      models: "lingo.dev",
    }),
    react(),
  ],
});
```

**变更：**
- 采用插件机制，不再是配置包装器
- 现在必须使用 `sourceLocale`
- 请放在 `react()` 插件之前

### 4. 服务商设置

**旧版：**

```tsx
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";

export default function Layout({ children }) {
  return (
    <LingoProvider loadDictionary={(locale) => loadDictionary(locale)}>
      {children}
    </LingoProvider>
  );
}
```

**新版：**

```tsx
import { LingoProvider } from "@lingo.dev/compiler/react";

export default function Layout({ children }) {
  return (
    <LingoProvider>
      {children}
    </LingoProvider>
  );
}
```

**变更：**
- 无需 `loadDictionary` 属性，已在内部处理
- API 更加简洁

### 5. 文件结构

**旧版：**

```
lingo/
├── dictionary.js
├── meta.json
└── [locale]/
    └── *.json
```

**新版：**

```
.lingo/
└── metadata.json
```

**变更：**
- 目录已重命名（`.lingo` vs `lingo`）
- 只需一个元数据文件，无需多个文件
- JSON 结构不同

### 6. "use i18n" 指令

**旧版：**
默认必须添加。需要翻译的每个文件都要加：

```tsx
'use i18n';

export function Component() { ... }
```

**新版：**
可选。默认所有文件都会自动翻译。如需手动选择：

```ts
{
  useDirective: true, // Enable opt-in behavior
}
```

然后添加指令：

```tsx
'use i18n';

export function Component() { ... }
```

## 迁移步骤

### 步骤 1：更新包

```bash
# Uninstall old package
pnpm uninstall lingo.dev

# Install new package
pnpm add @lingo.dev/compiler
```

### 步骤 2：更新配置

#### Next.js

**更新前：**

```ts
// next.config.js
import lingoCompiler from "lingo.dev/compiler";

export default lingoCompiler.next({
  sourceLocale: "en",
  targetLocales: ["es", "de"],
  models: "lingo.dev",
})(nextConfig);
```

**更新后：**

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withLingo } from "@lingo.dev/compiler/next";

const nextConfig: NextConfig = {};

export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {
    sourceRoot: "./app",
    sourceLocale: "en",
    targetLocales: ["es", "de"],
    models: "lingo.dev",
    dev: {
      usePseudotranslator: true, // Recommended for development
    },
  });
}
```

#### Vite

**更新前：**

```ts
import lingoCompiler from "lingo.dev/compiler";

export default defineConfig(() =>
  lingoCompiler.vite({
    sourceRoot: "src",
    targetLocales: ["es", "de"],
    models: "lingo.dev",
  })(viteConfig)
);
```

**更新后：**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { lingoCompilerPlugin } from "@lingo.dev/compiler/vite";

export default defineConfig({
  plugins: [
    lingoCompilerPlugin({
      sourceRoot: "src",
      sourceLocale: "en",
      targetLocales: ["es", "de"],
      models: "lingo.dev",
      dev: {
        usePseudotranslator: true,
      },
    }),
    react(),
  ],
});
```

### 步骤 3：更新 Provider

**更新前：**

```tsx
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";

export default function Layout({ children }) {
  return (
    <LingoProvider loadDictionary={(locale) => loadDictionary(locale)}>
      {children}
    </LingoProvider>
  );
}
```

**更新后：**

```tsx
import { LingoProvider } from "@lingo.dev/compiler/react";

export default function Layout({ children }) {
  return (
    <LingoProvider>
      {children}
    </LingoProvider>
  );
}
```

### 步骤 4：清理旧文件

```bash
# Backup old translations (optional)
mv lingo lingo.backup

# Remove old directory
rm -rf lingo

# New directory will be created automatically
# on first build
```

### 步骤 5：使用伪翻译器进行测试

```bash
npm run dev
```

使用 `usePseudotranslator: true`，你会立即看到伪造的翻译。请验证：
- 所有预期文本均已翻译
- 无编译错误
- 布局能适应不同长度的文本

### 步骤 6：生成真实翻译

更新配置以禁用伪翻译器：

```ts
{
  dev: {
    usePseudotranslator: false,
  }
}
```

重启开发服务器。编译器会为所有新增或变更的文本生成真实翻译。

### 步骤 7：提交新翻译

```bash
git add .lingo/
git commit -m "chore: migrate to @lingo.dev/compiler"
git push
```

## 功能映射

### 旧功能 → 新等效项

| 旧功能 | 新等效项 | 备注 |
|-------------|----------------|-------|
| `dictionary.js` | `.lingo/metadata.json` | 格式不同 |
| `meta.json` | `.lingo/metadata.json` | 合并为单一文件 |
| "use i18n" (required) | "use i18n" (optional) | 现在为可选项，不再强制要求 |
| Custom prompts | `prompt` 配置选项 | 功能相同 |
| 编辑翻译 | `data-lingo-override` | 基于属性的覆盖 |
| 跳过翻译 | `data-lingo-override` + 空 | 或使用 `useDirective` |
| 覆盖翻译 | `data-lingo-override` | 基于属性 |
| 切换语言环境 | `useLocale`/`setLocale` | API 相同 |
| LLM providers | `models` 配置 | 支持相同的提供商 |

### 新功能（旧编译器中未包含）

- **构建模式** — `translate` 与 `cache-only`
- **伪翻译器** — 即时生成假翻译
- **开发小部件** — 浏览器内编辑（即将推出）
- **自定义语言环境解析器** — 灵活的语言环境检测
- **自动复数处理** — 支持 ICU MessageFormat
- **翻译服务器** — 开发环境下按需翻译

## 翻译现有翻译内容

新编译器采用了不同的文件格式。现有翻译不会自动迁移。

**选项：**

### 选项 1：重新生成所有翻译

让编译器生成全新的翻译：

1. 删除旧的 `lingo/` 目录
2. 运行新编译器
3. 使用 AI 生成翻译

**优点：** 全新开始，采用最新 AI 模型
**缺点：** 有 API 成本，可能丢失细节

### 选项 2：手动迁移脚本

编写脚本将旧格式转换为新格式：

```ts
// migrate-translations.ts
import * as fs from "fs";

const oldDir = "./lingo";
const newFile = "./.lingo/metadata.json";

// Read old translations
const oldTranslations = {}; // Parse old files

// Convert to new format
const newMetadata = {
  version: "1",
  sourceLocale: "en",
  targetLocales: ["es", "de"],
  translations: {}, // Convert old translations
};

// Write new metadata
fs.writeFileSync(newFile, JSON.stringify(newMetadata, null, 2));
```

这需要手动操作，并且与格式相关。

### 选项 3：混合方式

1. 为大部分文本生成新的翻译
2. 对于需要精确措辞的关键翻译，使用 `data-lingo-override`

## 常见问题

**“无法找到模块 '@lingo.dev/compiler'”**
运行 `npm install @lingo.dev/compiler`

**“Config 必须是异步函数”**（Next.js）
请将你的 config 包裹在 `async function` 中：

```ts
export default async function () {
  return await withLingo(...);
}
```

**“sourceLocale 是必需的”**
请在你的 config 中添加 `sourceLocale: "en"`。

**翻译未显示**
请检查：
1. `LingoProvider` 是否在根布局中
2. `.lingo/metadata.json` 是否存在
3. 控制台无报错

## 常见问题解答

**可以同时运行两个编译器吗？**
不可以。请先卸载旧编译器，再安装新编译器。

**我的翻译会丢失吗？**
如果你手动迁移，则不会丢失。否则可用 AI 重新生成（会消耗 API 积分）。

**如果我的框架还不支持怎么办？**
新编译器目前支持 Next.js 和 Vite。其他框架即将支持。你可以继续使用旧编译器，或为你的框架贡献支持。

**迁移需要多长时间？**
- 简单项目：15-30 分钟
- 复杂项目：1-2 小时
- 大部分时间用于测试和验证翻译

**我现在应该迁移还是等待？**
建议在以下情况下迁移：
- 你需要新功能（构建模式、覆盖、自定义解析器）
- 你正在启动新项目
- 你想要更好的开发体验（DX）

如果：
- 你的项目在旧编译器下运行良好
- 你需要的新编译器尚未支持的框架
可以暂时等待

---
title: Next.js 集成
---

@lingo.dev/compiler 通过异步配置包装器与 Next.js App Router 集成，支持 Webpack 和 Turbopack。

## 安装

### 1. 安装依赖包

```bash
pnpm install @lingo.dev/compiler
```

### 2. 配置 Next.js

将您的 `next.config.ts` 更新为使用异步 `withLingo()` 包装器：

```ts
import type { NextConfig } from "next";
import { withLingo } from "@lingo.dev/compiler/next";

const nextConfig: NextConfig = {
  // Your existing Next.js config
};

export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {
    sourceRoot: "./app",
    sourceLocale: "en",
    targetLocales: ["es", "de", "fr"],
    models: "lingo.dev",
    dev: {
      usePseudotranslator: true,
    },
  });
}
```

**为什么使用异步？** 该包装器会延迟加载插件并动态解析配置，从而加快构建速度，并支持按需加载插件。

### 3. 添加 Provider

在根布局中用 `LingoProvider` 包裹您的应用：

```tsx
// app/layout.tsx
import { LingoProvider } from "@lingo.dev/compiler/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LingoProvider>
      <html>
        <body>{children}</body>
      </html>
    </LingoProvider>
  );
}
```

**重要提示：** 请将 `LingoProvider` 放在 `<html>` 内部，并包裹所有内容。该方法兼容 Server 组件和 Client 组件。

## React 服务器组件

编译器完全支持 React 服务器组件（RSC）。服务器组件会在构建时完成翻译，翻译内容嵌入到服务器输出中。

```tsx
// app/page.tsx (Server Component)
export default function Page() {
  return (
    <div>
      <h1>Welcome to our app</h1>
      <p>This is a server component—translated at build time</p>
    </div>
  );
}
```

服务器组件中的翻译文本不会添加任何客户端 JavaScript。

## 客户端组件

对于客户端组件，请使用 `"use client"` 指令：

```tsx
"use client";

import { useLocale, setLocale } from "@lingo.dev/compiler/react";

export function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="de">Deutsch</option>
    </select>
  );
}
```

客户端组件会接收优化后的翻译包，仅包含该组件实际使用的翻译内容。

## 语言环境检测

默认情况下，语言环境存储在 cookie（`locale`）中。编译器会自动处理语言环境的检测和持久化。

### 自定义服务器端语言环境检测

如需自定义逻辑（数据库、请求头、子域名），请创建 `.lingo/locale-resolver.server.ts`：

```ts
// .lingo/locale-resolver.server.ts
import { headers } from "next/headers";

export async function getServerLocale(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  // Parse accept-language header
  const locale = acceptLanguage?.split(",")[0]?.split("-")[0] || "en";

  return locale;
}
```

该函数会在服务器端针对每个请求调用。它应返回语言区域代码（例如，`"en"`、`"es"`）。

### 自定义客户端语言区域持久化

如需自定义客户端逻辑（localStorage、URL 参数），请创建 `.lingo/locale-resolver.client.ts`：

```ts
// .lingo/locale-resolver.client.ts
export function getClientLocale(): string {
  // Check URL parameter first
  const params = new URLSearchParams(window.location.search);
  const urlLocale = params.get("lang");
  if (urlLocale) return urlLocale;

  // Fall back to localStorage
  return localStorage.getItem("locale") || "en";
}

export function persistLocale(locale: string): void {
  localStorage.setItem("locale", locale);

  // Optionally update URL
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState({}, "", url.toString());
}
```

详细信息请参见 [自定义语言区域解析器](/compiler/features/custom-locale-resolvers)。

## 语言区域路由中间件

如果需要基于语言区域的路由（`/en/about`、`/es/about`），请实现 Next.js 中间件：

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "es", "de", "fr"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Get locale from cookie or accept-language header
  const localeCookie = request.cookies.get("locale")?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const locale =
    localeCookie ||
    acceptLanguage?.split(",")[0]?.split("-")[0] ||
    defaultLocale;

  // Redirect to localized pathname
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

将路由更新为使用 `[locale]` 动态片段：

```
app/
  [locale]/
    page.tsx
    about/
      page.tsx
    layout.tsx
```

## 构建配置

### 开发构建

```ts
{
  dev: {
    usePseudotranslator: true, // Fast fake translations
  }
}
```

运行 `npm run dev`，即可启动带有即时伪翻译的开发服务器。

### 生产构建

```ts
{
  buildMode: "cache-only", // Use pre-generated translations
}
```

运行 `npm run build` 以进行生产环境构建。无需 API 密钥——翻译内容来自 `.lingo/metadata.json`。

**最佳实践：** 在 CI 中生成真实翻译后再进行生产构建。推荐工作流请参见 [构建模式](/compiler/configuration/build-modes)。

## Turbopack 支持

该编译器兼容 Webpack 和 Turbopack（Next.js 15+）。

在开发环境下使用 Turbopack：

```bash
next dev --turbo
```

编译器会自动检测并配置合适的打包工具。

## TypeScript

编译器完全支持类型。请从 `@lingo.dev/compiler` 导入类型：

```ts
import type { LingoConfig } from "@lingo.dev/compiler";

const config: LingoConfig = {
  sourceRoot: "./app",
  sourceLocale: "en",
  targetLocales: ["es", "de"],
  models: "lingo.dev",
};
```

## 常见问题

**“找不到模块 '@lingo.dev/compiler/react'”**
请确保已安装该包：`pnpm install @lingo.dev/compiler`

**添加 LingoProvider 后 HMR 不工作**
请确保 `LingoProvider` 正确放置在根布局中，而不是嵌套布局或页面中。

**生产环境构建中未显示翻译**
请检查是否正在使用 `buildMode: "cache-only"`，并且 `.lingo/metadata.json` 包含所有语言环境的翻译。

**“缺少语言环境 X 的翻译”**
请使用 `usePseudotranslator: false` 启动开发服务器以生成真实翻译，或运行 CI 构建以填充 `.lingo/metadata.json`。

---
title: 故障排查
---

使用 @lingo.dev/compiler 时的常见问题及解决方案。

## 安装问题

### “找不到模块 '@lingo.dev/compiler'”

**原因：** 未安装或安装包不正确。

**解决方法：**

```bash
npm install @lingo.dev/compiler
# or
pnpm install @lingo.dev/compiler
```

验证安装：

```bash
ls node_modules/@lingo.dev/compiler
```

### “找不到模块：无法解析 '@lingo.dev/compiler/react'”

**原因：** 导入路径错误或包版本过旧。

**解决方法：**
1. 检查导入语句：

   ```tsx
   import { LingoProvider } from "@lingo.dev/compiler/react"; // Correct
   ```

2. 重新安装包：

   ```bash
   rm -rf node_modules
   npm install
   ```

## 配置问题

### “Config 必须为 async 函数”（Next.js）

**原因：** Next.js 配置未用 async 函数包裹。

**解决方法：**

```ts
// Wrong
export default withLingo(nextConfig, {...});

// Correct
export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {...});
}
```

### “sourceLocale 是必需的”

**原因：** 配置中缺少 `sourceLocale`。

**解决方法：**

```ts
{
  sourceLocale: "en", // Required
  targetLocales: ["es", "de"],
}
```

### “targetLocales 必须为数组”

**原因：** `targetLocales` 不是数组或为空。

**解决方法：**

```ts
{
  targetLocales: ["es", "de"], // Must be array with at least one locale
}
```

## 翻译问题

### 翻译未显示

**现象：** 仅显示源语言文本。

**原因与解决方法：**

**1. 未添加 LingoProvider 或位置不正确**

```tsx
// Wrong - too low in tree
export default function Page() {
  return (
    <LingoProvider>
      <Content />
    </LingoProvider>
  );
}

// Correct - in root layout
export default function RootLayout({ children }) {
  return (
    <LingoProvider>
      <html>
        <body>{children}</body>
      </html>
    </LingoProvider>
  );
}
```

**2. 元数据中缺少翻译**
请检查 `.lingo/metadata.json`：

```json
{
  "translations": {
    "abc123": {
      "locales": {
        "es": "..." // Should have translation
      }
    }
  }
}
```

如为空或缺失，请使用以下命令运行 `buildMode: "translate"`：

```bash
npm run dev # or build
```

**3. 构建模式为仅缓存但无缓存翻译**

```bash
# Generate translations first
LINGO_BUILD_MODE=translate npm run build

# Then use cache-only
LINGO_BUILD_MODE=cache-only npm run build
```

### 所有翻译均为 "[!!! ...]"

**原因：** 启用了伪翻译器。

**解决方法：**

```ts
{
  dev: {
    usePseudotranslator: false, // Disable for real translations
  }
}
```

重启开发服务器。

### 部分文本未被翻译

**可能原因：**

**1. 动态内容或属性**

```tsx
// Not translated (yet) - string in variable
const title = "Welcome";
<h1>{title}</h1>

// Translated - string in JSX
<h1>Welcome</h1>
```

**解决方法：** 编译器正在增强以支持字符串字面量。目前，请将文本直接写入 JSX。

**2. 属性中的文本需要特殊处理**

```tsx
// Translated automatically
<img alt="Logo" />
<button aria-label="Close" />

// May need explicit handling
<div custom-attr="Some text" /> // Not translated unless configured
```

**3. 已启用 useDirective**
如果 `useDirective: true`，则没有 `'use i18n'` 的文件不会被翻译。

**解决方案：** 添加指令：

```tsx
'use i18n';

export function Component() { ... }
```

## 构建问题

### "缺少语言 X 的翻译"

**原因：** `buildMode: "cache-only"`，但缺少翻译。

**解决方案：**
1. 生成翻译：

   ```bash
   npm run dev # or
   LINGO_BUILD_MODE=translate npm run build
   ```

2. 提交 `.lingo/metadata.json`
3. 使用 `cache-only` 重试

### "生成翻译失败"

**可能原因：**

**1. API key 无效**

```bash
# Check .env file
cat .env | grep API_KEY
```

请确保 API key 与您的服务商匹配。

**2. 网络问题**
测试 API 连接：

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**3. 触发速率限制**
请降低翻译生成速度或升级 API 等级。

**4. 模型配置无效**

```ts
// Wrong
{
  models: {
    "*:*": "invalid-provider:model",
  }
}

// Correct
{
  models: {
    "*:*": "groq:llama-3.3-70b-versatile",
  }
}
```

### 构建速度慢

**可能原因：**

**1. 正在生成大量翻译**
首次构建新文本时速度较慢，后续构建会更快（有缓存）。

**2. 开发环境中未启用伪翻译器**

```ts
{
  dev: {
    usePseudotranslator: true, // Enable for fast development
  }
}
```

**3. 不必要地启用了复数处理**

```ts
{
  pluralization: {
    enabled: false, // Disable if not using plural forms
  }
}
```

## HMR 问题

### HMR 不工作

**原因：** LingoProvider 放置位置或框架配置。

**解决方案：**

**Next.js：**
确保 LingoProvider 位于根布局中，而不是嵌套布局。

**Vite：**
确保在 `lingoCompilerPlugin` 插件之前放置 `react()`：

```ts
plugins: [
  lingoCompilerPlugin({...}), // Before react plugin
  react(),
]
```

### 语言切换时状态重置

**原因：** 由于切换语言导致页面重新加载。

**预期行为：** `setLocale()` 默认会重新加载页面以应用新语言环境。

**避免重新加载的方法：** 实现自定义 `persistLocale`，无需重新加载：

```ts
// .lingo/locale-resolver.client.ts
export function persistLocale(locale: string): void {
  localStorage.setItem("locale", locale);
  // Don't call window.location.reload()
}
```

注意：这需要预加载所有语言环境的翻译内容。

## API/认证问题

### "API 密钥无效"

**解决方案：**

**1. 检查环境变量名称**

```bash
# Lingo.dev Engine
LINGODOTDEV_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**2. 验证 API 密钥是否有效**
登录到 provider 控制台并检查密钥状态。

**3. 添加密钥后重启开发服务器**

```bash
npm run dev
```

环境变量在启动时加载。

### “身份验证失败” (Lingo.dev)

**解决方案：**

**1. 重新认证**

```bash
npx lingo.dev@latest login
```

**2. 手动 API key**

```bash
# Add to .env
LINGODOTDEV_API_KEY=your_key_here
```

请在 [lingo.dev](https://lingo.dev) 项目设置中获取 key。

### 浏览器阻止认证流程

**原因：** Brave 浏览器或扩展程序阻止了身份验证。

**解决方法：**
手动将 API key 添加到 `.env`：

```bash
LINGODOTDEV_API_KEY=...
```

## 服务器问题

### “翻译服务器启动失败”

**原因：** 端口 60000-60099 全部被占用。

**解决方案：**

**1. 配置不同的端口范围**

```ts
{
  dev: {
    translationServerStartPort: 61000,
  }
}
```

**2. 终止已有进程**

```bash
# Find processes using ports
lsof -i :60000-60099

# Kill process
kill -9 <PID>
```

### “端口 60000 已被占用”

**原因：** 该端口已被其他进程占用。

**解决方法：**
服务器会自动查找下一个可用端口。请在控制台查看实际端口：

```
[lingo] Translation server started on port 60001
```

如果所有端口都被占用，请参见上方“翻译服务器启动失败”。

## 类型错误

### “属性 'data-lingo-override' 不存在”

**原因：** TypeScript 无法识别该属性。

**解决方法：**
添加类型声明：

```ts
// global.d.ts
declare namespace React {
  interface HTMLAttributes<T> {
    "data-lingo-override"?: Record<string, string>;
  }
}
```

或者使用引号：

```tsx
<div {"data-lingo-override"}={{ es: "..." }}>
  Text
</div>
```

### “类型错误：Config 必须返回 Promise<NextConfig>”

**原因：** Next.js 配置类型不正确。

**解决方法：**

```ts
import type { NextConfig } from "next";
import { withLingo } from "@lingo.dev/compiler/next";

const nextConfig: NextConfig = {};

export default async function (): Promise<NextConfig> {
  return await withLingo(nextConfig, {...});
}
```

## 生产环境问题

### 生产环境缺少翻译

**可能原因：**

**1. 未提交 .lingo/ 目录**

```bash
git add .lingo/
git commit -m "chore: add translations"
git push
```

**2. 生产构建模式设置错误**

```ts
// Should be cache-only in production
{
  buildMode: "cache-only",
}
```

**3. CI 未生成翻译**
请检查 CI 日志，确保翻译已生成并提交。

### 开发环境与生产环境翻译不一致

**原因：** 生产环境启用了伪翻译器。

**解决方法：**

```ts
{
  dev: {
    usePseudotranslator: process.env.NODE_ENV === "development", // Only in dev
  }
}
```

## 获取帮助

如果你仍然遇到问题：

1. **检查日志** — 查看控制台中的错误信息
2. **检查 .lingo/metadata.json** — 验证结构和内容
3. **使用伪翻译器测试** — 排查 API 问题
4. **查看 GitHub issues** — [github.com/lingodotdev/lingo.dev/issues](https://github.com/lingodotdev/lingo.dev/issues)
5. **在 Discord 上提问** — [discord.gg/lingo](https://discord.gg/lingo)

在寻求帮助时，请提供：
- 错误信息（完整堆栈跟踪）
- 配置文件（next.config.ts 或 vite.config.ts）
- 包版本（`npm list @lingo.dev/compiler`）
- 复现步骤

## 常见问题

**问：生产环境需要 API 密钥吗？**
答：不需要，使用 `buildMode: "cache-only"`。翻译会在 CI 阶段预生成。

**问：为什么我的构建失败了？**
答：请检查错误信息。常见原因包括：缺少翻译、API 密钥无效、网络问题。

**问：可以使用多个 LLM 提供商吗？**
答：可以，在 `models` 配置中通过 locale-pair 映射实现。

**问：如何在不产生 API 费用的情况下测试？**
答：在开发环境中启用 `usePseudotranslator: true`。
