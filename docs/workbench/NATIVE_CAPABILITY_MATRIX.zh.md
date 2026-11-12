# 原生能力保留矩阵

[English](NATIVE_CAPABILITY_MATRIX.md) | 中文

## 摘要

本文记录对锁定上游基线的源码核查结果，以及保留原生界面的条件。P1 Workbench Shell 尚未实现或测试；源码存在不等于运行时保留已经得到验证。

## 目录

- [能力矩阵](#capability-matrix)
- [Approval 与 Activity 的限制](#approval-and-activity-limits)
- [Workbench 验证](#workbench-verification)
- [开发备注](#dev-note)

-----

<a id="capability-matrix"></a>
## 能力矩阵

下表的 Host、API 和 UI 条目指出现有源码；保留方式是设计要求，并非测试结果。

| 原生能力 | Host Service 与 API | Client Module 与 UI 入口 | Workbench 保留方式 |
|---|---|---|---|
| Session | [SessionStore:1144](../../packages/core/session/src/index.ts)、[SessionController:135](../../packages/api/session-controller/src/index.ts) | [ClientSessions:250](../../packages/api/session-controller/src/client/sessions/service.ts)、[Conversation 主区域注册:586](../../packages/client/ui-conversation/src/client/apply.ts)、[Workspace Session 浏览:364](../../packages/client/ui-workspace/src/client/index.ts) | 复用原生 Conversation 与 Workspace Slot 树，并保留可到达的导航入口。 |
| Agent Activity | [SessionController 状态与活动事件:237](../../packages/api/session-controller/src/index.ts) | [Client 活动监听:121](../../packages/api/session-controller/src/client/index.ts)；Conversation 展示 Session 事件 | 复用可用事件；完整 Agent Activity 面板需要 Workbench 自行开发。 |
| Approval | [ApprovalService:167](../../packages/interaction/user-approval/src/index.ts)、[request:242](../../packages/interaction/user-approval/src/index.ts)、[远程事件:29](../../packages/api/remotes/src/remote-events.ts) | [Approval Composer 注册:97 与监听:107](../../packages/client/ui-approval/src/client/index.ts)、[Composer 声明:350](../../packages/client/ui-conversation/src/client/apply.ts) | 保留原生 Conversation Composer 链和 Approval 插件；仅通过受支持的扩展定制交互。 |
| Terminal | [TerminalSessionService:86](../../packages/terminal/terminal/src/index.ts)、[TerminalController:108](../../packages/api/terminal-controller/src/index.ts) | [Terminal 标签页:73 与内容:95](../../packages/client/ui-sidebar-terminal/src/client/index.ts) | 保留原生 Session 右侧栏标签页 Slot 树及其入口。 |
| Workspace | [WorkspaceRegistry:186](../../packages/workspace/workspace/src/index.ts)、[WorkspaceController:55](../../packages/api/workspace-controller/src/index.ts) | [Workspace Client 服务:118](../../packages/api/workspace-controller/src/client/service.ts)、[侧栏注册:364](../../packages/client/ui-workspace/src/client/index.ts) | 保留原生侧栏及其 Workspace 子 Slot。 |
| Files | [文件系统服务:104](../../packages/fs/fs/src/index.ts)、[WorkspaceFiles API:189](../../packages/api/workspace-files/src/index.ts) | [Files Client:64 与右侧栏标签页:174](../../packages/client/ui-sidebar-files/src/client/index.ts) | 保留原生 Session 右侧栏标签页 Slot 树及其 Session 上下文。 |
| Plugin Manager | [PluginManager:323](../../packages/boot/plugin-manager/src/index.ts)、[插件清单:51](../../packages/host/plugin-inventory/src/index.ts) | [Plugin Manager Client:86、主页面:129 与侧栏入口:167](../../packages/client/ui-plugin-manager/src/client/index.ts) | 复用原生服务，保留 Plugins 的主区域键和导航入口。 |

-----

<a id="approval-and-activity-limits"></a>
## Approval 与 Activity 的限制

原生 Approval 已有图形界面：Client 注册 Composer 内容并监听 `approval/request`。Host 请求要求存在打开的 Turn，并记录 asked 与 decided 事件（[request 实现:242](../../packages/interaction/user-approval/src/index.ts)）；仅保留服务不能保留图形审批流程。

Session 活动不等于完整的 Agent Activity 面板。Host 根据用户消息活动发出 `api-session/activity`，并单独转发 Agent 状态与错误（[SessionController:237](../../packages/api/session-controller/src/index.ts)）；Client 订阅活动事件（[Client 监听:121](../../packages/api/session-controller/src/client/index.ts)）。

-----

<a id="workbench-verification"></a>
## Workbench 验证

原生右侧栏只在选中 Conversation 时渲染可见的 Session 内容（[RightbarRoot:34](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)）；Terminal 与 Files 标签页属于 Session 作用域（[右侧栏注册:232](../../packages/client/ui-sidebar-right/src/client/index.ts)）。因此，独立选中的 Home 页面无法直接显示这一原生右侧栏。

Workbench 必须在其实际运行的 Profile 中验证各个保留的 UI 入口和 Approval 流程。本文不声称 P1 保留测试已通过。

-----

<a id="dev-note"></a>
## 开发备注

无。
