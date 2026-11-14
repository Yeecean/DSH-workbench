---
description: "dsh 桌面端 Workbench Liquid Glass 表现层：顶部 Work × Code 模式切换、Code 布局预设、全局任务检查器、离线字体与严格校验的自定义 JSON 主题设置。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-workbench

[English](README.md) | 中文

## 概述

使用本包可在原生 dsh 对话外壳之上叠加 Workbench 用户体验。它在会话顶栏挂载 **Work × Code** 模式切换器且不改变会话身份或清空输入草稿，通过 `ui-sidebar-right` 驱动四种 Code 布局预设（`Focus`、`Build`、`Review`、`Debug`），在经过仲裁的 `'shell.rightbar.global'` 单右栏轨道中提供全局任务检查器，默认启用离线 **寒蝉半圆体 (ChillRoundM)** 与 **JetBrains Mono**（同时保留用户自定义字体设置），并在「设置 → 通用」中提供持久化且严格校验的 **工作台与 Liquid Glass 外观** 配置行。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

本包由轻量的 Host 配置插件（`src/index.ts`）与浏览器 Client 插件（`src/client/index.ts`）组成。在桌面端发行版中由 `@deepseek-ai/dsh-workbench`（`packages/bundle/workbench`）挂载，从而保持 `web` 与 CLI profile 的默认隔离。

### 最小配置

```yaml
- insert:
    - id: ui-workbench
      name: "@deepseek-ai/dsh-client-ui-workbench"
```

所有 Host 选项（`defaultMode`、`accentPreset`、`reducedTransparency`、`reducedMotion` 与 `customThemeJson`）均为 `ui-workbench` 命名空间下的 volatile 用户偏好字段，持久化于用户配置并在[配置目录](../../../docs/config-catalog.zh.md)中记录；插件通过 `settings.configure({ auto: false }, ctx.fiber)` 禁用自动表单生成。

### 顶部模式切换与 Code 预设

`ModeSwitcher` 占据 `'conversation.header.leading'`，通过 `--dsh-frame-leading-clearance` 避让 macOS 窗口控制钮并遵循 Windows 标题栏拖拽区域（`-webkit-app-region: no-drag`）。在 **Work** 与 **Code** 间切换仅调整视觉密度与呈现 **Focus / Build / Review / Debug** 布局预设，不会新建或重置会话。`Focus` 收起右侧面板，`Review` 在单右栏中打开工作区文件，`Build` 与 `Debug` 在单右栏中打开终端。

### 全局任务检查器

`WorkTaskInspector` 占据 `'shell.rightbar.global'`，通过 `ctx.layout.openGlobalRightbar` 与 `closeGlobalRightbar` 开关，因此绝不会在 `Files`、`Terminal` 或 `Browser` 旁生成第二根物理右栏。打开任意原生右栏标签页时全局检查器自动让位；点击顶部 **检查器** 按钮可切换回任务检查器。

### 工作台外观与自定义主题 JSON

在 **设置 → 通用** 中，`WorkbenchAppearanceRow` 提供默认启动模式、强调色材质（`Blue`、`Graphite`、`Amber`、`Custom`）、降低透明度、减弱动态效果，以及严格校验的自定义主题 JSON 导入/导出/重置编辑器（上限 `32 KB`、要求纯对象、白名单色彩与长度 token 键、拦截 CSS 注入字符并在可用时校验 `CSS.supports`）。校验通过后的设置经 `configForms` 持久化（无宿主连接时回退 `localStorage`），并通过 `ctx.theme.overrideTokens` 实时注入主题令牌层。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

### 字体栈与 Liquid Glass 分层

`src/client/styles/workbench-glass.css` 在 `document.documentElement` 上设置 `data-dsh-workbench="1"`，覆盖 `--dsh-font-family-text-default`（`ChillRoundM`、`寒蝉半圆体`）与 `--dsh-font-family-code-default`（`JetBrains Mono`），使内置离线字体默认生效，同时确保 `ui-theme` 中的用户自定义字体变量（`--dsh-font-family-text`、`--dsh-font-family-code`）在配置时保持优先。强调色板与校验后的自定义主题 JSON 通过 `ctx.theme.overrideTokens('@deepseek-ai/dsh-client-ui-workbench', ...)` 成对写入 `{ light, dark }` 令牌覆盖。

### Client 插件边界

`src/workbench-settings.ts` 在 Host 与 Client 间同构共享。`src/index.ts` 仅导出 `Config` 与 `apply`。`src/client/components/` 下的 React 组件不导入 `@deepseek-ai/cordis`、不直接调用 Host RPC、也不接收 `ctx`，而是通过 `src/client/stores.ts` 的 `defineStore` 工厂（`createModeSwitcherStore`、`createWorkbenchSettingsRowStore`）搭配 `PropsStore`（`useStore`、`actions`）与 `src/client/index.ts` 注入的狭义回调交互。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-layout](../ui-layout/README.zh.md)——单右栏仲裁（`shell.rightbar.global`）与面板状态。
- [ui-sidebar-right](../ui-sidebar-right/README.zh.md)——由 Code 预设与检查器快捷入口打开的原生 `Files`、`Terminal` 与 `Browser` 标签页。
- [ui-theme](../ui-theme/README.zh.md)——离线 Workbench `@font-face` 资源、亮暗极性与令牌覆盖服务。
- [dsh-workbench](../../bundle/workbench/README.zh.md)——在桌面端将该插件叠加到 `web-app` 之上的 bundle 包。

-----

<a id="model-experience"></a>
## 模型体验

无。该包是浏览器端 UI 插件层，不注册任何面向模型的内容。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **P2–P6 工作台视图仍按里程碑分阶段交付** — 里程碑 P1 建立外壳样式、模式切换、单右栏仲裁、离线字体与主题持久化；更丰富的会话时间线聚合、Split/Unified Diff 审阅、终端/预览润色与内联审批卡片将在后续阶段逐步合入。
- **脱离 Host 设置连接的独立浏览器会话使用 `localStorage` 回退** — 当 `configForms` 只读或不可用时，Workbench 偏好改存 `localStorage` 键 `dsh.workbench.preferences.v1`。
- **P1 阶段模式切换不改动模型提示词或工具可见性** — 当前切换 **Work** × **Code** 仅调整界面密度与右栏焦点；提示词与工具预设将在后续里程碑按需接入。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
