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

## 下一步

- [快速开始](/compiler/quick-start) — 设置新编译器
- [配置参考](/compiler/configuration/reference) — 查看所有选项
- [最佳实践](/compiler/guides/best-practices) — 推荐工作流
- [故障排查](/compiler/guides/troubleshooting) — 常见问题
