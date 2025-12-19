---
title: Next.js 快速入门（应用路由）
subtitle: 如何将 Lingo.dev 编译器与 Next.js（应用路由）结合使用
---

## 简介

**Lingo.dev Compiler** 是一款由 AI 驱动的工具，可以在不更改现有组件的情况下对基于 React 的应用程序进行本地化。您只需配置一些内容，将您的应用程序包装在上下文提供程序中，就完成了——您的应用程序已实现本地化。

本指南将解释如何将 **Lingo.dev Compiler** 与 Next.js 配合使用，Next.js 是一个用于构建 Web 应用程序的全栈 React 框架。

## 您将学习的内容

- 如何在 Next.js 项目中初始化 **Lingo.dev Compiler**
- 如何配置编译器以兼容 Next.js
- 如何设置语言切换器以在不同语言环境之间切换

## 第 1 步：设置 API 密钥

**Lingo.dev Compiler** 使用大型语言模型（LLM）通过 AI 对应用程序进行本地化。要使用这些模型之一，您需要从支持的提供商处获取 API 密钥。

为了尽快开始使用，我们推荐使用 **Lingo.dev Engine**——我们自己的托管平台，提供每月 10,000 个免费使用的令牌。

设置 API 密钥的步骤：

1. [登录 Lingo.dev Engine](/auth)。
2. 导航到 **Projects** 页面。
3. 点击 **API key > Copy**。
4. 将 API 密钥存储在环境变量中：

   ```bash
   export LINGODOTDEV_API_KEY="<your_api_key>"
   ```

### 替代方案：自定义 LLM 提供商

您不必使用 **Lingo.dev Engine**。您可以配置编译器与多个自定义 LLM 提供商集成，包括：

- Groq
- Google
- Mistral
- Ollama
- OpenRouter

## 第 2 步：安装软件包

**Lingo.dev Compiler** 作为 `lingo.dev` npm 软件包的一部分分发。要安装它，请使用您喜欢的包管理器：

```bash
npm install lingo.dev
```

## 第 3 步：初始化编译器

**Lingo.dev 编译器** 集成了 [Next.js](https://nextjs.org/)，并在构建时运行。要接入构建流程，请对 `next.config.ts` 文件进行以下更改：

1. 导入编译器：

   ```ts
   import lingoCompiler from "lingo.dev/compiler";
   ```

2. 使用 `next` 方法初始化编译器：

   ```tsx
   const withLingo = lingoCompiler.next({
     sourceRoot: "app",
     lingoDir: "lingo",
     sourceLocale: "en",
     targetLocales: ["es"],
     rsc: true,
     useDirective: false,
     debug: false,
     models: "lingo.dev",
   });
   ```

   对于 Next.js App Router，请确保：

   - `sourceRoot` 设置为 `"app"`
   - `rsc` 设置为 `true`

   要了解更多可用选项，请参阅 [编译器选项](/compiler/compiler-options)。

3. 将编译器配置与现有配置合并并导出：

   ```ts
   export default withLingo(config);
   ```

完成此配置后，**Lingo.dev 编译器** 将：

- 遍历代码库的抽象语法树 (AST)
- 查找可本地化的内容（例如 JSX 元素中的文本和某些属性值）
- 使用配置的 AI 模型生成翻译
- 将原始内容和翻译内容存储在 `dictionary.js` 文件中
- 用占位符替换本地化内容

## 第 4 步：加载本地化内容

在编译器处理您的应用并生成翻译后，您需要加载并向用户提供这些本地化内容。这包括：

- 根据用户的语言偏好加载相应的字典
- 通过上下文提供器将加载的翻译提供给您的应用

在 `app/layout.tsx` 文件中，将应用包裹在 `LingoProvider` 组件中，并将 `loadDictionary` 函数传递给它：

```tsx
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LingoProvider loadDictionary={(locale) => loadDictionary(locale)}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </LingoProvider>
  );
}
```

`loadDictionary` 函数：

- 从 `lingo-locale` cookie 中检索当前语言（默认为 `"en"`）
- 从 `dictionary.js` 文件中加载本地化内容

`LingoProvider` 组件是一个 React 上下文提供器，用于将编译器创建的占位符替换为本地化内容。

## 第 5 步：设置语言切换器

为了让用户能够在不同语言环境之间切换，请从 `lingo.dev` 包中导入 `LocaleSwitcher`。这是一个未添加样式的组件，其功能包括：

- 渲染一个可用语言环境的下拉菜单
- 允许用户选择语言环境
- 记住用户选择的语言环境以便下次访问

要使用该组件，只需将其嵌入到应用程序中的任意位置，并将 `locales` 属性设置为包含已配置的源语言和目标语言的数组：

```tsx
import { LocaleSwitcher } from "lingo.dev/react/client";

<LocaleSwitcher locales={["en", "es"]} />;
```

### 替代方案：自定义语言切换器

您不必使用 `LocaleSwitcher` 组件。您可以实现自定义的语言切换逻辑和用户界面。唯一的要求是将当前活动的语言环境读写到 `lingo-locale` cookie 中。

## 第 6 步：运行应用程序

要验证 **Lingo.dev Compiler** 是否已正确设置：

1. 启动开发服务器：

   ```bash
   npm run dev
   ```

2. 访问 [localhost:3000](http://localhost:3000)。
3. 使用 `LocaleSwitcher` 组件在不同语言环境之间切换。

页面应重新加载并显示本地化的内容。

### 替代方案：手动设置 Cookie

如果您不使用 `LocaleSwitcher` 组件，另一种验证本地化是否正常工作的方式是手动设置 `lingo-locale` cookie。

如果您使用的是 Google Chrome，请按照以下步骤操作：

1. 导航到 **查看 > 开发者 > 开发者工具**。
2. 转到 **应用程序** 选项卡。
3. 在左侧边栏的 **存储** 下，展开 **Cookies** 并选择站点的 URL。
4. 在 cookies 表格中，右键单击任意位置并选择 **添加**。
5. 在 **名称** 列中，输入 `lingo-locale`。
6. 在 **值** 列中，输入所需的语言环境（例如，`es`）。
7. 按 **Enter** 保存 cookie。
8. 刷新页面以应用 cookie。

## 延伸阅读

- 要了解编译器的工作原理，请参阅 [工作原理](/compiler/how-it-works)。
- 要学习如何配置编译器，请参阅 [编译器选项](/compiler/compiler-options)。

---

## title: 常见问题

关于 **Lingo.dev Compiler** 的常见问题和解答。

## 我可以翻译字符串字面量吗？

**Lingo.dev Compiler** 遵循的约定是，JSX 中的所有内容都是可本地化的。JSX 组件之外的字符串字面量设计上不会被本地化。

**当前行为：**

```tsx
// 这段代码不会被翻译
const message = "Hello world";
const errorText = "Something went wrong";

// 这段代码会被翻译
function Component() {
  return <h1>Hello world</h1>;
}
```

**使字面量可本地化：**

您可以通过将字符串字面量包裹在 JSX 片段中来使其可本地化：

```tsx
// 之前：不可本地化
const message = "Hello world";

// 之后：使用片段使其可本地化
const message = <>Hello world</>;

// 在组件中使用
function Component() {
  return <div>{message}</div>;
}
```

**替代方法：**

```tsx
// 对于动态消息
function getLocalizedMessage() {
  return <>Something went wrong</>;
}

// 对于条件文本
const statusText = isError ? <>Error occurred</> : <>Success</>;
```

此约定确保了本地化行为的一致性，同时保持了可本地化内容和不可本地化内容之间的清晰界限。

我们正在探索扩展此行为以支持更多用例的方法。欢迎加入我们的 [Discord](https://lingo.dev/go/discord) 讨论您希望支持的具体模式。

## 为什么我的基于集合的组件没有被翻译？

编译器目前对基于 Adobe React-Aria/React-Stately 的组件存在限制，这些组件期望集合作为子元素。集合项中的直接文本内容不会被自动本地化。

这会影响像 Select、Listbox、Menu 以及其他类似的基于集合的组件，这些组件来自 HeroUI、NextUI 和其他 React-Aria 实现的库。

**当前行为：**

```tsx
import { Select, SelectItem } from "@heroui/react";

export default function SelectExample() {
  return (
    <Select label="Select an animal">
      {/* 这些文本不会被翻译 */}
      <SelectItem key="cat" textValue="Cat">
        Cat
      </SelectItem>
      <SelectItem key="dog" textValue="Dog">
        Dog
      </SelectItem>
    </Select>
  );
}
```

**解决方法：**

将文本内容包裹在 JSX 片段中以使其可本地化：

```tsx
import { Select, SelectItem } from "@heroui/react";

export default function SelectWithWorkaround() {
  return (
    <Select label="Select an animal">
      {/* 这些文本会被翻译 */}
      <SelectItem key="cat" textValue="Cat">
        <>Cat</>
      </SelectItem>
      <SelectItem key="dog" textValue="Dog">
        <>Dog</>
      </SelectItem>
    </Select>
  );
}
```

此限制影响任何使用 React-Aria 集合模式的组件，其中文本内容直接作为子元素传递给集合项。我们正在努力改进编译器对这些情况的支持。

## 支持哪些框架？

**Lingo.dev 编译器**目前支持以下 React 框架：

- **Next.js**（仅支持 App Router）
- **React Router** v6+
- **Remix**（最新版本）
- **Vite + React**

我们欢迎对其他平台实现编译器支持感兴趣的贡献者。[加入我们的 Discord](https://lingo.dev/go/discord) 讨论实现策略。

## 我可以添加更多语言吗？

可以！您可以通过直接在编译器配置中配置自定义模型来扩展语言支持：

```ts
const compilerConfig = {
  sourceLocale: "en",
  targetLocales: ["es", "fr", "de", "pt", "it"],
  models: {
    "*:pt": "qwen/qwen3-32b",
    "en:it": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "*:*": "qwen/qwen3-32b",
  },
};

lingoCompiler.next(compilerConfig)(nextConfig);
```

查看[高级配置](/compiler/configuration/advanced#custom-model-configuration)了解详细信息。

## 我可以使用自定义提示吗？

可以！您可以直接在编译器配置中自定义翻译提示：

```ts
const compilerConfig = {
  sourceLocale: "en",
  targetLocales: ["es", "fr", "de"],
  prompt:
    "您是一名专业的技术文档翻译员。从 {SOURCE_LOCALE} 翻译到 {TARGET_LOCALE}，同时保持技术准确性。",
};
```

对于自定义术语表，请在提示中包含术语定义。参考我们的[默认提示](https://github.com/lingodotdev/lingo.dev/blob/main/packages/compiler/src/lib/lcp/api/prompt.ts)以获取最佳实践。

## 我可以使用更多的 LLM 提供商吗？

目前，Lingo.dev 编译器集成了 [Lingo.dev 引擎和多个其他 LLM 提供商](/compiler/how-it-works#llm-providers)。

我们希望很快支持更多的 LLM 提供商——[联系我们](https://lingo.dev/go/discord) 或 [向我们发送拉取请求](https://github.com/lingodotdev/lingo.dev/)。

## 在 CI/CD 中需要 GROQ API 密钥吗？

通常不需要。如果您在本地构建应用程序，所有翻译将存储在 `lingo/` 目录中。您的 CI/CD 构建将不需要调用 LLM 来翻译任何字符串。

或者，您可以将 `GROQ_API_KEY` 变量添加到您的 CI/CD 中，并在构建时完成所有翻译，但我们不推荐这种方法，以便更好地控制最终翻译结果。

## 我可以编辑翻译吗？

可以！您可以手动编辑 `lingo/dictionary.js` 文件。该文件导出一个包含所有文件和条目翻译的对象。您可以在 `content` 属性中编辑每个语言的文本。只要 React 组件中的源文本未更新，您的编辑将会被保留。

**不喜欢编辑 JavaScript 对象？** 我们即将发布一个编辑器来改善编辑体验。[如果您感兴趣，请告诉我们！](https://lingo.dev/go/discord)

## 我如何重新翻译整个应用程序、特定文件或语言？

要重新翻译整个应用程序，请删除 `lingo/` 目录中的 `dictionary.js` 文件。

要仅重新翻译特定文件，您可以从 `dictionary.js` 中删除它们的键（文件名）。

如果您想重新翻译特定语言，需要删除该语言的所有记录。

## 为什么需要在本地构建应用程序？

本地构建会通过以下方式规范化您的 `lingo/` 翻译文件：

- 删除未使用的翻译键
- 更新内容指纹
- 确保文件格式一致
- 优化生产部署

在提交更改之前，请始终运行 `npm run build` 以保持翻译文件的整洁。

## 缺少翻译内容！

如果缺少翻译内容：

1. **在本地构建**以规范化您的 `lingo/` 文件：

   ```bash
   npm run build
   ```

2. **检查您的 API 密钥**是否正确设置：

   ```bash
   # 确保 .env 文件包含
   GROQ_API_KEY=gsk_...
   ```

3. **提交更新的文件**：

   ```bash
   git add lingo/
   git commit -m "Update translations"
   ```

4. **在更改后重启开发服务器**。

## 我可以设置自定义术语表吗？

可以！使用自定义提示直接在编译器配置中定义术语和术语表：

```ts
const compilerConfig = {
  sourceLocale: "en",
  targetLocales: ["es", "fr", "de"],
  prompt:
    "You are a professional translator. Use these terms consistently: 'Dashboard' should be 'Tableau de bord' in French, 'Settings' should be 'Configuración' in Spanish. Translate from {SOURCE_LOCALE} to {TARGET_LOCALE}.",
};
```

## 编译器如何处理复数形式？

编译器会自动处理基本的复数模式，但对于复杂的复数规则，您可能需要相应地构建您的 JSX：

```tsx
// 编译器会正确处理此内容
<p>{count === 1 ? <>1 个项目</> : <>{count} 个项目</>}</p>
```

## 在生产环境中的性能如何？

**Lingo.dev 编译器**针对生产环境进行了优化：

- **零运行时成本** - 翻译在预编译阶段完成
- **包分割** - 仅加载活动语言环境
- **Tree shaking** - 未使用的翻译会被移除
- **CDN 友好** - 静态翻译文件高效缓存

## 我可以在 TypeScript 中使用它吗？

可以！编译器可以无缝集成到 TypeScript 项目中。所有提供的 React 组件都完全支持类型：

```tsx
import { LocaleSwitcher } from "lingo.dev/react/client";

// 完全支持 TypeScript
const locales: string[] = ["en", "es", "fr"];
<LocaleSwitcher locales={locales} />;
```

## 我如何报告错误或请求新功能？

- **GitHub 问题**: [提交问题](https://github.com/lingodotdev/lingo.dev/issues)
- **Discord 社区**: [加入我们的 Discord](https://lingo.dev/go/discord)
- **功能请求**: 使用 GitHub 讨论区提交功能提案

## 下一步

- **快速入门**: [快速入门指南](/compiler/quick-start)
- **框架集成**: [Next.js](/compiler/frameworks/nextjs-app-router), [React Router](/compiler/frameworks/react-router-v6), [Vite](/compiler/frameworks/vite-react-ts)
- **高级功能**: [配置选项](/compiler/configuration/advanced)
