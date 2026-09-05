# Lessons Learned

违反直觉的事实,每条都来自真实踩过的坑。

与 `AGENTS.md` 的分工:`AGENTS.md` 写「必须怎么做」的规则,本文件写「为什么这么做会炸」。规则留在 `AGENTS.md`,不要迁移过来。

## 写入规范

- 只写真实踩过的坑。没踩过的推测和最佳实践复述不要进。
- 每条写清**现象 → 原因 → 正确做法**。只写「不要用 X」而不写为什么,下次仍然会有人踩。
- 一条一个坑,按主题分节即可,不做分类学。
- 过期即删。框架升级后不再成立的条目直接移除,不留考古层。

---

## 数据库

### 新增表必须同时登记到 `src/database/tables.ts`

**现象**:在 `src/database/schema.ts` 加了一张表之后,`pnpm type-check` 在**完全无关**的 `src/lib/billing/stripe/webhook.ts` 报错,信息是 `Property 'xxx' is missing in type 'ExtractTablesWithRelations<...>'`,长达数十行且不指向真正的问题点。

**原因**:`src/database/index.ts` 的 `drizzle(sql, { schema: { ...tables } })` 用的是 `./tables`——一份**手工维护的再导出白名单**,而 `src/lib/database/subscription.ts` 的 `Tx` 类型引用的是 `./schema` 全量。两者不一致时,`db.transaction()` 的回调参数类型与 `Tx` 不兼容,错误在最先使用 `Tx` 的文件爆出来。

**正确做法**:改 `schema.ts` 加表后,立刻在 `tables.ts` 的 import 和 export 两处都加上。报错位置与真实原因无关,不要在 `webhook.ts` 里找问题。

---

## AI

### `onEnd` 回调不携带 token 用量

**现象**:想在 `createAgentUIStreamResponse` 的 `onEnd` 里记录用量,但事件对象上找不到 usage 字段。

**原因**:`ai@7` 的 `UIMessageStreamOnEndCallback` 事件只有 `{ messages, isContinuation, isAborted, responseMessage, finishReason }`。用量在流的 part 上,不在结束回调里。

**正确做法**:用 `messageMetadata` 回调捕获——`part.type === "finish"` 带整轮的 `totalUsage`,`part.type === "finish-step"` 带 `response.modelId`(provider 实际使用的模型,比读配置准确)。捕获到闭包变量,由 `onEnd` 统一落库。

注意两点:`messageMetadata` 的返回值会发给客户端,用量数据不要放进返回值;另外 `finishReason` 本来就在 `onEnd` 事件上,不要跟着一起用闭包捕获。参见 #92。

### `onEnd` 的 `isAborted` 在本项目恒为 `false`

**现象**:按 `isAborted` 给用量记录加了「已中止」标记,写了测试也过了,但线上永远不会出现这个值。

**原因**:`isAborted` 只在流里出现 `abort` chunk 时才为真,而该 chunk 只在 `abortSignal.aborted` 时产生。我们调用 `createAgentUIStreamResponse` 时既没传 `abortSignal` 也没配 `timeout`,并且 `consumeSseStream` 还刻意让浏览器断开后继续消费。测试之所以通过,是因为它直接手工调用 `onEnd({ isAborted: true })`,绕过了真实流程。

**正确做法**:`isAborted` 有意义的前提是先接上 `abortSignal`。在此之前不要为它建列、建分支。判断一个回调字段是否可达,要沿 SDK 的 runtime 反查它的触发条件,而不是看类型签名上有没有。

### 手工调用回调的单测证明不了该路径可达

**现象**:测试绿的功能上线后从不触发。

**原因**:mock 掉 SDK 后直接调用 `onEnd`/`messageMetadata` 并自行构造入参,测的是「给定这个输入,函数怎么做」,而非「这个输入真的会出现」。

**正确做法**:这类测试仍然值得写,但新增依赖 SDK 回调字段的分支时,额外确认一次该字段在本项目配置下的可达性。

### 不配 `experimental_toolApprovalSecret` 等于没有审批

**现象**:给写操作工具加了 `needsApproval: true`,UI 也弹出了确认卡片,看起来一切正常。但伪造一个 `{ type: "tool-approval-response", approved: true }` 直接 POST 到 `/api/chat`,工具照样执行,没有任何报错。

**原因**:审批状态存在客户端的消息里,服务端靠签名来判断这份「用户已同意」是不是自己发出的。`validateApprovedToolApprovals` 在没有 secret 时**直接跳过校验**——不是报错,是静默放行。实测对照:配了 secret 抛 `AI_InvalidToolApprovalSignatureError` 且 `executed = 0`;不配则不抛错、`executed = 1`。

**正确做法**:所有带审批工具的 agent 都要经过 `withToolApprovalSecret()`(`src/lib/ai/tool-approval.ts`)。secret 从 `BETTER_AUTH_SECRET` 派生而不是新开一个环境变量,正是因为漏配的后果是静默的——新变量忘了设,线上就等于没有审批。`src/lib/ai/tool-approval.test.ts` 里「未签名的审批必须被拒绝」那条用例是这个保证的唯一防线,不要因为「看着像重复测 SDK」而删掉。

---

## 测试

### 从 `@jest/globals` 导入 `jest` 会让 `jest.mock` 失效

**现象**:测试顶部写了 `jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }))`,断言时却报 `Matcher error: received value must be a mock or spy function`,拿到的是 sonner 的真实实现。

**原因**:`jest.mock` 依赖转译期的 hoisting 被提到 `import` 之前。SWC 的 hoisting 只认**全局** `jest` 标识符;一旦写了 `import { jest } from "@jest/globals"`,`jest` 变成本地绑定,`jest.mock` 就留在原地,注册时被测模块早已加载完毕,mock 不再生效。实测 `jest.isMockFunction(toast.warning)`:导入 `jest` 时为 `false`,用全局 `jest` 时为 `true`。

**正确做法**:只从 `@jest/globals` 取 `describe`/`it`/`expect`/`beforeEach`,`jest` 用全局的。参考 `src/components/auth/social-login-buttons.test.tsx`。

修复时注意工厂会被提升到所有模块级 `const` 之前执行,`jest.mock("x", () => ({ fn: mockFn }))` 会报 TDZ 的 `Cannot access 'mockFn' before initialization`。把默认实现写进工厂,再从被 mock 的模块里 import 出来断言,参考 `src/hooks/use-admin-table.test.tsx`。

### jsdom 的 `crypto` 没有 `subtle`

**现象**:AI SDK 的工具审批用例在 jest 里报 `TypeError: Cannot read properties of undefined (reading 'importKey')`,同样的代码在 Node 里跑得好好的。

**原因**:jest 的 jsdom 环境提供了 `crypto`(有 `getRandomValues`),但没有 WebCrypto 的 `subtle`。SDK 签名走的是 `crypto.subtle`。

**正确做法**:在 `jest.setup.ts` 里用 Node 自带的 `node:crypto` 的 `webcrypto` 补齐。注意必须用 `Object.defineProperty`——jsdom 把 `crypto` 定义成 getter,直接赋值会失败。

---

## Next.js

### 配 `deploymentId` 会削弱 Next 自带的 skew 检测

**现象**:为了让旧页面在新部署后尽早硬跳转,给 `next.config.ts` 加了 `deploymentId`(取 `package.json` 版本号)。看起来一切正常:静态资源带上了 `?dpl=`,HTML 带上了 `data-dpl-id`,lint / type-check / test / build 全绿。实际效果是**比不加更差**。

**原因**:两处非直觉行为。

其一,`getBuildId`(`node_modules/next/dist/build/index.js`)在检测到 `config.deploymentId` 后**不再生成随机 buildId**,直接返回常量 `build-TfctsWXpff2fKS`。实测:配了以后 `.next/BUILD_ID` 是这个常量,不配则是随机 nanoid。

其二,客户端的比对键随之切换。`app-index.js` 里 `initialRSCPayload.b ? setNavigationBuildId(b) : setNavigationBuildId(getDeploymentId())`——不配 deploymentId 时比的是每次构建都变的 buildId,配了以后比的是 deploymentId。于是检测粒度从「每次构建」降到「每个版本号」,同版本重建(改环境变量触发的 rebuild、预览环境跟分支、同一 tag 重跑)一次都不会触发,而这恰恰是最需要它的场景——同版本重建**必然**产生新的 Server Action ID,因为 action ID 的 hash salt 就是每次构建随机生成的加密密钥(webpack 走 `build/webpack-config.js` 的 `serverReferenceHashSalt`,本仓库默认的 Turbopack 走 `build/turbopack-build/impl.js`,两条路径吃同一个 key)。

**正确做法**:不要配 `deploymentId`,除非能喂给它一个每次构建都变的值(git SHA),而那需要构建时注入。想让同版本重建不产生 skew,对症的是钉住 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`——它同时是 action ID 的 hash salt,钉住它等于让同源码重建产出相同的 action ID。

顺带两个记下来省得再查的点:`deploymentId` 只接受 `[a-zA-Z0-9_-]`(`build/index.js` 里的正则),语义化版本号带点会让构建直接失败;以及 `NEXT_DEPLOYMENT_ID` 的优先级和官方文档写的相反——文档说 config 优先,源码里 `loadConfig` 是只要该变量非空就用它覆盖 config 的值。

### 本项目的 Next.js 与训练数据不符

**现象**:按记忆写 App Router 代码,遇到 API 签名或文件约定对不上。

**原因**:Next.js 16 有 breaking changes,模型的先验知识往往停留在更早的版本。

**正确做法**:动手前先读 `node_modules/next/dist/docs/` 里的相关指南(从 `AGENTS.md` 所在目录解析)。这条也由 `next dev` 自动写进 `CLAUDE.md` 底部。

---

## 工具链

### 让 agent 跑验证前,先让它读项目脚本

**现象**:agent 自行执行 `npx tsc`、`eslint .` 之类的通用命令,得出「没有错误」或一堆假错误的结论。

**原因**:这些命令绕过了项目实际的配置——本仓库的 `pnpm type-check` 会先构建 content collections 并生成路由类型,`pnpm lint` 有专门的 ESLint 配置,直接跑通用命令得到的结果不可信。

**正确做法**:验证前先读 `AGENTS.md` 第 2 节和 `package.json` 的 scripts,只用其中列出的命令。

### `pnpm install` 之后必须重跑 `prettier:format`

**现象**:本地 `prettier:check` 通过,推上去 CI 在 `prettier:check` 挂掉,只报 `pnpm-lock.yaml` 一个文件。

**原因**:`prettier --check` 的检查范围包含 `pnpm-lock.yaml`,而 `pnpm install` 重写 lockfile 时不遵循 Prettier 格式。本地若在 install **之前**跑的格式化,改动就漏在检查之外。

**正确做法**:任何改动依赖(含只改 `pnpm.overrides`)的提交,顺序必须是 `pnpm install` → `pnpm prettier:format` → 提交。另外此时 `git diff --stat` 会显示 lockfile 上万行变动,那是 install 产物与格式化产物之间的中间差异;判断真实改动量要用 `git diff origin/main -- pnpm-lock.yaml`。
