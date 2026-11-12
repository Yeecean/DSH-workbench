# Workbench 开发路线图

[English](DEVELOPMENT_ROADMAP.md) | 中文

## 摘要

本路线图把受审计原生架构转化为有优先级的产品工作。它从架构审核开始，再建立 Workbench 壳层与单一共享 Session 路径，随后推进 File、Terminal、Approval、Plugin 与 Work/Code 页面。Windows Native 是首个交付世界；只有在本地 Host、Recovery 与 Plugin Boundary 稳定后才开始 WSL2。以下每项任务都包含依赖、源码范围、预期变化、验收条件与主要风险。

## 目录

- [规划规则](#planning-rules)
- [优先级顺序](#priority-order)
- [P0：架构审核](#p0-architecture-review)
- [P1：Workbench 壳层](#p1-workbench-shell)
- [P2：Session 与活动](#p2-session-and-activity)
- [P3：Workspace 与 Editor](#p3-workspace-and-editor)
- [P4：Terminal 与 Job](#p4-terminal-and-jobs)
- [P5：Approval 与 Plugin 中心](#p5-approval-and-plugin-center)
- [P6：Work 与 Code 编排](#p6-work-and-code-orchestration)
- [P7：WSL 执行世界](#p7-wsl-execution-world)
- [P8：发布与上游节奏](#p8-release-and-upstream-cadence)
- [里程碑退出条件](#milestone-exit-criteria)
- [进一步探索](#further-exploration)
- [开发备注](#dev-note)

-----

<a id="planning-rules"></a>
## 规划规则

每阶段交付可运行、可审核的产品切片。后续阶段可以消费前阶段的稳定 Interface，但不得依赖未完成 Host Contract。需要 Host 未暴露原生行为的功能，在该扩展点实现并验证前保持阻塞。

计划保留四个约束：

- 原生 Agent、Session、LLM、Tool、MCP、Skill、Persistence、Remote 与 Plugin Contract 保持权威。
- Workbench 变化通过 Bundle、Host/Client Plugin、Profile、Typert API、客户端 Slot 与 Theme Token 进入。
- 在 WSL 阶段明确改变范围之前，Windows Native 是验收平台。
- 计划只有在源码、测试、文档与已观察产品路径存在后才成为交付物。

任何阶段都不授权第二 RPC Stack、替代 Agent Loop、替代 Session Model 或具有直接 Node Access 的 Renderer。

-----

<a id="priority-order"></a>
## 优先级顺序

顺序优先证明架构与用户主要工作循环。File Editing 与 Terminal Integration 跟随共享 Session Surface，因为它们依赖该页面的 Resource Scope 与 Routing。

| 优先级 | 阶段 | 结果 |
|---|---|---|
| P0 | 架构审核 | 批准或修订组合、布局、平台与 Plugin Safety 决策 |
| P1 | Workbench 壳层 | 具有品牌和导航的 Windows Desktop，带原生 Host 与有界产品 Bundle |
| P2 | Session 与活动 | 一个具有可用 Agent/Activity State 的 Workbench Session Center |
| P3 | Workspace 与 Editor | 在连贯产品 Workspace 内使用原生 Workspace File Operation |
| P4 | Terminal 与 Job | 通过原生 Service 提供产品 Terminal 与 Background Activity |
| P5 | Approval 与 Plugin | 安全交互、Plugin Inventory 与特权 Mutation UX |
| P6 | Work 与 Code | 具有连贯产品模式与 Preset 的共享 Runtime |
| P7 | WSL 执行世界 | 独立 Linux Host Endpoint 与 Recovery Model |
| P8 | 发布节奏 | 可复现 Packaging、Upgrade 与上游同步 |

-----

<a id="p0-architecture-review"></a>
## P0：架构审核

### 目标

在代码开始前批准 Workbench 组合、客户端布局保留或替换决策、Windows-First 平台顺序与特权 Plugin Manager 行为。

### 前置依赖

- 阅读[上游同步报告](UPSTREAM_SYNC_REPORT.zh.md)、[原生架构审计](NATIVE_ARCHITECTURE_AUDIT.zh.md)、[目标架构](WORKBENCH_ARCHITECTURE.zh.md) 与[扩展点](EXTENSION_POINTS.zh.md)。
- 确认固定的上游 SHA，以及更新官方基线是否需要重新审计。
- 在 Package Name 或 Acceptance Task 确定前解决所有争议产品边界。

### 源码范围

`packages/boot/app-boot`、`packages/bundle/base`、`packages/client/modules`、`packages/client/ui-layout`、`packages/client/ui-slots`、`apps/desktop` 与 `apps/desktop-host`。

### 预期修改

可以修订文档与架构决策。本阶段不实现产品功能、Runtime 修改或 WSL Bridge。

### 验收条件

评审明确批准或要求修改 `AppFrame` 策略、Windows-First 范围、原生 API 边界、Plugin Privilege Model 与阶段顺序。任何架构变化都要在 P1 开始前更新受影响页面。

### 风险

批准含糊壳层或权限模型会在后续每个 Client 与 Host Plugin 中造成高成本返工。把建议当成已交付行为会隐藏未验证路径。

-----

<a id="p1-workbench-shell"></a>
## P1：Workbench 壳层

实现仍暂停于设计评审：原生 Session 右栏在全局 Home 页面隐藏。拟议的全局扩展与 Desktop Profile 隔离须获批准后，才能开始[最小原型计划](P1_PROTOTYPE_PLAN.zh.md)；详见 [Slot 审计](APPFRAME_SLOT_AUDIT.zh.md)。

### 目标

交付具有独特 Workbench 壳层、产品导航、执行/模式 Context 的 Windows Desktop 构建，并通过隔离 Workbench Profile 启动原生 Host。

### 前置依赖

- P0 批准。
- Workbench Bundle 与 Client Entry 的干净 Package Shape。
- 产品 Theme 与 Localization Inventory。
- 批准全局右栏布局扩展、仲裁和 Desktop Profile 隔离；现有 Slot 本身无法提供所需的 Home 右列。

### 源码范围

`apps/desktop`、`apps/desktop-host`、`packages/boot/app-boot`、`packages/bundle/base`、`packages/client/modules`、`packages/client/ui-layout`、`packages/client/ui-slots`、`packages/client/ui-theme` 与 `packages/client/ui-primitives`。

### 预期修改

- 增加 Workbench Bundle/Profile 组合。
- 增加 Workbench Client Package 与 `dsh.client` Entry。
- 保留原生 `AppFrame`、侧栏和 Session 右栏；通过批准的扩展及现有子 Slot 贡献 Home 和 Context。
- 增加 Semantics Product Token 与 Localized Shell Copy。
- 保留 Desktop Security Setting 与 Boot Injection。

### 验收条件

在 Windows Native Desktop 上，批准的隔离组合加载 Home 和 Context、保留原生 Conversation、Terminal 与 Files，并通过导航、窗口缩放、Renderer 重载、插件卸载和原生回退检查。在启动路径得到验证前，不假定 Desktop 支持单独命名的 Profile；不受支持的路径记为阻塞。

### 风险

Client Module 可能因 Host Release Change 失效。全局右栏与 Session 右栏可能争用宽度、可见性、焦点与生命周期；保留 Session 状态可能需要经批准的最小 `ui-sidebar-right` 适配及布局修改。Desktop Profile 与 User Data 隔离仍未验证。

-----

<a id="p2-session-and-activity"></a>
## P2：Session 与活动

### 目标

交付一个 Workbench Session 中心，展示持久 Message、Live Assistant Stream、Tool Call、Subagent、Job 与 Agent Status，同时不维护第二对话权威来源。

### 前置依赖

- P1 壳层与 Resource Scope Routing。
- 已确认原生 `session`、`subagents` 与 `job` 方法及其生成 Catalog。
- 已定义 Live-Only 与 Durable Activity Policy。

### 源码范围

`packages/core/session`、`packages/core/agent-loop`、`packages/api/gateway`、`packages/client/connection`、`packages/client/ui-session`、`packages/subagents`、`packages/jobs` 与生成 Typert Artifact。

### 预期修改

- 增加 Workbench Session Surface 与 Route。
- 跟随 Session Event，并通过原生 Journal/Snapshot Path 重建。
- 把 Assistant Stream Frame 渲染为临时状态，并对账到 `assistant/message` 或 `assistant/attempt`。
- 以稳定 Resource Identity 展示 Tool Call、Subagent Activation、Job 与 Approval Wait。
- 增加 Activity Center Filter，且不改变 Session Event Model。

### 验收条件

两个 Client 可以打开同一 Session，并在 Reconnect 后收敛到相同持久历史。丢失 Stream 不会创建已完成 Message。Renderer 崩溃后从 Host 重建。Activity View 标识 Host Generation、Session 与 Event Range，并在 Session Close 时释放 Subscription。

### 风险

Live Stream Rendering 可能与 Durable Settlement 竞态。产品 Projection 可能跨 Reconnect 或 Access Change 变陈旧。复制 Message Store 可能与追加式 Session Source 分歧。

-----

<a id="p3-workspace-and-editor"></a>
## P3：Workspace 与 Editor

### 目标

提供由原生 Host 文件操作支撑的 Workbench File Workspace 与 Editor Experience，包含项目导航、Tab、File Change 与平台正确保存行为。

### 前置依赖

- P1 Resource Scope 与 P2 Session/Workspace Routing。
- 已确认 `workspace` 与 `workspaceFiles` 方法、Upload/Download Route 与 File Access Policy。
- 不绕过 Host File Authority 的 Editor Component 决策。

### 源码范围

`packages/workspace`、`packages/fs`、`packages/client/ui-workspace`、`packages/client/ui-files`、`packages/client/file-upload`、`packages/client/ui-primitives` 与生成 File API。

### 预期修改

- 增加 Workbench File Explorer、File Tab、Viewer 与 Editable Buffer。
- 通过 Host API 路由 Read、Write、Rename、Upload 与 Delete。
- 展示原生 Workspace 与 File Access State。
- 在 Panel Change 与 Reconnect 中保留 Unsaved Buffer，并显式处理 Conflict。
- 增加 Editor Command，且不暴露 Raw File System Access。

### 验收条件

Windows 文件可以在不直接访问 Renderer File System 的情况下打开与保存。并发外部编辑产生可恢复 Conflict。Cancellation 与 Access Revocation 停止操作。Symlink 与 Workspace Boundary Behavior 与当前 Host File Semantics 一致。

### 风险

缺少 Revision 与 Conflict Rule 时，Editor Buffer 可能覆盖更新 Host Content。产品 Tab 可能保留旧 Workspace 或 Host Generation 的文件。大文件与 Binary Handling 需要显式限制。

-----

<a id="p4-terminal-and-jobs"></a>
## P4：Terminal 与 Job

### 目标

把持久 Terminal 与 Job Activity 集成到 Workbench，使用户能够跟随执行、Reload 后重连，并通过原生 Host Service 取消或停止所有权内工作。

### 前置依赖

- P1 Layout 与 P2 Activity State。
- 已确认 `terminal` 与 `job` 方法。
- 已在 Desktop Carrier 测试 Windows ConPTY 与 Persistent PowerShell 行为。

### 源码范围

`packages/terminal`、`packages/subprocess`、`packages/jobs`、`packages/client/ui-terminal`、`packages/client/ui-jobs` 与 Desktop Process Ownership。

### 预期修改

- 增加 Terminal Tab 与 Split。
- 把每个 Terminal 附着到 Workspace 或 Session Context。
- 在原生服务支持时于 Renderer Reload 后恢复 Terminal State。
- 展示 Job Progress、Output、Cancellation 与 Failure。
- 把 Process Ownership 绑定到活动 Host Generation 与 Execution World。

### 验收条件

Terminal 在正确 Workspace 与 Shell 中启动，承受 Renderer Reload，并可关闭而不留下 Orphan Process。Job Cancellation 到达 Host 并记录原生 Result。Window Close 遵循 Readiness、Graceful Stop、Timeout 与 Forced-Stop Behavior。

### 风险

Process Ownership 可以超出 UI 生命周期。Terminal Output 可能在 Reconnect 时丢失。WSL 后续引入 Windows Terminal Host 不能假设的另一进程世界。

-----

<a id="p5-approval-and-plugin-center"></a>
## P5：Approval 与 Plugin 中心

### 目标

为 Workbench 提供完整 Approval、Question、Plugin Inventory 与 Plugin Mutation UX，同时保留 Fail-Closed Policy 与特权 Host Behavior。

### 前置依赖

- P1 壳层与 P2 Activity Input。
- 已确认 Approval、Question、`pluginInventory` 与 `pluginManager` 方法。
- 由于特权操作而进行的产品 Copy 与 Security Review。

### 源码范围

`packages/interaction/user-approval`、`packages/interaction/user-questions`、`packages/boot/plugin-manager`、`packages/client/modules`、`packages/client/ui-settings` 与 API Remote Access。

### 预期修改

- 增加 Approval Center 与 Pending Approval Choice/Input UI。
- 展示 Decision History 与 Question Answer。
- 增加 Plugin Inventory、Compatibility、Source 与 Profile Detail。
- 实现受保护的 Install、Update 与 Remove Flow。
- 展示 Restart/Reload Outcome，包括 `restart-required`。

### 验收条件

任何 Client 都不能在其授权 Scope 外回答。不可用 Answerer 使操作保持阻塞或拒绝。Plugin Operation 展示 Profile、Source、适用时的完整 Git Commit、请求 Effect 与 Approval State。Reload 或 Restart Requirement 可见且可测试。

### 风险

Approval UI 可能看起来具有权威性，但 Host Policy 才是真正所有者。Plugin Code 在进程内执行；不清晰 Mutation Path 会使用户错误升级为 Host-Wide Change。

-----

<a id="p6-work-and-code-orchestration"></a>
## P6：Work 与 Code 编排

### 目标

在同一 Session、Agent、Model、MCP、Skill、Project、File、Task 与 Permission System 上提供不同的 Work 与 Code 产品呈现。

### 前置依赖

- P2–P5 页面已足够稳定，可以组合。
- 共享 Session Switching 不丢失 Identity 或 Activity。
- Product Preset 具有持久、用户可见的表示。

### 源码范围

Workbench Client Bundle、`packages/client/ui-layout`、`packages/client/ui-session`、产品 Localization，以及 Preset 改变 Admission 时的 Host Policy Plugin。

### 预期修改

- 增加 Mode Navigation 与 Default Panel Composition。
- 增加 Work-Focused Documents、Tasks、Activity 与 Approval。
- 增加 Code-Focused Workspace、Files、Terminal 与 Tool Activity。
- 让 Mode Switch 保留当前 Session，并记录所有 Preset Change。
- 在两个模式间共享 Permission 与 Environment Control。

### 验收条件

任务在 Work 与 Code 呈现之间移动，不改变 Session Identity，也不重复持久 History。隐藏 Panel 既不授予也不撤销 Host Permission。Mode-Specific Tool 或 Prompt Preset 在 Session Audit 中可见，并与 Reconnect 兼容。

### 风险

产品模式可能漂移为重复 Runtime 或含糊状态。隐藏控件可能制造关于 Permission 与 Environment 的错误假设。

-----

<a id="p7-wsl-execution-world"></a>
## P7：WSL 执行世界

### 目标

设计并后续实现 WSL2 中完整 Linux DSH Host，使 Windows Workbench 可以发现、启动、认证、路由、恢复并关闭它，同时不把 Linux Path 暴露给 Renderer。

### 前置依赖

- Windows 产品切片与 Recovery Path 已稳定。
- WSL Distribution 具备受支持 Linux Node 与 pnpm Installation。
- Endpoint Discovery、Authentication 与 Path Policy 已批准。
- Threat Model 覆盖 Local User、NAT、Host/Origin、Cookie 与 Process Supervision。

### 源码范围

`apps/desktop`、`apps/desktop-host`、`packages/client/connection`、`packages/api/gateway`、`packages/api/remote-access`、`packages/workspace`、`packages/fs`、`packages/subprocess`、`packages/terminal` 与 Platform Provider Package。

### 预期修改

- 增加 WSL Discovery 与 Lifecycle 的 Workbench Host Adapter。
- 定义私有认证 Endpoint。
- 在 Distribution 内启动完整 Linux DSH Profile。
- 将 Session、Workspace、Terminal、Files 与 Job Call 路由到所选 Host。
- 持久化 Execution-World Identity，并在 Socket、Host 或 VM Loss 后恢复。

### 验收条件

Windows Renderer 连接 WSL Host 并完成 Session，无需把 Host Logic 导入 Browser。File 与 Terminal Operation 使用 Linux Host API。Disconnect 与 Host Restart 从原生 Session Data 对账。任何 Path 都不在 World 间静默转换，未认证网络访问被拒绝。

### 风险

NAT 与 Localhost Behavior、Native Module Compatibility、Duplicate Process Tree、Credential Leakage、Path Confusion 与 Crash Recovery 仍开放。环境和安全验收存在前，本阶段应保持阻塞。

-----

<a id="p8-release-and-upstream-cadence"></a>
## P8：发布与上游节奏

### 目标

建立可重复 Workbench Build、Packaging、Upgrade 与 Upstream-Sync Process，同时保留精确原生基线与产品扩展集合。

### 前置依赖

- 一个产品切片足够稳定，可以 Packaging。
- Host/Client Compatibility 与 Plugin Reload Rule 已测试。
- Release Signing、Update Distribution 与 Supply-Chain Path 已选择。

### 源码范围

`apps/desktop`、根构建脚本、`scripts/release`、`pnpm-lock.yaml`、`packages/client/modules` 与 Release/Update 文档。

### 预期修改

- 记录上游 SHA、Package Version、Workbench Version 与 Build Environment。
- 增加 Reproducible Build 与 Smoke-Launch Check。
- 产出具有 Signing 与 Update Metadata 的 Windows Artifact。
- 增加上游 Fetch/Diff/Rebase Review Routine，并保留 Original-Fork Ref。
- 记录 Rollback 与 Compatibility Behavior。

### 验收条件

干净机器可以从记录输入复现 Build。打包 Windows Artifact 启动、连接 Host 与 Renderer，并在无 Developer Tool 的情况下完成 Smoke Session。Upstream-Sync Review 从新 SHA 开始，报告受影响 Area，并在落地前运行所选测试。

### 风险

Binary Mirror、Native Module、Key 与 Release Automation 可能隐藏环境依赖。未固定上游更新会使生成 Typert Artifact、Client Module 与扩展假设失效。

-----

<a id="milestone-exit-criteria"></a>
## 里程碑退出条件

产品不能仅因 UI 可编译就进入下一阶段。每个里程碑都需要 Clean-Home Setup、Host Boot、Renderer Connection、Ownership Disposal、一个 Failure/Recovery Path，以及同一 Source Commit 上的证据。

| 里程碑 | 用户可见结果 | 工程证明 |
|---|---|---|
| M1：壳层 | Workbench 在 Windows 启动 | Profile Boot、Host Connection、Native AppFrame Integration |
| M2：Session | 原生 Agent 对话在 Workbench 工作 | Stream Settlement、Reconnect、Restore、Scope Disposal |
| M3：Workspace | File 通过 Host 打开与保存 | Access、Conflict、Cancellation、Platform Path Test |
| M4：执行 | Terminal 与 Job 可运行并恢复 | Process Ownership、Shutdown、Job Cancellation |
| M5：安全 | Approval 与 Plugin 可审核且 Fail Closed | Unauthorized Answer Refusal、Commit Pin、Restart Matrix |
| M6：模式 | Work 与 Code 共享一个 Task Identity | Shared Session、Visible Policy、Mode Switch Recovery |
| M7：WSL | 可达并可恢复的独立 Linux Host | Discovery、Auth、Path Map、Crash 与 Shutdown Test |

-----

<a id="further-exploration"></a>
## 进一步探索

- [Workbench 架构](WORKBENCH_ARCHITECTURE.zh.md)——审核本计划实现的架构。
- [扩展点](EXTENSION_POINTS.zh.md)——为每阶段选择契约。
- [平台兼容性](PLATFORM_COMPATIBILITY.zh.md)——确认 Windows 与 WSL 边界。
- [上游同步报告](UPSTREAM_SYNC_REPORT.zh.md)——在阶段工作前复现基线。

-----

<a id="dev-note"></a>
## 开发备注

无。
