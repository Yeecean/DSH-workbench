# P1 Desktop 设计工作区

[English](README.md) | 中文

## 摘要

本目录汇集 P1 拟议视觉方向、原生主题证据和可编辑设计探索，不代表产品功能已实现或最终视觉方案已获批准。

## 文档

| 文档 | 用途 |
|---|---|
| [设计审计](DESIGN_AUDIT.md)与[简报](DESIGN_BRIEF.md) | 证据、限制、范围和比较标准 |
| [视觉方向](VISUAL_DIRECTION.md)与[材质规范](MATERIAL_GUIDELINES.md) | 两套方向与克制的半透明材质 |
| [设计系统](DESIGN_SYSTEM.md)与[组件映射](COMPONENT_MAPPING.md) | 设计规则与原生组件复用 |
| [主题系统](THEME_SYSTEM_SPEC.md)与 [Token 映射](TOKEN_MAPPING.md) | 现有主题归属与拟议 Token 职责 |
| [主题导入](THEME_IMPORT_SPEC.md)与[外观设置](APPEARANCE_SETTINGS_SPEC.md) | 拟议自定义、校验、预览和恢复 |
| [交互](INTERACTION_SPEC.md)与[响应式布局](RESPONSIVE_SPEC.md) | 拟议导航、状态和宽度行为 |
| [Context 信息架构](CONTEXT_INFORMATION_ARCHITECTURE.md) | 全局和 Session 局部信息及未确认的数据来源 |
| [V2 预检](PRECHECK_REPORT.md)与 [Open Design Agent 任务书](OPEN_DESIGN_AGENT_BRIEF.md) | 当前源码检查点和交给用户设计 Agent 的指令 |
| [待决问题](OPEN_QUESTIONS.md) | 仍需决定的事项和证据 |
| [可编辑视觉原型](source/index.html) | 保留的本地 HTML 探索稿与初始基线 |

## Open Design 项目与导出

Open Design 原生项目 `DSH Workbench P1 — Desktop Shell 与右栏仲裁`（项目 ID `dsh-workbench-p1-shell`）保存在 `C:/Users/Haoyang/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/dsh-workbench-p1-shell`。在 Open Design 桌面端打开该项目并选择 `index.html`，即可继续编辑和交互式切换 A/B 方向与状态预设（支持 `?preset=S1..S8`、`?dir=native|product`、`?view=compare`、`?vp=1440|1280|1024|768|767`）；也可直接打开 `screens/01-home-context.html` 至 `screens/06-theme-import.html` 独立画板，以及 `assets/tokens.css`、`assets/theme-schema.json` 和 `DESIGN_COMPARISON.md`。

| 导出画面 | 状态与方向说明 |
|---|---|
| [方向 A：Home + Context](exports/od-a-home-context.png) 与 [方向 B：Home + Context](exports/od-b-home-context.png) | 无活动 Session 时的 Home 与全局 Context（`1440 × 900`） |
| [方向 A：Conversation + Session](exports/od-a-conv-session.png) 与 [方向 B：Conversation + Session](exports/od-b-conv-session.png) | Conversation 与原生 Session 右栏（`Terminal` 与 `Files` 保持实色表面，`1440 × 900`） |
| [方向 A：Conversation + Context](exports/od-a-conv-context.png) 与 [方向 B：Conversation + Context](exports/od-b-conv-context.png) | 单轨切换至全局 Context，同时保留 Session 逻辑状态（`expanded = true`、标签/分栏、偏好宽度 `360px` 与恢复焦点） |
| [窄窗口降级状态](exports/od-b-narrow-767.png) | `767 × 900` 窄窗口下左栏转为抽屉、右栏让出物理常驻轨道并转为显式抽屉入口 |
| [外观设置与实色回退对比](exports/od-b-appearance-glass-vs-solid.png) | 受控局部毛玻璃与实色回退（`prefers-reduced-transparency` / 无 `backdrop-filter`）及原生 `ui-theme` 字体字号设置 |
| [主题导入校验与恢复流程](exports/od-b-theme-import-flow.png) | 版本化主题 JSON 预览、不安全 CSS/URL 注入拦截、取消、应用与一键回滚至默认浅色 |
| [方向 A 与方向 B 十维对比矩阵](exports/od-ab-comparison-matrix.png) | 原生延续型（A）与轻度产品化型（B）的并排架构与视觉评估 |
| [保留的初始探索导出](exports/desktop-home-a.png) | 早期本地 HTML 探索稿快照（[Home B](exports/desktop-home-b.png)、[Session Dark](exports/desktop-session-dark.png)、[Narrow Context](exports/narrow-context.png)、[Native Welcome](exports/native-welcome.png)） |

## 评审边界

两套视觉方向需要展示相同的页面和状态，包括实色与玻璃效果对比。主题导入是最迟 P1.1 交付的明确能力，包含安全数据校验和恢复；视觉原型不实现真实导入。

原生 Session 右栏和拟议全局 Context 以仍待批准的[右栏 ADR](../../GLOBAL_RIGHTBAR_ADR.md)为准。保留的本地 HTML 探索稿与可继续编辑的 Open Design 原生项目（`dsh-workbench-p1-shell`）均为设计评审产物；P1 设计评审不改变原生 Runtime，也不授权产品界面实现。

## 开发备注

除明确标为原生观察的内容外，原型数据、文字和交互均为示例。
