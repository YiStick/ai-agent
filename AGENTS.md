# Project Conventions

本仓库后续协作默认遵循 `packages/ui` 与 `apps/*` 当前已经形成的组件封装和使用模式，优先保持一致性，不额外引入第二套组件组织方式。

详细规范见：

- `docs/component-architecture.md`

执行约定：

- 共享基础组件统一放在 `packages/ui/src`
- 应用层页面与业务编排放在 `apps/web`、`apps/admin` 等子应用
- 子应用通过 `@repo/ui/<component>` 按组件直连导入，不在应用内复制一份共享组件
- 主题令牌与全局基础样式统一由 `@repo/ui/theme.css` 提供，子应用只在自身 `globals.css` 中引入
- 设计 token 优先使用语义化命名，如 `brand`、`surface`、`content`、`border`、`state`
- 新增组件或修改组件调用方式时，优先延续现有的 Tailwind + `cn` + `cva` + Radix wrapper 模式
- 组件状态和操作层级要通过 variant 显式表达，例如主操作、次操作、危险操作、成功/警告/错误状态
- 应用层保留设计系统校验页，用于验证颜色、层级、表单状态和共享组件变体是否稳定
