# Workbench 扩展点

[English](EXTENSION_POINTS.md) | 中文

## 摘要

DeepSeekRuntime 已提供分层扩展机制：Cordis 服务与事件、Scoped Tool Registration、LLM Adapter、Session Projection、Interaction Policy、Bundle 与 Profile、Host/Client Plugin Package、Typert Remote API 和客户端 UI Slot。Workbench 功能应使用拥有其决策与生命周期的最窄机制。以下源码契约指出产品代码的归属，以及哪些原生行为必须保持不变。

## 目录

- [选择顺序](#selection-order)
- [自定义工具](#custom-tools)
- [自定义模型路由](#custom-model-routes)
- [自定义 Agent 行为](#custom-agent-behavior)
- [Session Projection 与活动](#session-projections-and-activity)
- [Approval 与 Question Policy](#approval-and-question-policy)
- [Host 与 Client Plugin Package](#host-and-client-plugin-package)
- [Bundle 与 Profile 组合](#bundle-and-profile-composition)
- [Typert Remote API](#typert-remote-apis)
- [Workspace、Terminal、Files 与 Job](#workspace-terminal-files-and-jobs)
- [客户端 UI Slot 与 Theme](#client-ui-slots-and-theme)
- [Plugin Inventory 与 Mutation](#plugin-inventory-and-mutation)
- [兼容性与恢复](#compatibility-and-recovery)
- [验证要求](#validation-requirements)
- [进一步探索](#further-exploration)
- [开发备注](#dev-note)

-----

<a id="selection-order"></a>
## 选择顺序

先使用现有能力调用。如果原生服务暴露操作，就调用该服务。如果产品需要观察或影响决策点，就使用该决策拥有的 Event 或 Registration。如果产品需要新客户端呈现或 Route，就增加 Client Plugin。只有 Host 状态必须暴露给一个或多个 Client 时，才增加 Product API。

| 需求 | 首选扩展 | 原生归属 |
|---|---|---|
| 使用 Agent、Session、File、Terminal、Job、Setting 或 Plugin 操作 | 既有 Host Service 或 Typert API | 对应原生包 |
| 增加 Agent 可调用能力 | Scoped Tool Registration | `ctx.tools` |
| 增加或路由 Model Provider | LLM Provider Plugin 或 Model Selection Policy | `ctx.llm`、Agent Model Selection |
| 改变 Turn Decision 或观察生命周期 | 已记录 Agent 或 Capability Event | Agent Loop 与所属服务 |
| 增加模型可见派生内容 | Session Message Projection | `ctx.sessions` |
| 增加产品客户端页面 | Client Plugin 与 UI Slot | Client Cordis 与 `ui-slots` |
| 将新 Host 产品状态暴露到远端 | Typert Remote Method 或 Stream | Gateway 与 Remote Access |
| 改变 Profile Plugin 组合 | Bundle Patch 与 Profile Layer | App Boot |

选择顺序避免普通功能演变为 Runtime Replacement。它也确保 Cancellation、Approval、Access、Persistence 与 Teardown 留在已经定义它们的服务中。

-----

<a id="custom-tools"></a>
## 自定义工具

Tool 是 Capability Registration，而不是 Renderer Shortcut。Workbench Tool 通过 `ctx.tools` 注册 Schema 与 Execution Handler；Agent 为所选模型解析已准入 Schema，并在普通执行管线中调用 Tool。

| 要求 | 当前归属 |
|---|---|
| Tool Schema 与 Model Visibility | `ctx.tools` 与 System Prompt Assembly |
| Per-Step Admission | Agent Loop Tool-Set Resolution |
| Pre-execute、Execute 与 Post-execute Policy | 原生 Tool Execution Event |
| Cancellation 与 Result Logging | Agent Loop 与 Session Event |
| Workspace 与 Sandbox Access | 原生 Tool Implementation 与 Environment Provider |

选择 API 前阅读[Tools 子系统](../subsystems/tools.zh.md)、[`core/tools`](../../packages/core/tools/README.zh.md) 和生成 [Tool Catalog](../tool-catalog.zh.md)。自定义 Tool 应返回类型化结果并保留 Execution Signal。它不得创建在 Cancellation 后继续运行的非受管工作。

Tool 专属产品示例包括打开 Workbench Panel、读取产品 Project Record 或请求 Editor Action。Shell、File System、Terminal、MCP 与 Skill 工作应先检查是否已有官方 Tool拥有操作，再新增具有重叠权限的 Tool。

-----

<a id="custom-model-routes"></a>
## 自定义模型路由

模型流量归属 LLM Service。Provider Package 在 `ctx.llm` 下实现 Adapter Contract；Client 或 Session 在 Step Preparation 前选择可用 Provider/Model/Effort。Agent Loop 在请求构造前固定该选择，之后 `agent/request` 不能改变。

| 控制项 | 正确归属 | 源码 |
|---|---|---|
| Provider Adapter 与 Stream | `ctx.llm` | [LLM Streaming 子系统](../subsystems/llm-streaming.zh.md) |
| 可用模型与 Metadata | Provider Adapter Registration | `packages/llm/*` |
| Route Selection | Step Preparation 前的 `agent.model.select()` | [agent.ts](../../packages/core/agent-loop/src/agent.ts)，第 289-323、618-659 行 |
| Per-Request Controls | `agent/request` | [architecture.md](../architecture.zh.md)，第 114 行 |
| Retry Policy | Provider Call 与 `agent/request-error` | [agent.ts](../../packages/core/agent-loop/src/agent.ts)，第 547-569 行 |

**源码推断：**Workbench Model Policy 可以观察 Agent Event、筛选 Model Chooser，或在 Step 前选择默认 Route。它不得在 `agent/request` 内修改 Provider、Model 或 Reasoning Effort；Loop 会拒绝该滞后变化，并要求调用方使用 `agent.model.select()`。

如果 Provider Registry 暴露所需 Metadata，产品 Router 可以根据 Project Policy、Data Residency、Capability、Cost 或 Availability 选择 Route。选择必须记录到 Session 可见状态。若 Route 在 Retry 间静默变化，持久 Request History 的含义就会失效。

-----

<a id="custom-agent-behavior"></a>
## 自定义 Agent 行为

Agent Loop 拥有 Turn 与 Step 顺序。产品策略附着到 Event，而不是复制 Loop。Waterfall Listener 可以标注决策并调用 `next()`，也可以在其拥有策略时有意短路。Serial 与 Emit Event 具有不同顺序，必须保留已记录语义。

| Event 或 Service | 产品用途 | 约束 |
|---|---|---|
| `agent/pre-step` | 接受、改写或拒绝已认领输入；增加已准入 Context | Waterfall；非终端策略应调用 `next()` |
| `agent/request` | 调整允许的 Request Controls | Provider、Model 与 Effort 已固定 |
| `agent/request-error` | 应用 Retry Policy | 必须保留 Cancellation 与 Failure 语义 |
| `agent/turn-stopping` | 检查 Stop Boundary | Serial；无 Waterfall `next()` 契约 |
| `llm/stream` | 按契约观察或转换 Provider Stream | 必须保留 Stream Frame 与 Cancellation |
| `tools/pre-execute` | 在 Execution 前应用 Tool Policy | Waterfall；保留预期委派 |
| `tools/execute` | 包装已准入 Execution | 必须保留 Signal 与 Result Identity |
| `tools/post-execute` | 按契约观察或转换已结算 Result | 保留 Error 与 Audit Fact |

精确生成 Event Catalog 是权威来源。产品 Listener 必须通过自己拥有的 Cordis Effect 注册，并在卸载时释放。错误 Listener 会影响 Host 中每个 Agent，因此 Workbench Agent Policy Package 应有聚焦测试套件和 Profile 中明确的关闭开关。

只有当产品需要 Event 或 Service 无法提供的不同 `Agent` Interface 行为时，替换 Agent Implementation 才成立。该变化必须具备与原生 Loop 相同的 Live Event、Session Event、Cancellation、Subagent、Approval 与 UI Compatibility。

-----

<a id="session-projections-and-activity"></a>
## Session Projection 与活动

Session Event 是持久活动来源。UI Activity 可以观察 Live `agent/assistant-stream` Frame 以获得响应性，但持久状态要从 Session Event 对账。改变既有 Message Content 的 Plugin 注册纯 Message Projection；它不重写已存 Event。

| 扩展 | 用途 | 源码 |
|---|---|---|
| 增加自定义持久 Event | 必须跨 Reload 保留的产品事实 | `session.append()` 与 Event Map |
| 观察 Session Event | 产品 Timeline 或 Follow Stream | `session/event` 与 API Follow Method |
| 观察临时 Assistant Stream | 低延迟呈现 | `agent/assistant-stream` |
| 改变模型可见 Message Derivation | Plugin-Owned Pure Projection | `ctx.sessions.registerMessageProjection()` |
| 恢复 Pending Input | 读取 `agent/inbox/spliced` Projection | 原生 Inbox Projection |

Workbench Activity Center 应区分 Live-Only 与 Durable State。崩溃后消失的 Stream Chunk 不是已完成 Message。Tool Call 在对应 Session Event 提交前不是 Result。产品派生 Task Status 必须标识产生它的 Event Range 或 Projection Generation。

-----

<a id="approval-and-question-policy"></a>
## Approval 与 Question Policy

Approval 与 Question 已暴露 Host Service 与 Client Interaction Path。Workbench 应增加用于发现、Context 与 Response 的中心，而不是第二层权限。不可用 Answerer Fail Closed，Pending Approval State 为进程本地状态，Decision 则被审计。

| 产品行为 | 扩展 |
|---|---|
| 展示 Pending Approval | 原生 Approval API 与 Client Model |
| 批准或拒绝 | 原生 Approval Answer Path |
| 提出或回答 User Question | 原生 User Questions API |
| 增加产品策略 | 具有明确优先级的 Approval Policy Plugin |
| 展示 Decision History | Session/Audit Event Projection |

产品策略可以要求原本自动执行的 Workbench 操作获得 Approval。它不得削弱下层策略。如果 Host 或 Client 无法到达 Answerer，操作按原生 Fail-Closed 规则保持拒绝或阻塞。

-----

<a id="host-and-client-plugin-package"></a>
## Host 与 Client Plugin Package

完整 Workbench Plugin 可以同时包含两面。Host Entry 是注册 Host Capability 的 Cordis Plugin 或 Service。Package Manifest 在 `dsh.client` 下声明 Client Entry，客户端模块将该 Entry 加载到 Renderer Cordis 树。

| 元素 | Host 职责 | Client 职责 |
|---|---|---|
| Package Metadata | Host Entry 与 Service Export | `dsh.client` Client Entry |
| Lifecycle | 注册 Host Service、Event、Tool、API | 注册 UI、Store、Listener 与 Route |
| Authority | File System、Process、Credential 与 Plugin Operation | 仅呈现与用户交互 |
| Teardown | 释放 Host Effect 与拥有资源 | 释放 UI Effect 与 Stream/Store Scope |
| Compatibility | Host Release 与 Typert Descriptor Version | Client Module 与 Bootstrap Compatibility |

客户端半边不得把 Host Implementation Code 导入 Browser。通信通过生成的 Typert Remote Method 或 Stream。共享 Pure Type 可以通过没有 Node-Only Dependency 的 Package 分发。

创建 Package Skeleton 前阅读 [Plugin Manager README](../../packages/boot/plugin-manager/README.zh.md) 与[客户端模块 README](../../packages/client/modules/README.zh.md)。只注册普通 Library API 的 Package 不是可安装 Profile Plugin；应根据 Manifest 与 Entry 行为分类 Package。

-----

<a id="bundle-and-profile-composition"></a>
## Bundle 与 Profile 组合

Workbench Bundle 应向原生组合增加产品 Row。Bundle 导出 Patch File，并允许 Profile 将其叠加到 `dsh-base` 上。Profile 可以增加或替换 Row，用户或部署可叠加自己的 Patch。

| 层 | Workbench 用途 |
|---|---|
| `dsh-base` | 原生 Agent、Session、LLM、Tool、Persistence、Policy、Settings |
| Workbench Bundle | 产品 Host API、Policy、Client Module 与 Product Row |
| Workbench Profile Patch | 产品默认值与所选呈现 |
| Home Patch | 用户环境与偏好覆盖 |
| `--patch` Overlay | 开发、测试或部署变化 |

Bundle Ownership 应小且声明式。一个 Plugin 的代码变化归属其 Package；组成产品的 Row 变化归属 Bundle 或 Profile Patch；部署专属 Host、Port、Credential 或 Path 归属 Overlay。

Profile Patch 替换 Row 完整 Config。它必须包含目标 Row 需要的每个 Config Field；评审应在组合前后比较 `dsh --profile <name> --dump-config`。只复制一个已改 Field 会静默移除默认值。

-----

<a id="typert-remote-apis"></a>
## Typert Remote API

Typert 是受支持的 Host/Client API 管线。业务包用 `@Remote` 标记公开 Host Method；Scoped Receiver Method 使用 `@RemoteScope`。Generation 产出 Input/Result Codec、Descriptor、Client Declaration、Schema 与 Resource Metadata。

产品 Namespace 适合 Workbench 拥有的 Host State，例如 Execution-World Registry 或 Product Workflow Record。原生 Namespace 继续拥有 Session、Workspace、Terminal、File、Job、Setting、Credential、Command、Skill、Plugin 与 Subagent。

| 要求 | 实现 |
|---|---|
| Call | 在 public instance method 上使用 `@Remote` |
| Scoped Receiver | `@RemoteScope(key)` |
| Stream | `@Remote({ mode: 'stream' })` |
| Uplink | 声明 Stream Input 并读取 Invocation Uplink |
| Resource Policy | 声明 Resource Reader 并注册所属 Resource Kind |
| Failure | 抛出带稳定 Code 与类型化 Detail 的 `RemoteError` |
| Client Access | 使用生成的 `ctx.remote` Namespace Method |

不得为业务调用编写平行 Request/Response Protocol、Socket 或 Browser Fetch Wrapper。一元调用使用既有 HTTP 路径，逻辑流使用 `/api/remote.mux`。原生 Connection 拥有 Authentication、Reconnect、Request Correlation 与 Stream Lifecycle。

-----

<a id="workspace-terminal-files-and-jobs"></a>
## Workspace、Terminal、Files 与 Job

这些能力跨越 Renderer、Host、操作系统与执行环境，对归属尤其敏感。Workbench UI 应使用其 API 并保留 Host Policy。

| 能力 | 已确认原生 Namespace | Workbench 扩展 |
|---|---|---|
| Workspace Selection 与 Lifecycle | `workspace` | 产品导航与环境路由 |
| File | `workspaceFiles` | Tree、Viewer、Editor、Save、Upload 与 Diff UI |
| Terminal | `terminal` | Tab、Split、Task Association、Reconnect |
| Job 与 Background Work | `job` | Activity Card、Progress、Cancellation |
| Command | `commands` | Command Palette 与 Execution Entry |
| Skill | `skills` | Discovery 与 Project-Aware Recommendation |
| Subagent | `subagents` | Tree、Status 与 Stop Control |

File Explorer 不得从 Chromium 直接读取本地 Path。它调用 Host File Service，使 Authentication、Workspace Scope、Cancellation 与 Platform Behavior 生效。Terminal Panel 附着 Host Terminal Session，并在 Reload 后恢复正确 Session 或 Workspace Context。

-----

<a id="client-ui-slots-and-theme"></a>
## 客户端 UI Slot 与 Theme

客户端 UI Extension 是可逆 Cordis Registration。原生 `AppFrame` 声明 `sidebar`、带 Key 的 `main`、`rightbar`、`shell.bottom`、`shell.overlay` 与 `shell.leading`。各 Slot 的占用和作用域不同：原生 Session 右栏在全局主面板上隐藏，详见 [Slot 审计](APPFRAME_SLOT_AUDIT.zh.md)。

| 产品页面 | 推荐 Slot 或 Client Mechanism |
|---|---|
| 环境与模式导航 | Sidebar 内部扩展；`shell.leading` 仅在特定折叠或抽屉状态出现 |
| Project 与 Session Navigation | `sidebar` |
| Main Work 或 Code Surface | 带 Key 的 `main` |
| Agent Context | Session 右栏或 `shell.bottom`；全局 Home 常驻右栏需要新布局扩展 |
| Command Palette 与 Modal Flow | `shell.overlay` |
| Status 与 Task Progress | `shell.bottom` 或专用 Sidebar Section |

Theme Token 应来自 `ui-theme`，产品 Token 通过受支持 Theme Contract 增加。产品组件应使用 Text、Border、Surface、Accent、Status 与 Focus 等语义 Token，而不是 Hard-Coded Global Color。

如果 Child-Slot Occupant 需要 Session、Workspace 或 Terminal Scope，它必须注册在匹配 Scope Owner 内。UI State 与 Effect 应随 Slot Registration 释放。跨 Session Change 保持挂载的 Component 必须显式切换或释放底层 Resource Subscription。

-----

<a id="plugin-inventory-and-mutation"></a>
## Plugin Inventory 与 Mutation

Plugin Inventory 适合产品发现。Plugin Install、Remove 与 Update 是特权 Host Operation，因为 Package Code 在 Workspace Sandbox 之外的进程内执行。Git Update 要求完整 40 字符 Commit。

| 操作 | 产品要求 |
|---|---|
| 浏览 Inventory | 展示 Profile、Package、Version、Source、State 与 Compatibility |
| Install | 命名 Profile 与 Source；要求原生 Approval Path |
| Update | 为 Git Source 固定完整 Commit；展示 From/To State |
| Remove | 展示 Dependent Plugin 与 Restart/Reload Impact |
| No-HMR Result | 展示 `restart-required`，不得声称立即完成 |

Workbench Plugin Center 不得把 Package Name 或 Branch Name 当作内容 Pin。它应保留 Host Transaction Result，并在 Release Change 要求 Restart 时显示恢复步骤。

-----

<a id="compatibility-and-recovery"></a>
## 兼容性与恢复

Host 与 Client Contract 可以跨 Release 独立变化。Host Release Update 可以使已加载 Client Module 失效，缺失生成 Typert Descriptor 可以阻止 Product API 挂载。Client Boot Path 检测 Release Mismatch，并可以要求 Reload。

产品扩展应在构建 Metadata 中记录原生 Baseline SHA 与所需 Package Version。Runtime Compatibility Check 应以可执行消息失败，命名 Host、Product Package、Expected Contract 与 Reload/Restart Action。

Reconnect 使用原生 Connection Generation 与 Journal/Snapshot 语义。Workbench Store 不能在 Stream Dispose 后继续写入，也不能在 Reconnect 后假设相同 Collection Baseline。Session-Follow 与 Access-Follow Stream 应从各自原生 Generation Boundary 重新建立。

-----

<a id="validation-requirements"></a>
## 验证要求

每个扩展点都有相应证明：

| 扩展 | 必需验证 |
|---|---|
| Host Service 或 Event | 聚焦 Contract Test 与 Load/Unload Disposal Test |
| Tool | Schema Generation、Admission、Execution、Cancellation 与 Result Logging |
| Model Route | Provider Stream、Selection Record、Retry 与 Unavailable-Provider Behavior |
| Session Projection | Restore 与 Replacement 后确定性 Derived Message |
| Typert Method 或 Stream | Generated Artifact、Access Policy、Cancellation、Reconnect 与 Error Code |
| Client Plugin | Route/Slot Render、Locale、Theme、Focus、Disposal 与 Host Reload Behavior |
| Bundle/Profile | `--dump-config` Diff 与 Clean Home 中 Profile Boot |
| Plugin Mutation | Privilege/Approval、完整 Commit Pin 与 Restart-Required Recovery |

计划行为在所属测试或已执行产品路径存在前仍是提议。Typecheck 通过不能证明 Lifecycle、Authorization、Recovery 或 User-Visible Behavior。

-----

<a id="further-exploration"></a>
## 进一步探索

- [原生架构审计](NATIVE_ARCHITECTURE_AUDIT.zh.md)——阅读这些扩展点背后的 Runtime 与 Process Behavior。
- [Workbench 架构](WORKBENCH_ARCHITECTURE.zh.md)——把扩展放入目标产品组合。
- [平台兼容性](PLATFORM_COMPATIBILITY.zh.md)——将平台约束应用到 File、Terminal、Sandbox 与未来 WSL。
- [开发路线图](DEVELOPMENT_ROADMAP.zh.md)——安排实现与验收工作顺序。

-----

<a id="dev-note"></a>
## 开发备注

无。
