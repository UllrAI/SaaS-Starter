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

**正确做法**:用 `messageMetadata` 回调捕获——`part.type === "finish"` 带整轮的 `totalUsage`,`part.type === "finish-step"` 带单步的 `usage` 和 `response.modelId`(provider 实际使用的模型,比读配置准确)。捕获到闭包变量,由 `onEnd` 统一落库。

注意 `messageMetadata` 的返回值会发给客户端,用量数据不要放进返回值。参见 #92。

### 中止的回合同样消耗 token

**现象**:用户关闭页面后统计出的 AI 成本低于账单。

**原因**:只在正常完成时记账。但流被中止时,已经产生的 token 早已计费。

**正确做法**:`onEnd` 的 `isAborted` 为 `true` 时照样记一条,用单独的列标记。丢弃这些记录会让成本统计在最贵的场景下系统性偏低。

---

## Next.js

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
