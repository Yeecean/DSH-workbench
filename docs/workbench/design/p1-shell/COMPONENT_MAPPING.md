# P1 component mapping

English | [中文](COMPONENT_MAPPING.zh.md)

## Summary

This mapping identifies existing native UI owners and the proposed Workbench contributions. A native source entry establishes code ownership, not successful integration in the future prototype.

## Table of Contents

- [Existing owners and proposed use](#existing-owners)
- [Reuse rules](#reuse-rules)
- [Dev Note](#dev-note)

-----

<a id="existing-owners"></a>
## Existing owners and proposed use

| Surface | Native source | Proposed Workbench use |
|---|---|---|
| Frame and navigation | [AppFrame slot declarations:192–201](../../../../packages/client/ui-layout/src/client/index.ts), [Sidebar seats:89–116](../../../../packages/client/ui-sidebar/src/client/index.ts) | Retain the frame and sidebar; contribute branding and navigation through supported inner seats. |
| Home | [Main panel selection:45–50](../../../../packages/client/ui-layout/src/client/AppFrame.tsx), [Plugins example:129–173](../../../../packages/client/ui-plugin-manager/src/client/index.ts) | Add a keyed main occupant and navigation entry after approval; Home is not implemented. |
| Session and approval | [Conversation main:586](../../../../packages/client/ui-conversation/src/client/apply.ts), [approval composer:97–107](../../../../packages/client/ui-approval/src/client/index.ts) | Retain the existing Conversation composer and approval UI; verify real behavior in the prototype. |
| Terminal and Files | [Terminal contribution:73–95](../../../../packages/client/ui-sidebar-terminal/src/client/index.ts), [Files contribution:174](../../../../packages/client/ui-sidebar-files/src/client/index.ts) | Keep their native Session rightbar entries and services rather than create parallel product implementations. |
| Global Context | [Session rightbar visibility:34–37](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx) | Proposed new global slot and layout arbitration are unimplemented and await approval in the [ADR](../../GLOBAL_RIGHTBAR_ADR.md). |
| Appearance | [Native appearance and font rows:630–653](../../../../packages/client/ui-theme/src/client/index.ts) | Reuse existing controls where appropriate; the Workbench-specific Appearance design and added color controls are not implemented. |
| Theme file import | [Native theme registration:344–396](../../../../packages/client/ui-theme/src/client/index.ts) | The data-only import, preview, validation, and recovery flow is proposed and is not an existing file-import API. |
| Menus and dialogs | [Shared primitives catalog:45–71](../../../../packages/client/ui-primitives/README.md), [workspace overlay registrations:395–403](../../../../packages/client/ui-workspace/src/client/index.ts) | Reuse shared primitives and native overlay registrations where compatible; do not use an overlay as the rightbar column. |

-----

<a id="reuse-rules"></a>
## Reuse rules

Feature plugins do not runtime-import or re-export other feature plugins; behavior crosses injected services and UI crosses authorized slots ([client rules:40](../../../../packages/client/AGENTS.md)). Shared controls live in an appropriate static owner such as `ui-primitives`, and contributions use the declaration-aware Slot lifecycle ([client rules:152](../../../../packages/client/AGENTS.md)).

Replacing `root` or the whole Session `rightbar` would discard native child-slot ownership and is outside P1. Material, typography, or color changes must not imply that a feature component can be imported across this boundary; evaluate the actual public control or Slot before proposing reuse.

-----

<a id="dev-note"></a>
## Dev Note

No Workbench product UI, global rightbar extension, or file-import flow is claimed as implemented or tested by this mapping.
