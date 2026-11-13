# DSH Workbench Stage Gate 1 — 交互与设计系统说明

本原型严格对齐 `p1-work-code-ux` 8 份设计规格与 `DSH_NATIVE_AUDIT.md`，仅交付 **W1 Work Empty** 与 **C2 Code Focus** 两张基准页面及其可切换壳层，作为后续阶段前的视觉与交互门禁基准（不包含 Home、A/B 对比视图、Soft Editorial 或 S1 独立设置页）。

## 1. 交付文件结构

- [index.html](./index.html)：Stage Gate 1 主入口。默认加载 **W1 Work Empty**，可通过顶部 `Work | Code` 分段控件切换至 **C2 Code Focus**；窗口外底部附带可折叠的 `#stage-dock`（视口预设 `1440×900`、`1280×800`、`1024×768`、`768×900`、`767×900` 及独立画板直达链接）。
- [screens/work-empty.html](./screens/work-empty.html)：纯净 **W1 Work Empty** 独立审阅画板（`body[data-standalone="true"]`，无任何外置演示条）。
- [screens/code-focus.html](./screens/code-focus.html)：纯净 **C2 Code Focus** 独立审阅画板（`body[data-standalone="true"]`，无任何外置演示条）。
- [assets/tokens.css](./assets/tokens.css)：Light / Dark / Reduced Transparency / Accent 视觉令牌、Apple Liquid Glass 高光折边令牌与同心圆角几何参数。
- [assets/typography.css](./assets/typography.css)：本地托管 `JetBrains Mono`（400/500/600/700）与 `寒蝉半圆体`（`ChillRoundM.ttf`）的 `@font-face`、DSH 原生字体角色 CSS 变量、混排 `font-size-adjust: from-font` 对齐及字重约束（`<= 500`）。
- [assets/workbench.css](./assets/workbench.css)：macOS 浮窗桌面舞台、Liquid Glass Chrome 与 Standard Material 主阅读区分离样式、同心圆角、响应式容器断点及顶部渐隐蒙版。
- [assets/workbench.js](./assets/workbench.js)：外观与字体 Popover 状态管理（含 URL 参数覆盖）、Popover/Anchor/Focusgroup 渐进回退、`<=1024px` / `<768px` 侧栏与抽屉交互、右栏单轨拖拽与 Tab 切换、IME 安全 Enter 发送及代码复制。

## 2. 材质分层：Liquid Glass 与 Standard Material 边界

| 层级区域 | 材质类别 | CSS 关键规则 | 设计约束 |
| :--- | :--- | :--- | :--- |
| 窗口、工具栏、左侧栏、Popover、移动抽屉 | Apple Liquid Glass | `--glass-chrome` / `--glass-chrome-strong` + `backdrop-filter: blur(...) saturate(...)` + 内边缘镜面高光与软投影 | 只用于功能性导航与控制浮层；背景 `.canvas-ambient` 铺满窗口底层，C2 时间线顶部允许平滑滑过栏位下方（`.center-scroll.is-code-scroll` 软边蒙版） |
| Work Hero、对话流、代码块、输入框、右栏面板 | Standard Material | `--surface-content` / `--surface-composer` / `--surface-code` / `--surface-user-bubble` 实色/高不透明度面板 | 严格隔离玻璃雾化，保障长对话、中文段落与等宽代码的高对比度可读性 |
| 降低透明度模式（Reduced Transparency） | 实底回退 | `:root[data-transparency="reduce"]` 及 `@media (prefers-reduced-transparency: reduce)` 使用 `--solid-chrome` / `--solid-popover` 并关闭 `backdrop-filter` | 可在右上角 `外观与字体` Popover 即时切换并对比 |

## 3. 排版、字体栈与字号底线

- 默认字体角色变量（绑定 DSH `packages/client/ui-theme` 命名）：
  - `--dsh-font-family-text`: `"JetBrains Mono", "寒蝉半圆体", sans-serif`（默认正文 14px，行高 1.64）
  - `--dsh-font-family-code`: `"JetBrains Mono", "寒蝉半圆体", monospace`（默认代码 13px，行高 1.56）
  - `--dsh-font-family-terminal`: `"JetBrains Mono", "寒蝉半圆体", monospace`（默认终端 13px，行高 1.54）
- **最小字号 13px 约束**：全站辅助文本（侧栏时间、分支胶囊、Disclosure 摘要、按钮标签、Badge、KV 标签、Stage Dock）统一锁定 `--font-size-aux: 13px`；代码与终端调节步进器下限同样锁死在 `13px`。
- **字重克制**：正文采用 `400`，标题与选中态最高采用 `500`（`--font-weight-medium`），配合 `font-synthesis-weight: none` 禁用合成粗体。
- **混排协调**：`.inline-code` 启用 `font-size-adjust: from-font`（并在 `@supports not` 中回退 `calc(var(--dsh-code-font-size) + 0.5px)`），使英文等宽与寒蝉半圆体中文并排时不显局促。

## 4. 同心圆角几何与容器断点

- **窗口与侧栏嵌套**：窗口外圆角 `--radius-window: 28px` -> 浮动侧栏外距 `--sidebar-inset: 10px` -> 侧栏圆角 `--radius-sidebar: 18px` -> 侧栏内边距 `--sidebar-pad: 8px` -> 列表行圆角 `--radius-row: 10px`（`28 - 10 = 18`，`18 - 8 = 10`）。
- **Composer 嵌套**：外框 `--radius-composer: 22px` -> 内边距 `--composer-pad: 8px` -> 内部槽位控件 `--radius-composer-slot: 14px`（`22 - 8 = 14`）。
- **胶囊与圆点**：`.pill-round`、`999px` / `50%` 控件使用 `corner-shape: round`；窗口与主卡片在支持时渐进应用 `corner-shape: superellipse(1.5)`。
- **响应式断点（对齐 `columns.ts`）**：
  - `@container workbench (width <= 1024px)`（对应 `SIDEBAR_AUTO_COLLAPSE=1024`）：侧边栏自动收缩为 `56px` 浮层胶囊轨道，支持手动展开覆盖；
  - `@container workbench (width < 768px)`（对应 `SIDEBAR_DRAWER_BREAKPOINT=768`）：主工作台切换为隐藏态移动抽屉，`Escape`、遮罩点击与 `.inert` 焦点隔离完整可用；
  - 右栏拖拽（`#right-resizer`）：严格遵守 `RIGHTBAR_MIN=300px`、`CENTER_MIN=400px`（拖拽安全下限保留 430px）与 `0.7` 最大窗口比例上限。

## 5. 键盘交互与测试快捷键

- **Popover 与锚定定位**：使用原生 `popover="auto"` + `commandfor` / `command="toggle-popover"`，在不支持 Invoker Commands 或 CSS Anchor `position-area` 的引擎下自动激活 JS 视口边界回退定位，并同步触发按钮的 `aria-expanded`。
- **Focusgroup 导航**：顶部 `Work | Code` 切换器、右栏 `Files | Terminal | Inspector` Tab 及下拉菜单使用 `focusgroup`（并提供方向键、`Home` / `End` 与 Roving `tabindex` 完整 JS 回退）。
- **IME 安全发送**：Composer 监听 `keydown`，在 `event.isComposing || event.keyCode === 229` 时绝不误触发提交，`Enter` 提交、`Shift+Enter` 换行。
- **侧栏切换快捷键**：`Ctrl + \` 或 `Cmd + \` 切换侧栏展开 / 收起 / 抽屉。
- **URL 状态直达参数**（便于审阅截图与回归测试）：
  - `?theme=light|dark|system`
  - `?transparency=glass|reduce`
  - `?accent=blue|indigo|teal|graphite`
  - `?workspace=work|code`（`index.html`）
  - `?right=files|terminal|inspector`（打开单轨右栏并定位至指定标签）
  - `?activity=open`（默认展开 C2 最近运行 Disclosure）

## 6. DSH 原生能力复用与待审计边界声明

- **已复用（Stage 1 可交互）**：
  - `Work | Code` 双空间顶栏切换与上下文面包屑；
  - C2 紧凑计划摘要（`<details class="plan-disclosure">` 默认折叠，无虚构百分比进度条）；
  - C2 运行活动面板（`<details class="activity-disclosure">` 默认折叠）；
  - 单轨右栏 `Files | Terminal | Inspector`（复用 `ui-sidebar-right` 模型与拖拽调宽）；
  - 单轮文件改动摘要条（链接打开 `Files` 清单，复用 `workspace-changes` 概念）；
  - 顶栏 `外观与字体` Popover（Light/Dark/System、降低透明度、强调色、三组字体与字号切换及恢复默认）。
- **待审计（Stage 1 严禁伪装为可用）**：
  - Git Branch / Worktree 创建与隔离切换：Branch Popover 仅诚实展示只读当前分支与设计基线，不提供伪切换开关；
  - 布局菜单中的 `Review · Hunk 审核`、`Debug · 断点检查`、`Custom · 自定义分栏`：标记为 `aria-disabled="true"` 并标注“待审计”，点击仅提示当前原型边界；
  - Full Diff Hunk Viewer、内嵌 Code Editor、Agent Checkpoints 与实时 Browser Preview 均未提前透支展示。
