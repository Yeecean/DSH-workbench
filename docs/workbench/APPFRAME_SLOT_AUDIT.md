# AppFrame and Slot audit

English | [中文](APPFRAME_SLOT_AUDIT.zh.md)

## Summary

This source audit identifies the native layout extension points and their limits for the proposed Workbench Shell. It does not establish runtime preservation: the Workbench plugin, profile, and unload behavior have not been exercised.

## Table of Contents

- [Frame and root](#frame-and-root)
- [Slot inventory](#slot-inventory)
- [Registration, ordering, and cleanup](#registration-ordering-and-cleanup)
- [Native dependencies](#native-dependencies)
- [Workbench limitations](#workbench-limitations)
- [Dev Note](#dev-note)

-----

<a id="frame-and-root"></a>
## Frame and root

The client shell renders `root` at [app.tsx:21](../../packages/client/ui-renderer/src/client/app.tsx); the renderer declares it as a single slot at [registry.ts:28](../../packages/client/ui-renderer/src/client/registry.ts). The layout plugin registers AppFrame as its occupant and declares its six child slots at [ui-layout index.ts:192–205](../../packages/client/ui-layout/src/client/index.ts).

AppFrame owns the responsive three-column arrangement, drawer, resize handles, bottom row, overlay layer, and leading seat at [AppFrame.tsx:273–285, 288–340](../../packages/client/ui-layout/src/client/AppFrame.tsx). Preserving it retains this layout and its declared child slots; replacing `root` removes the native AppFrame subtree and requires the replacement to recreate the needed declarations and behaviors, as warned at [registry.ts:28–44](../../packages/client/ui-renderer/src/client/registry.ts).

-----

<a id="slot-inventory"></a>
## Slot inventory

The layout plugin defines these slots at [ui-layout index.ts:59–121, 192–201](../../packages/client/ui-layout/src/client/index.ts); AppFrame renders them at [AppFrame.tsx:45–50, 273–285, 314–335](../../packages/client/ui-layout/src/client/AppFrame.tsx). The registration, ordering, and disposal rules in the next section apply to every row.

| Slot | Kind and rendered purpose | Replacement, addition, and context |
|---|---|---|
| `root` | Single; the renderer mounts the whole client layout. | A higher-priority occupant shadows AppFrame, including its declarations; it is not additive. It uses root scope. |
| `sidebar` | Single; AppFrame renders the left column, including collapsed or drawer presentation. | An occupant can shadow the native Sidebar, not append beside it. Frame props supply width, collapsed state, and drawer mode; native Sidebar declares inner seats for brand, navigation, workspace, and settings. |
| `main` | Keyed; AppFrame renders the active panel key, defaulting to `conversation`. | A new key adds a selectable panel; a higher-priority occupant shadows the same key. The native Conversation and other keyed pages remain separate registrations. |
| `rightbar` | Single; AppFrame renders the right column with viewport and width props. | An occupant can shadow the native right Sidebar, not append beside it. The native occupant declares Session-scoped children, including the pane seats used by Files and Terminal. |
| `shell.bottom` | Single; a full-width row below the columns. | An occupant can shadow another; it remains mounted across main-panel navigation and receives no Session binding. |
| `shell.overlay` | List; a frame-wide floating layer outside column scroll containers. | Distinct IDs append; a higher-priority registration can shadow the same ID. The layer is click-through and entries opt into pointer interaction. |
| `shell.leading` | Single; window-chrome controls appear for drawer mode or a hidden macOS sidebar. | An occupant can shadow the native controls, not append beside them; AppFrame mounts the seat only under those conditions. |

The native Sidebar declares its own child seats at [ui-sidebar index.ts:88–116](../../packages/client/ui-sidebar/src/client/index.ts), describes them at [slots.ts:29–75](../../packages/client/ui-sidebar/src/client/contract/slots.ts), and renders them at [SidebarRoot.tsx:348, 410–451, 461–467](../../packages/client/ui-sidebar/src/client/SidebarRoot.tsx). A plugin can contribute a panel and its navigation entry without replacing that occupant; the native Plugins page is an example at [ui-plugin-manager index.ts:129–173](../../packages/client/ui-plugin-manager/src/client/index.ts).

-----

<a id="registration-ordering-and-cleanup"></a>
## Registration, ordering, and cleanup

Client plugins register through `ctx.slots.inject(name, () => ctx.slots.register(...))`; injection waits for the declaration and binds the contribution to both its declaration lifetime and the caller's Cordis fiber. Declaration collapse or plugin unload disposes the active registration; a later declaration can install it again. Iterable contributions install transactionally and dispose in reverse order. See [registry.ts:194–209, 229–270, 741–746](../../packages/client/ui-renderer/src/client/registry.ts).

For `single`, the slot is one cell; for `keyed`, each key is a cell; for `list`, each ID is a cell. A registration with a lower numeric `priority` wins its cell, while a duplicate cell at the same priority throws. Distinct list IDs are additive and render in ascending `order`; ties retain stable ledger order. See [ui-slots index.ts:1266–1304, 1351–1358, 1415–1427](../../packages/client/ui-slots/src/index.ts) and [scoped-slots.tsx:1483–1498](../../packages/client/ui-renderer/src/client/scoped-slots.tsx).

Only the declaring occupant has authority to render its child slots, as enforced at [scoped-slots.tsx:70–85](../../packages/client/ui-renderer/src/client/scoped-slots.tsx). Shadowing a parent therefore does not automatically carry its original child registrations into the replacement.

-----

<a id="native-dependencies"></a>
## Native dependencies

The layout plugin directly injects slots, theme, locale, and shortcuts at [ui-layout index.ts:153–154](../../packages/client/ui-layout/src/client/index.ts); it provides layout state and registers the sidebar shortcut and theme presenter at lines 188–243. Main navigation selects a panel through layout state rather than a general URL router: [AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx) chooses the key, and [ui-sidebar index.ts:83](../../packages/client/ui-sidebar/src/client/index.ts) calls `selectPanel`.

The original Conversation, Session, Approval, Workspace, Files, and Terminal interfaces require their own client registrations and declared descendant slots; preserving AppFrame alone does not establish that they work. The existing Approval UI registers into the Conversation composer and listens for remote requests at [ui-approval index.ts:97–107](../../packages/client/ui-approval/src/client/index.ts); Files and Terminal register with the native right Sidebar at [ui-sidebar-files index.ts:174](../../packages/client/ui-sidebar-files/src/client/index.ts) and [ui-sidebar-terminal index.ts:73–95](../../packages/client/ui-sidebar-terminal/src/client/index.ts).

Feature plugins contribute dialogs and transient feedback through their own UI and overlay registrations, such as [ui-workspace index.ts:395](../../packages/client/ui-workspace/src/client/index.ts). The observed command UI at [ui-commands index.ts:51](../../packages/client/ui-commands/src/client/index.ts) handles Conversation slash commands; this audit did not establish a general Command Palette. Theme, locale, dialog, toast, shortcut, and native-capability behavior remain unverified in a Workbench profile.

-----

<a id="workbench-limitations"></a>
## Workbench limitations

The native right Sidebar shows Session content only while `activePanelId` is `null`; it hides those views for a global main panel at [RightbarRoot.tsx:17–25, 34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx). Its on-screen Session selection and pane declarations are Session-specific at [ui-sidebar-right index.ts:164–175, 232–247](../../packages/client/ui-sidebar-right/src/client/index.ts).

An independent Home registered under a non-Conversation main key therefore cannot show an always-visible Agent Context through the existing native right Sidebar child slots. Shadowing the whole `rightbar` also hides the original occupant and its Files and Terminal seats. `shell.overlay` is a floating layer, not a layout-managed right column; using it as one would require separate sizing, obstruction, and native-sidebar coordination that this audit has not validated.

The missing capability for the requested three-column Home is a layout-managed global right-side extension that can coexist with, or safely compose around, the native Session right Sidebar. The source evidence above establishes the native occupant's restriction; it does not rule out every possible alternative design. Shell implementation is paused at this limitation as requested.

Desktop profile selection is a separate open question: [paths.ts:17–20](../../apps/desktop/src/paths.ts) selects `profiles/desktop`, and [desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts) loads `projectDir` and starts with profile name `desktop`. This audit has not verified a supported way to select a separately named Workbench profile in Desktop; these observations do not establish that no such integration is possible.

-----

<a id="dev-note"></a>
## Dev Note

The findings are based on source inspection. No Workbench UI, plugin unloading, or native-capability preservation test was executed for this audit.
