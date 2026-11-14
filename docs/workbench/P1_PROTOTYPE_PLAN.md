# P1 minimal prototype plan

English | [中文](P1_PROTOTYPE_PLAN.zh.md)

## Summary

This proposed plan defines the smallest Windows Native Desktop prototype that can exercise a Workbench Home and global Agent Context alongside native Conversation, Terminal, and Files. It is a design for review; none of its implementation or acceptance checks has been executed.

## Table of Contents

- [Approval and prerequisites](#approval-and-prerequisites)
- [Source constraints](#source-constraints)
- [Visual design review](#visual-design-review)
- [Implementation sequence](#implementation-sequence)
- [Windows acceptance matrix](#windows-acceptance-matrix)
- [Failure and recovery](#failure-and-recovery)
- [Dev Note](#dev-note)

-----

<a id="approval-and-prerequisites"></a>
## Approval and prerequisites

The prototype requires a decision on the proposed layout extension and Desktop profile isolation before implementation. A Workbench plugin alone cannot add a layout-managed global right column through the currently declared slots; the existing Session rightbar hides on global panels. Preserving its independent state may also require a minimal `ui-sidebar-right` adaptation; review must approve any native UI-layout and rightbar changes. No Runtime, Session store, Terminal, Files, or transport implementation is changed.

The plan retains the existing `root` and `rightbar` occupants and does not use `shell.overlay` as a column. It adds no WSL bridge, second Agent Runtime, Session store, or RPC. The [rightbar ADR](GLOBAL_RIGHTBAR_ADR.md) owns the proposed arbitration and [Desktop profile feasibility report](DESKTOP_PROFILE_FEASIBILITY.md) owns the unresolved Desktop boot and isolation choices.

-----

<a id="source-constraints"></a>
## Source constraints

- The frame selects the `main` key from the active panel or `conversation` at [AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx); the native Session rightbar hides its content when a global panel is active at [RightbarRoot.tsx:34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx).
- The frame measures its viewport and chooses responsive geometry at [AppFrame.tsx:140–195](../../packages/client/ui-layout/src/client/AppFrame.tsx); width solving and preferences are owned by [columns.ts:45](../../packages/client/ui-layout/src/client/columns.ts) and [stores.ts:13–47](../../packages/client/ui-layout/src/client/stores.ts).
- The native seat collapses an expanded non-fullscreen Session rightbar when `canShow` is false, and its active-seat cleanup reports a closed presentation at [SidebarRight.tsx:385–449](../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx). Its narrow viewport fullscreen behavior is derived at lines 397–405; arbitration must not accidentally treat a hidden retained seat as a user collapse or let stale cleanup close the global presentation.
- Terminal and Files contribute Session rightbar tabs at [ui-sidebar-terminal index.ts:95](../../packages/client/ui-sidebar-terminal/src/client/index.ts) and [ui-sidebar-files index.ts:174](../../packages/client/ui-sidebar-files/src/client/index.ts). Their presence in source is not a successful prototype test.
- Desktop resolves `profiles/desktop` at [paths.ts:17–20](../../apps/desktop/src/paths.ts) and its Host supplies the name `desktop` at [desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts). A separately named Desktop profile cannot be assumed selectable from those facts.

-----

<a id="visual-design-review"></a>
## Visual design review

Before production UI implementation, compare the native-continuity and light-product-identity directions in editable Open Design work. Show the same Home with global Context, Conversation with native Session rail, Conversation with global Context, and narrow-window states for both directions; keep native Session, Terminal, and Files recognizable. See [visual direction](design/p1-shell/VISUAL_DIRECTION.md).

Include a glass and opaque comparison, light and dark appearance, and measurable text, icon, border, and focus contrast on representative backgrounds. Show Appearance Settings entry points for theme, accent, surface color, UI and monospace fonts, font size, import, and reset; include theme import, preview, cancellation, error, and recovery states as design flows. A visual prototype does not implement the file import or imply an existing settings API.

Use semantic tokens with explicit fallback and preserve dense technical surfaces. Inspect Windows high DPI, resizing, reduced motion and transparency where available, and GPU/compositor cost. The user selects the final visual direction after review; layout and Desktop Profile decisions remain separate approval prerequisites.

-----

<a id="implementation-sequence"></a>
## Implementation sequence

Each item is future work gated by the decisions above. The implementer records exact inputs, results, errors, and source commit rather than treating this plan as a completed test report.

1. Establish a disposable Windows test environment with separate Harness and `DSH_AGENTS_HOME` directories, a separate Electron user-data location where supported, and an isolated test workspace. Inspect the development launcher's fixed project directory before its destructive preparation; verify shared data roots and credentials before using any real data.
2. Design the smallest approved native UI-layout extension that declares and renders a separate global right slot, participates in the existing width solver and control lifecycle, and leaves the existing Session `rightbar` registration and child seats intact. Assess whether preserving native seat state also requires a minimal `ui-sidebar-right` adaptation; obtain approval for its precise scope. Review the explicit arbitration, responsive, resize, and unload rules in the ADR before changing UI code.
3. Add a separate Workbench bundle, profile composition, and client entry using the supported Cordis registration lifecycle. Resolve the actual Desktop loading route with the profile feasibility work; if Desktop cannot load the proposed composition without changing its launcher, stop and report that limitation for a separate decision.
4. Add a keyed Home main panel and its navigation entry, plus a static Agent Context occupant of the approved global slot. Keep Conversation and its existing Workspace, Files, and Terminal registrations available; the prototype does not implement live agent activity or a new Session management system.
5. Add only the focused lifecycle, layout, and integration checks needed for the extension and product entry. Build and launch the real Windows Native Desktop with the isolated composition, record the exact profile and loaded plugin identities, and capture screenshots of Home and Conversation at representative widths.
6. Run the acceptance matrix below, record pass, fail, or blocked for every row, and fix defects within the approved scope. If a fix needs Runtime, Session, Terminal, Files, or Desktop launcher changes, pause and request a separate decision.

-----

<a id="windows-acceptance-matrix"></a>
## Windows acceptance matrix

These are planned checks, not observed results. Execute them on Windows Native Desktop with both an isolated Workbench composition and a separate native baseline; capture the relevant screen, logs, and source commit for each result.

| Check | Procedure | Acceptance evidence |
|---|---|---|
| Startup and isolation | Launch each composition from its isolated test home; inspect the resolved profile, bundle, client entry, runtime paths, and any shared user-data locations. | Workbench Home and Context appear in the intended composition; the native baseline loads its original interface, and shared locations are identified before real data is used. |
| Home and navigation | Select Home, Conversation, and Home again with the actual sidebar controls. | Each selection reaches its intended main panel; Home has the global Context column and Conversation keeps its native content. |
| Session tools | Open an existing disposable Session, a Terminal, and Files in Conversation; perform a harmless shell command and open a test file. | Native Terminal and Files remain usable and return to the same Session after visiting Home; no replacement service is introduced. |
| Arbitration and retention | Open native rightbar tabs, switch between Home and Conversation, then close and reopen the global Context. | Only the approved right-side presentation occupies the track at each state; native tab state and the global preference follow the ADR without overlapping columns or hidden focus targets. |
| Hidden Session seat and resize | Open Terminal and Files in an expanded Session rightbar, select Home and its Context, resize the window, then return to Conversation. Exercise `canShow` becoming false and old-seat cleanup during the switch. | The native logical expanded state, tab identities, focus behavior, and saved width survive unless the user explicitly changed them; the old seat cannot close or resize the active global presentation. |
| Fullscreen and narrow viewport | Open a native Conversation rightbar in manual fullscreen, navigate to Home and show Context, then return; repeat across the narrow-width automatic-fullscreen threshold. | Home Context remains available, returning restores a valid native state consistent with the approved rules, and automatic fullscreen does not silently overwrite the manual mode or expanded preference. |
| Resize and collapse | Drag the right divider; resize the window across wide, minimum supported, and narrow widths; collapse and reopen the applicable panel. | Widths stay within the approved solver limits, controls remain reachable, and responsive concession does not corrupt the saved user preference. |
| Renderer reload | With a disposable Session and a terminal tab open, reload the renderer and navigate through both pages. | The app reconnects through native Host behavior, registers one copy of each contribution, and restores only state the approved design promises; no Session identity changes. |
| Unload and reload | Unload the Workbench client entry through the supported plugin lifecycle, then reload it while Home is selected and while Conversation is selected. | Workbench slot entries, listeners, and owned state are disposed once; no empty reserved track or stale controls remain, and native Conversation, Terminal, and Files still work. |
| Native fallback | Exit Workbench and launch the isolated native baseline without the Workbench bundle. | The original Desktop interface and native Session tools work without Workbench registrations or configuration changes. |

-----

<a id="failure-and-recovery"></a>
## Failure and recovery

Exercise a missing or failed Workbench client entry, a missing global-slot provider, a rejected duplicate registration, and a Host startup failure in the isolated environment. Each must produce an observable error or documented fallback; it must not leave stale listeners, a phantom right track, silently shadow native UI, or mutate the native test profile. Repeat a load/unload cycle and retry startup after removing the fault.

The prototype is accepted only after the Windows matrix and focused checks pass on the same source commit. A missing native tool, unsupported Desktop profile path, incomplete disposal, or unverified responsive state remains an explicit blocker rather than a passed result.

-----

<a id="dev-note"></a>
## Dev Note

This is a proposed implementation and verification plan. No prototype code, Windows Desktop launch, or acceptance test was performed for this plan.
