# Token 映射

[English](TOKEN_MAPPING.md) | 中文

## 摘要

本映射依据源码列出可供拟议 Workbench 设计使用的原生主题变量。新的材质和间距角色仍是提议，不是现有设置或 API。

## 目录

- [现有角色](#existing-roles)
- [拟议角色与限制](#proposed-roles-and-limits)
- [开发备注](#dev-note)

-----

<a id="existing-roles"></a>
## 现有角色

原生调色板在 [design-platform.css:177–204, 325–330](../../../../packages/client/ui-theme/src/styles/design-platform.css) 定义两种模式；主题服务在 [client index.ts:153–167](../../../../packages/client/ui-theme/src/client/index.ts) 列出可检查的语义别名。这是代表性映射，不表示每个原生组件都只使用别名。

| Workbench 角色 | 现有原生变量或契约 | 复用方式和限制 |
|---|---|---|
| 基底和抬升表面 | `--dsw-alias-bg-base`、`--dsw-alias-bg-layer-1`、`--dsw-alias-bg-layer-2` | 使用基底和分层别名；在两种模式中验证颜色组合。 |
| 前景和分隔线 | `--dsw-alias-label-primary`、`--dsw-alias-label-secondary`、`--dsw-alias-border-l1`、`--dsw-alias-border-l2` | 将文字、边框和焦点标记与实际表面共同验证。 |
| 品牌和状态 | `--dsw-alias-brand-primary`、`--dsw-alias-state-error-primary`、`--dsw-alias-state-success-primary`、`--dsw-alias-state-warn-primary` | 语义状态必须区别于用户选择的强调色。 |
| 侧栏 | `--dsw-specific-sidebar-fill` | 保留现有原生侧栏角色；验证周围 Workbench 表现。 |
| 字体族 | `--dsh-font-family-text`、`--dsh-font-family-code`、`--dsh-font-family-terminal` | 使用按角色规范化的列表和原生回退字体栈（[theme-settings.ts:64–78](../../../../packages/client/ui-theme/src/theme-settings.ts)、[base.css:7–31](../../../../packages/client/ui-theme/src/styles/base.css)）；xterm 直接读取主题快照（[terminal.tsx:95–103](../../../../packages/client/ui-sidebar-terminal/src/client/terminal.tsx)）。 |
| 内容字号 | `--dsh-content-font-size`、`--dsh-code-font-size`、`--dsh-terminal-font-size` | 原生分角色字号有范围限制；内容文本字号不是通用 UI 缩放（[theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)）。 |
| 圆角 | `--dsw-radius-xs` 至 `--dsw-radius-xl`、`--dsw-radius-panel` | 使用原生形状层级（[base.css:18–23](../../../../packages/client/ui-theme/src/styles/base.css)）。 |

-----

<a id="proposed-roles-and-limits"></a>
## 拟议角色与限制

比较现有 Token 和基础组件后，才定义全局 Workbench 材质透明度、模糊强度、玻璃边框、实色回退和布局间距。名称、单位、允许范围、双模式值及回退值需要实现评审。避免组件各自硬编码和无界主题值；不能为了匹配强调色覆盖原生错误或焦点语义。

Token 表包含固定调色板值，部分组件也包含字面样式，例如 [TerminalCleanup.module.css:2](../../../../packages/client/ui-sidebar-terminal/src/client/TerminalCleanup.module.css) 的阴影。该示例只能说明存在例外，不代表对整个代码库的统计。导入白名单必须明确制定，不能假设所有现有 CSS 变量都是安全输入。

-----

<a id="dev-note"></a>
## 开发备注

具体值和视觉对比度尚未成为已验证设计决策；需要在实际原型的两种模式中评估。
