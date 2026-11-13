# DSH Workbench Stage 2 — 完整交互与设计系统说明

本原型严格遵循 `p1-work-code-ux` 8 份设计规格与 [DSH_NATIVE_AUDIT.md](../DSH_NATIVE_AUDIT.md)，在完整保留 Stage Gate 1 独立基线（[screens/work-empty.html](./screens/work-empty.html) 与 [screens/code-focus.html](./screens/code-focus.html)）的前提下，已扩展为覆盖 **Work 全生命周期（W1–W4）**、**Code 全流程与多会话（C1–C6）** 以及 **Shared 全局设置（S1）** 的全功能 Workbench 原型。

## 1. 交付文件结构

- [index.html](./index.html)：Stage 2 统一可执行入口。支持顶栏 `Work | Code` 分段空间切换、工作区状态机切换、Code `Focus / Build / Review / Debug` 布局切换、`S1` 模态弹窗与窗口外底部可折叠的 `#stage-dock`（覆盖 11 个状态及 `1440×900` / `1280×800` / `1024×768` / `768×900` / `767×900` 视口预设）。
- 独立纯净审阅画板（11 张 `body[data-standalone="true"]`，均无外置演示条）：
  - **Work**：[work-empty.html](./screens/work-empty.html) (`W1`)、[work-running.html](./screens/work-running.html) (`W2`)、[work-waiting.html](./screens/work-waiting.html) (`W3`)、[work-completed.html](./screens/work-completed.html) (`W4`)
  - **Code**：[code-repo-empty.html](./screens/code-repo-empty.html) (`C1`)、[code-focus.html](./screens/code-focus.html) (`C2`)、[code-build.html](./screens/code-build.html) (`C3`)、[code-review.html](./screens/code-review.html) (`C4`)、[code-parallel.html](./screens/code-parallel.html) (`C5`)、[code-debug.html](./screens/code-debug.html) (`C6`)
  - **Shared**：[settings-appearance.html](./screens/settings-appearance.html) (`S1`)
- 核心资产：
  - [assets/tokens.css](./assets/tokens.css)：Light / Dark / Reduced Transparency / Reduced Motion / Accent 视觉令牌、Apple Liquid Glass 高光折边令牌与同心圆角参数；
  - [assets/typography.css](./assets/typography.css)：本地托管 `JetBrains Mono`（400/500/600/700）与 `寒蝉半圆体`（`ChillRoundM.ttf`）、DSH 字体角色变量、`font-size-adjust: from-font` 混排对齐及字重约束（`<= 500`）；
  - [assets/workbench.css](./assets/workbench.css)：macOS 浮窗舞台、Liquid Glass 与 Standard Material 严格分层、Unified & Side-by-Side Diff 样式、Conic Spinner、Top-Layer Dialog & Toast、Container Query 断点适配；
  - [assets/workbench.js](./assets/workbench.js)：外观设置 Popover、`<input type="checkbox" switch>` / `role="switch"` 同步、`<=1024px` / `<768px` 侧栏与抽屉交互、右栏宽度拖拽、`focusgroup` / Popover 回退与 IME 安全输入；
  - [assets/stage2.js](./assets/stage2.js)：Stage 2 状态路由、Per-Session 草稿保留、右栏纵向/横向双轴分割拖拽、Work 审批/澄清与排入下一轮队列交互、Code Unified/Side-by-Side/Wrap Diff 渲染及 `S1` 原生 `<dialog closedby="any">` 主题 JSON Token 允许列表预览。

## 2. 材质分层与视觉规范

| 层级区域 | 材质类别 | 关键约束与实现 |
| :--- | :--- | :--- |
| 窗口框、顶栏工具栏、左侧浮动侧栏、`Work \| Code` 切换器、Popover、Toast、移动抽屉 | Apple Liquid Glass | `--glass-chrome` / `--glass-chrome-strong` + `backdrop-filter: blur(...) saturate(...)` + 内边缘高光与柔和扩散投影；Code 滚动时 `.center-scroll.is-code-scroll` 顶部采用柔和 `mask-image` 渐隐进入顶栏下方 |
| Work Hero、对话流、Approval Card、Clarification 卡片、Diff、Terminal、Files、Deliverables、Composer | Standard Material | 使用实色/高不透明度标准表面（`--surface-content` / `--surface-composer` / `--surface-code` / `--surface-terminal`），在 `<768px` 移动覆盖态右栏使用 `--surface-composer` 确保零透字干扰 |
| 减弱玻璃透明效果（Reduced Transparency） | 实底回退 | `:root[data-transparency="reduce"]` 及 `@media (prefers-reduced-transparency: reduce)` 使用 `--solid-chrome` / `--solid-popover` 并关闭 `backdrop-filter` |
| 减弱动态效果（Reduced Motion） | 动效降级 | `:root[data-motion="reduce"]` 及 `@media (prefers-reduced-motion: reduce)` 将过渡时长降为 `0ms`，并对运行态 conic-gradient `<progress class="running-spinner">` 减速至 `6s` 固定弧长以保留活跃状态指示 |

## 3. 排版、字体栈与同心圆角几何

- **字体栈（保留 DSH 三组字体角色调节）**：
  - `--dsh-font-family-text`: `"JetBrains Mono", "寒蝉半圆体", sans-serif`（默认正文 `14px`，行高 `1.64`）
  - `--dsh-font-family-code`: `"JetBrains Mono", "寒蝉半圆体", monospace`（默认代码 `13px`，行高 `1.56`）
  - `--dsh-font-family-terminal`: `"JetBrains Mono", "寒蝉半圆体", monospace`（默认终端 `13px`，行高 `1.54`）
- **最小字号 `>= 13px` 与字重 `<= 500`**：所有正文、次级文本、辅助标签与控件最小字号统一锁定 `--font-size-aux: 13px`；全局最高使用 `--font-weight-medium: 500`，禁用合成粗体。
- **同心圆角（Concentricity）**：
  - 窗口 `--radius-window: 28px` -> 侧栏边距 `--sidebar-inset: 10px` -> 侧栏 `--radius-sidebar: 18px` -> 内边距 `--sidebar-pad: 8px` -> 列表行 `--radius-row: 10px`；
  - Composer 外框 `--radius-composer: 22px` -> 内边距 `--composer-pad: 8px` -> 内部槽位 `--radius-composer-slot: 14px`。
- **响应式断点（严格对齐 `packages/client/ui-layout/src/client/columns.ts`）**：
  - `@container workbench (width <= 1024px)`（对应 `SIDEBAR_AUTO_COLLAPSE=1024`）：侧栏自动收起为 `56px` 浮层胶囊轨道，支持手动展开；
  - `@container workbench (width < 768px)`（对应 `SIDEBAR_DRAWER_BREAKPOINT=768`）：侧栏收纳为滑出式抽屉，`Escape` / 点击遮罩可关闭并启用 `.inert` 焦点隔离，单轨右栏转为高不透明度覆盖层；
  - 宽度拖拽：`RIGHTBAR_MIN = 300px`、`CENTER_MIN = 400px`（拖拽安全下限保持充裕中栏空间）、上限 `0.7`；`C3 Build` / `C6 Debug` 支持单轨右栏内部上下可拖拽分栏（`--rightbar-split-ratio`）。

## 4. Stage 2 核心交互能力

1. **Work 生命周期 (`W1–W4`)**：
   - `W1 Empty`：聚焦 Hero 与提示词建议芯片；单轨右栏默认关闭。
   - `W2 Running`：支持在运行过程中通过底部 Composer 向队列中投递补充指令，柔和排入下一轮执行队列而不打断当前步；`Work Task Inspector` 在右栏分 tab 展示 `概览 / 计划 / 上下文 / 活动 / 交付物`。
   - `W3 Waiting & Recovery`：内联结构化审批卡（Allow once / Allow always / Reject）与澄清问题面板就地决策；切换任务或切换 `Work | Code` 空间后审批与输入草稿均按 Session 独立保留，点击恢复后自动更新侧栏状态徽标为 `运行中`。
   - `W4 Completed`：产物优先置顶展示主交付预览与附件清单，过程日志默认折叠不干扰阅读。
2. **Code 工作区与多会话 (`C1–C6`)**：
   - 保持 `Focus / Build / Review / Debug` 四套布局预设直接作用于同一 Session，不丢失终端与输入草稿；
   - `C4 Review` 支持单栏 `Unified` 与左右对照 `Side-by-Side Split` 及 `Wrap` 自动换行切换，保留非单靠颜色区分的 `+` / `-` 符号槽位；
   - `C5 Parallel` 演示同仓库下 4 个并发会话（`S-101..S-104`）的状态与草稿隔离；
   - `C6 Debug` 在单轨右栏中集成 `Preview (WebView) + Terminal` 上下分栏调试视口。
3. **Shared 全局设置 (`S1`)**：
   - 既提供独立画板 [settings-appearance.html](./screens/settings-appearance.html)，也支持在 [index.html](./index.html) 顶栏点击 `设置 S1` 呼出原生模态 `<dialog id="appearance-dialog" closedby="any">`（带 `::backdrop` 虚化、外部轻点/Escape 关闭及无支持浏览器的按压-释放回退）。
   - 支持 **主题 (`light | dark | system`)、强调色预设、减弱透明度、减弱动态效果、`text / code / terminal` 三组字体/字号/行高调节**，以及带 Token 白名单过滤的 **主题 JSON 导入预览**。

## 5. URL 状态直达参数与快捷键

- **快捷键**：
  - `Ctrl + \` / `Cmd + \`：切换左侧边栏展开、收起与移动端抽屉；
  - `Enter` / `Shift + Enter`：Composer 提交 / 换行（严格防护 `event.isComposing || event.keyCode === 229` 中文输入法组合态）；
  - 分栏拖拽分隔条焦点下支持 `ArrowUp` / `ArrowDown` 调整右栏上下分栏比例；
  - `Escape`：关闭移动抽屉、Popover 与原生 Modal Dialog。
- **URL 直达查询参数（便于直接打开审查对应状态）**：
  - `?state=w1|w2|w3|w4|c1|c2|c3|c4|c5|c6|s1`（`index.html` 直接切换对应工作流状态或弹出 `S1` 模态框）
  - `?workspace=work|code`
  - `?right=overview|plan|context|activity|deliverables|build-split|changes|preview|files|terminal|subagents`
  - `?theme=light|dark|system`
  - `?transparency=glass|reduce`
  - `?motion=default|reduce`
  - `?accent=blue|indigo|teal|graphite`
  - `?activity=open`

## 6. 原生能力复用与待审计边界诚实声明

- **已复用 DSH 原生能力**：双空间切换与 `columns.ts` 断点/单轨右栏（`ui-layout` + `ui-sidebar-right`）、结构化审批与澄清（`ui-approval` / `ui-user-questions`）、计划与交付物视图（`ui-plan` / `ui-deliverables`）、`Files / Terminal / Preview` 右栏面板、只读回合前后对比快照（`workspace-changes`）、子代理谱系只读查看（`ui-subagent`）以及原生 `light|dark|system` 与三组字体角色（`ui-theme`）。
- **明确标注待审计（不伪装为后端已实现）**：
  1. `C4 Review` 单 Hunk 写入 / 暂存 / 丢弃（`Stage / Apply / Discard Hunk`）标注「只读快照 · 单块写入待 Git 变更接口审计」；
  2. `C5 Parallel` Worktree 隔离强调仅底层 `experimental/tool-worktree` 工具已实现，前端下拉一键创建/切换 Worktree 标注待接口审计；
  3. `C6 Debug` BrowserView (`ui-sidebar-browser`) 为宿主已有能力，本地测试服务器需在终端显式启动，且页面点击直跳源码 AST 标注待审计；
  4. `S1` 强调色扩展、减弱透明度/动态效果及主题包 JSON 导入明确声明「仅当前原型实时 CSS 变量预览，未写入正式 `@deepseek-ai/dsh-client-ui-theme` 配置存储」；
  5. Cursor 风格文件回退检查点（File Checkpoints）仅存在上下文压缩 Checkpoint，文件级回滚明确标注待文件系统快照接口审计。
