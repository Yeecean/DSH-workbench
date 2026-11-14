# Native Capability Matrix

English | [中文](NATIVE_CAPABILITY_MATRIX.zh.md)

## Summary

This reference records what source inspection found in the pinned upstream baseline and the conditions for retaining its user interface. The P1 Workbench shell has not been implemented or tested; source presence does not establish runtime preservation.

## Table of Contents

- [Capability matrix](#capability-matrix)
- [Approval and activity limits](#approval-and-activity-limits)
- [Workbench verification](#workbench-verification)
- [Dev Note](#dev-note)

-----

<a id="capability-matrix"></a>
## Capability matrix

Host, API, and UI entries below identify existing source; the preservation column describes a design requirement, not a test result.

| Capability | Host service and API | Client module and UI entry | Workbench preservation |
|---|---|---|---|
| Session | [SessionStore:1144](../../packages/core/session/src/index.ts), [SessionController:135](../../packages/api/session-controller/src/index.ts) | [ClientSessions:250](../../packages/api/session-controller/src/client/sessions/service.ts), [Conversation main registration:586](../../packages/client/ui-conversation/src/client/apply.ts), [workspace Session browser:364](../../packages/client/ui-workspace/src/client/index.ts) | Reuse the native Conversation and Workspace slot trees and retain navigation to them. |
| Agent Activity | [SessionController status and activity events:237](../../packages/api/session-controller/src/index.ts) | [Client activity listener:121](../../packages/api/session-controller/src/client/index.ts); Conversation displays Session events | Reuse available events; a complete Agent Activity panel requires Workbench development. |
| Approval | [ApprovalService:167](../../packages/interaction/user-approval/src/index.ts), [request:242](../../packages/interaction/user-approval/src/index.ts), [remote event:29](../../packages/api/remotes/src/remote-events.ts) | [Approval composer registration:97 and listener:107](../../packages/client/ui-approval/src/client/index.ts), [composer declaration:350](../../packages/client/ui-conversation/src/client/apply.ts) | Preserve the native Conversation composer chain and approval plugin; customize UX only through supported extensions. |
| Terminal | [TerminalSessionService:86](../../packages/terminal/terminal/src/index.ts), [TerminalController:108](../../packages/api/terminal-controller/src/index.ts) | [Terminal tab:73 and content:95](../../packages/client/ui-sidebar-terminal/src/client/index.ts) | Retain the native Session right-sidebar tab tree and its access path. |
| Workspace | [WorkspaceRegistry:186](../../packages/workspace/workspace/src/index.ts), [WorkspaceController:55](../../packages/api/workspace-controller/src/index.ts) | [Workspace client service:118](../../packages/api/workspace-controller/src/client/service.ts), [sidebar registration:364](../../packages/client/ui-workspace/src/client/index.ts) | Retain the native sidebar and its workspace child slot. |
| Files | [Filesystem service:104](../../packages/fs/fs/src/index.ts), [WorkspaceFiles API:189](../../packages/api/workspace-files/src/index.ts) | [Files client:64 and right-sidebar tab:174](../../packages/client/ui-sidebar-files/src/client/index.ts) | Retain the native Session right-sidebar tab tree and its Session context. |
| Plugin Manager | [PluginManager:323](../../packages/boot/plugin-manager/src/index.ts), [plugin inventory:51](../../packages/host/plugin-inventory/src/index.ts) | [Plugin Manager client:86, main page:129 and sidebar entry:167](../../packages/client/ui-plugin-manager/src/client/index.ts) | Reuse the native service and preserve the Plugins main key and navigation entry. |

-----

<a id="approval-and-activity-limits"></a>
## Approval and activity limits

Native Approval includes a graphical interface: the client registers a composer contribution and listens for `approval/request`. The Host request requires an open turn and records the asked and decided events ([request implementation:242](../../packages/interaction/user-approval/src/index.ts)); retaining only the service does not retain the graphical flow.

Session activity is not a complete Agent Activity dashboard. The Host emits `api-session/activity` from user-message activity and separately forwards Agent status and errors ([SessionController:237](../../packages/api/session-controller/src/index.ts)); the client subscribes to the activity event ([client listener:121](../../packages/api/session-controller/src/client/index.ts)).

-----

<a id="workbench-verification"></a>
## Workbench verification

The native right sidebar renders Session-scoped content only while the Conversation is selected ([RightbarRoot:34](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)); its Terminal and Files tabs are Session-scoped ([right-sidebar registrations:232](../../packages/client/ui-sidebar-right/src/client/index.ts)). An independently selected Home panel therefore cannot display this native sidebar unchanged.

Workbench must verify access to each retained UI and the Approval flow in its own running profile. No P1 preservation result is claimed here.

-----

<a id="dev-note"></a>
## Dev Note

None.
