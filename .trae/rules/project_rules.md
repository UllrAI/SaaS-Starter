## 技术栈规范

- 项目使用 Next.js 15.3 + Tailwind v4 + Better Auth 等库，版本疑问请查看 `package.json`
- 使用 TypeScript 严格模式

## 代码质量

- 严禁使用 `any` 类型，遵循 `@typescript-eslint/no-explicit-any` 规范
- 单个文件不超过 400 行，超出需拆分并考虑组件复用性
- 开发前优先检查现有可复用组件
- 组件命名使用 PascalCase，函数使用 camelCase
- 优先使用 Server Components，需要交互时使用 Client Components
- 所有功能都要正确实现，不要 Mock 数据或者硬编码示例数据

## 界面规范

- 界面语言使用英文
- 文案需符合 SEO 优化要求
- 页面需要设置合适的 metadata

## 验证流程

- **核心功能修改**: 执行 lint 和 format 检查及 `pnpm tsc --noEmit` 验证类型
- **部署前**: 执行 `pnpm build` 确保构建成功
