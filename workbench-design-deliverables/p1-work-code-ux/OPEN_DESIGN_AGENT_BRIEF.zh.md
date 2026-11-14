# Open Design Agent 任务书：Work / Code 高保真原型

## 最高优先级
- UX 直接研究并复刻成熟 Agent Desktop 的信息架构、导航、Session、Composer、执行、Pane 和 Diff 审查模式，不重新发明陌生 UX。
- Work 参考 Claude 当前统一任务体验；Code 参考 Claude Code Desktop，Codex 并行 Agent / Worktree / Diff Review 为补充。
- UI 唯一方向 Apple HIG / macOS / Liquid Glass；不再提供 A/B 或其他风格选择。
- 一级空间只有 Work / Code，不制作 Home。
- Soft Editorial 只记录，不实现。
- 旧 A/B 原型禁止作为视觉结构基准。
- 本任务只做 Open Design，不改生产代码、Runtime、Desktop 启动流程或正式设置系统。

## 页面清单
**Work**
W1 Empty：侧栏、Projects、Recent，中央 Composer 为焦点，2–4 个轻量任务提示，无 Runtime 仪表盘。
W2 Running：任务摘要、阶段、重要 Activity，低层工具调用折叠，可展开 Task Inspector。
W3 Waiting：权限请求、对象、原因、影响范围、批准/拒绝入口。
W4 Completed：结果摘要、Artifact 预览、执行过程折叠、继续追问。

**Code**
C1 Empty / Repository Select：仓库选择、New Session、最近仓库和 Session。
C2 Focus：单 Chat Pane、Session Toolbar、Agent 时间线和 Composer。
C3 Build：Chat + Terminal，Pane Header / Divider / Tab / Resize。
C4 Review：Changes + Diff，Unified / Side-by-side。
C5 Parallel Sessions：一个 Repository 下多个 Session，真实状态，不虚构 Worktree。
C6 Debug：Preview / Browser + Terminal；后端未确认则仅为概念原型。

**Shared**
S1 Appearance：Light / Dark、Accent Color、英文 JetBrains Mono、中文寒蝉半圆体、UI / Code / Terminal 字体切换、字号、恢复默认。主题导入只演示入口，不声称真实持久化。

## 交互
Work / Code 切换；创建任务/Session；打开 Project / Repository；切换 Recent；展开 Activity；Inspector 开关；Pane 添加/关闭/拖动/调尺寸；Focus / Build / Review / Debug 预设；Diff 文件切换；字体与明暗切换；Popover / Command Menu / Context Menu。

## 视觉
Liquid Glass 用于 Toolbar、Switcher、Sidebar、Popover 和浮动控件；内容层保持高可读。侧栏有悬浮感，背景可延伸其后。Concentricity 圆角、柔和阴影、边缘高光。连续画布优先，不堆卡片和 Badge。玻璃必须在真实背景上可见；仅 blur 属性不算完成。Light / Dark 与实色回退均需展示。

## 视口
1440×900 主画布；另检查 1280×800、1024、768、767。窄屏侧栏 Drawer，Inspector 可关闭，Code 切换单 Pane；不重叠、不覆盖用户宽度偏好。

## 质量红线
像后台、矩形卡片堆叠、默认方正中文、非 JetBrains 英文、玻璃不透射、Work/Code 不一致、所有 Pane 同时塞满、出现 Home / A-B、未批准修改生产代码，任一项均返工。

## 交付
可编辑 Open Design 项目、独立画板、tokens.css、typography.css、主题/字体原型、交互说明、来源清单、主视口与响应式截图、项目打开说明。

## 阶段门禁
先交付 W1 Work Empty 与 C2 Code Focus 两个基准页面，进行视觉质量自检并等待用户审查；通过后再扩展其余页面。未审计 Browser、Worktree、Editor、Checkpoint、Scheduled Task、Subagent 等能力必须列出依赖。
