# 组件规范与架构约定

本文档基于当前仓库现状整理，目的是沉淀已经落地的组件实现规范、组件使用规范和分层方式，作为后续新增功能与重构时的默认基线。

## 1. 当前项目结构定位

仓库采用 monorepo 结构，当前职责边界已经比较清晰：

- `packages/ui`
  - 共享 UI 基础组件包
  - 承载主题令牌、通用样式、原子组件和轻量组合组件
- `apps/web`
  - Web 端应用
  - 消费 `@repo/ui`，负责页面结构、业务场景编排和应用级配置
- `apps/admin`
  - Admin 端应用
  - 同样消费 `@repo/ui`，不复制共享组件实现
- `apps/api`
  - 服务端能力，和 UI 层解耦

这意味着后续开发默认遵守一条主线：

- `packages/ui` 解决“可复用的表现层能力”
- `apps/*` 解决“页面、场景、业务编排”

## 2. 共享组件层的职责边界

`packages/ui` 里的组件应当保持以下特点：

- 以基础组件、原子组件、轻量组合组件为主
- 不承载具体业务语义，不写某个 app 专属逻辑
- 不耦合某个页面的数据获取、状态管理或接口请求
- 优先提供稳定、可复用、可组合的 UI primitive

按当前实现，下面这些属于共享层合理职责：

- `Button`
- `Badge`
- `Input`
- `Label`
- `Separator`
- `Card`
- `TailwindDemo` 这类用于共享样式验证或演示的轻量展示组件
- `theme.css` 中的设计令牌、全局基础样式
- `cn` 这类样式合并工具

下面这些更适合留在应用层，而不是直接塞进 `packages/ui`：

- 与 `web` 或 `admin` 特定业务绑定的表单
- 依赖接口结构的业务卡片
- 某个页面专属的筛选区、列表区、弹窗流程
- 带明确业务命名的复合模块

判断标准很简单：

- 跨 app 可复用，放共享层
- 只服务单一业务场景，放应用层

## 3. 组件实现规范

### 3.1 文件组织

当前共享组件包采用“一组件一文件”的平铺结构：

- `packages/ui/src/button.tsx`
- `packages/ui/src/input.tsx`
- `packages/ui/src/card.tsx`
- `packages/ui/src/label.tsx`

继续沿用这套方式更适合当前仓库，因为它有几个好处：

- 组件定位直接
- 导出路径稳定
- 对小中型共享组件库更轻量
- 避免过早引入复杂目录层级

除非组件规模明显增大，否则优先保持当前平铺方式。

### 3.2 导出方式

当前 `@repo/ui` 通过 `package.json` 的子路径导出共享组件：

- `@repo/ui/button`
- `@repo/ui/card`
- `@repo/ui/input`

后续保持以下约定：

- 应用层按组件子路径导入
- 不依赖单一 barrel 大总出口
- 新增组件时同步补齐 `packages/ui` 的导出规则兼容性

推荐写法：

```tsx
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
```

不推荐在 app 内做二次拷贝或重新包一层无意义中转。

### 3.3 类型写法

当前组件普遍采用 `React.ComponentProps<...>` 继承原生或 Radix primitive 的 props，这个方向是对的，建议继续保持。

推荐模式：

- 原生元素：`React.ComponentProps<'button'>`
- 第三方 primitive：`React.ComponentProps<typeof LabelPrimitive.Root>`

这样做的收益：

- 原生能力不丢失
- 类型维护成本低
- 包装层更薄，API 更自然

### 3.4 组件风格

当前共享组件的共同特征已经比较统一：

- 使用函数组件
- 组件职责单一
- props 解构清晰
- 默认样式内聚在组件内部
- 通过 `className` 开放扩展口

后续建议保持：

- 先定义基础结构和默认样式
- 再通过 `className` 允许调用方增量覆盖
- 不在 primitive 层引入业务状态分支

### 3.5 样式组织方式

当前样式体系是：

- Tailwind utility class 为主
- `cn()` 负责类名合并
- `cva()` 负责 variant / size 等变体配置
- 主题变量放在 `theme.css`

这是当前仓库最值得固定下来的模式。

建议继续遵守：

- 普通组件：`cn(baseClasses, className)`
- 存在多个视觉变体时：使用 `cva`
- 不把大量条件判断散落在 JSX 里
- 不在 app 层重复写同一套基础样式

`Button` 是当前最标准的模板：

- 基础样式集中
- `variant` 和 `size` 明确分层
- `defaultVariants` 提供默认值
- `asChild` 用于保持语义灵活性

后续新增可复用基础组件时，可以优先参考 `Button` 的组织方式。

### 3.6 变体与状态表达规范

这次组件库补充后，规范里需要把“状态可视化”和“操作层级”明确下来，不再只停留在通用 variant 概念。

当前已落地的模式包括：

- `Button` 用 `variant` 表达主操作、次操作、描边、幽灵、危险操作
- `Button` 用 `size` 表达尺寸层级
- `Badge` 用 `variant` 表达默认、次级、成功、警告、错误状态
- `Input` 通过 `aria-invalid` 驱动异常态边框与 ring

后续建议固定为以下规则：

- 操作层级必须通过显式 variant 命名，不靠页面局部 class 临时拼出来
- 危险操作统一进入共享组件变体，例如 `danger`
- 成功、警告、错误、信息这类反馈态优先沉淀为共享状态体系
- 表单异常态优先复用语义属性，例如 `aria-invalid`
- 不在应用层随意发明一套新的状态颜色和交互反馈

推荐理解方式：

- `variant` 负责“语义层级”
- `className` 负责“场景微调”

如果一个视觉差异会被反复使用，就不应该只留在页面里硬编码 class。

### 3.7 第三方 primitive 封装方式

当前 `Label`、`Separator` 已经体现出一个明确约定：

- 优先包装成熟的 Radix primitive
- 包装层只补样式、默认值和统一 API
- 不改坏底层组件语义

后续如果新增以下类型组件，建议继续沿用这条路线：

- Dialog
- Select
- Tabs
- Tooltip
- Checkbox
- Switch

封装原则：

- 保留底层能力
- 只做必要的样式统一与交互补齐
- 包装层尽量薄

### 3.8 `asChild` 约定

当前 `Button` 已支持 `asChild`，这非常适合共享组件层，建议作为默认能力之一保留。

适用场景：

- 按钮外观 + 链接语义
- 按钮外观 + 自定义容器

推荐写法：

```tsx
<Button asChild variant="ghost">
  <a href="/docs">Open docs</a>
</Button>
```

这类能力应放在共享 primitive 层统一解决，而不是每个 app 自己处理。

## 4. 主题与样式层约定

### 4.1 主题源头

当前共享主题入口为：

- `packages/ui/src/theme.css`

这个文件已经承担两类职责：

- 设计令牌定义
- 全局基础样式定义

后续建议继续把以下内容统一收敛到这里：

- 字体变量映射
- 品牌色
- 语义化 surface 层级
- 语义化 content 层级
- 语义化 border 层级
- 状态反馈色
- 阴影
- 半径
- 基础背景和前景色
- 通用 base layer

### 4.2 Token 命名规则

这次补充后，`theme.css` 已经不是简单的颜色常量集合，而是一套语义化 token 系统。后续应继续沿用这套命名方式。

当前已存在的 token 分层：

- `brand-*`
- `surface-*`
- `content-*`
- `border-*`
- `state-*`
- `radius-*`
- `shadow-*`
- `text-*`

后续约定：

- 优先写语义 token，不直接把组件绑定到底层色值概念
- 组件应优先消费 `surface-panel`、`content-secondary`、`border-default` 这类语义名
- 状态色统一从 `state-success`、`state-warning`、`state-error` 等语义 token 获取
- 新 token 命名优先扩展现有分层，不随意新开一套体系

这能保证共享组件和不同 app 的视觉语义一致，也让后续主题升级更可控。

### 4.3 应用层接入方式

当前 `apps/web/app/globals.css` 与 `apps/admin/app/globals.css` 都只做两件事：

- 引入 `tailwindcss`
- 引入 `@repo/ui/theme.css`

这是一个很好的边界，建议保持：

- app 的 `globals.css` 只做应用级少量补充
- 共享主题不要散落在每个 app 重复维护

推荐模式：

```css
@import "tailwindcss";
@import "@repo/ui/theme.css";
```

如果未来某个 app 需要局部品牌差异，优先做“增量覆盖”，不要复制整份共享主题。

### 4.4 组件状态样式约定

结合当前组件实现，后续状态样式建议遵循下面的落地规则：

- 默认态、悬浮态、聚焦态、禁用态应在共享组件内部闭环
- 聚焦态优先使用统一的 focus ring 和 focus border token
- 异常态优先使用语义属性驱动，例如 `aria-invalid`
- 不在业务页面里零散补同类状态样式

像 `Input` 里这类模式就应作为标准保留：

- 默认边框使用 `border-default`
- focus 使用 `border-focus` 与品牌 ring
- invalid 使用 `border-error` 与错误 ring

## 5. 应用层使用规范

### 5.1 应用层只负责消费和编排

当前 `apps/web/app/page.tsx` 和 `apps/admin/app/page.tsx` 的模式非常清晰：

- 直接使用 `@repo/ui` 共享组件
- 通过页面结构进行业务编排
- 用 `className` 做场景化布局调整

这是后续最推荐的使用方式。

应用层应该关注：

- 页面布局
- 区块组合
- 文案
- 业务数据绑定
- 场景差异化展示

应用层不应该做：

- 再复制一份 Button / Input / Card
- 为了一个页面重新发明基础样式体系
- 把共享 primitive 改造成某个页面专属 API

这次还新增了一个值得固定下来的约定：

- app 内可以保留“设计系统校验页”或“样式验证页”

例如当前的 `apps/web/app/design-system/page.tsx`，它的定位不是业务页面，而是用于验证：

- 品牌色和状态色是否稳定
- Button / Badge 等变体是否清晰
- 表单 focus / invalid 态是否符合预期
- 文本层级和面板层级是否一致

后续如果组件库继续扩展，建议保留这类页面作为回归检查入口。

### 5.2 导入规则

继续保持按需直连导入：

```tsx
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
```

好处：

- 依赖关系更清晰
- 组件来源更明确
- 共享层边界更稳定

### 5.3 扩展方式

应用层想做差异化时，优先按下面顺序扩展：

1. 先直接复用共享组件
2. 通过 `className` 做布局或视觉微调
3. 必要时在 app 内组合成业务组件
4. 只有确认具备跨 app 复用价值后，再上提到 `packages/ui`

这条路径可以避免共享层过早业务化。

## 6. 推荐的新增组件流程

后续新增组件建议按这个流程判断：

1. 先判断它是不是跨 app 复用
2. 如果是基础交互或通用展示，放到 `packages/ui`
3. 如果只是单页面模块，先留在 `apps/*`
4. 如果依赖稳定的第三方 primitive，优先包装 Radix
5. 如果有视觉变体，优先使用 `cva`
6. 如果只需要样式透传，保留 `className`
7. 如果需要切换宿主元素，优先考虑 `asChild`
8. 如果涉及状态反馈，优先接入现有语义 token 和状态 variant
9. 如果组件影响视觉规范，补充或更新设计系统校验页

## 7. 推荐的代码风格基线

结合当前共享组件实现，后续更推荐统一到下面这套风格：

- 使用函数声明式组件
- 以单引号为主
- 非必要不写分号
- props 就近解构
- 类型从原生元素或 primitive 自动继承
- 组件文件保持短小，避免一个文件塞多个复杂角色

说明：

- 当前仓库里仍有少量旧风格文件存在
- 后续新增或重构时，以共享 UI 这套新风格为优先基准
- 不要求为了风格一致性去额外大范围改旧文件

## 8. 当前项目的默认架构结论

如果用一句话概括当前项目已经形成的模式，就是：

“共享 UI 包统一提供主题和基础组件，业务 app 只负责按场景消费、编排和扩展，不在应用内重复造基础组件。”

后续协作默认以这个结论为准。

## 9. 可执行的落地规则

为了方便后续直接照着做，这里再收敛成一组短规则：

- 新基础组件优先放 `packages/ui/src`
- 新业务模块优先放 `apps/*`
- app 通过 `@repo/ui/<name>` 导入共享组件
- 共享样式统一经 `@repo/ui/theme.css` 暴露
- 颜色、边框、文本、状态优先使用语义 token，不直接散写色值
- 组件默认支持 `className` 扩展
- 多变体组件优先使用 `cva`
- 可复用交互优先包装 Radix primitive
- 状态反馈优先进入共享 variant 或共享 token 体系
- 表单异常态优先使用 `aria-invalid` 等语义属性驱动
- 不在 app 内复制共享 primitive
- 设计系统校验页作为共享组件回归入口长期保留
- 不让共享 UI 包承载具体业务逻辑

## 10. 后续可继续补强的方向

如果后面你希望继续把这套体系再往前推进，比较值得补的有：

- 为 `packages/ui` 补统一的组件模板
- 增加 `Dialog`、`Select`、`Tabs` 等常用 primitive
- 增加共享组件命名、目录、测试约定
- 增加业务组件上提的判断标准
- 增加 `web` / `admin` 各自的应用层目录规范

但在当前阶段，先守住现有这套分层和调用方式，已经足够形成稳定的项目规范。
