# ADR: Global Agent Context rightbar

English | [中文](GLOBAL_RIGHTBAR_ADR.zh.md)

## Summary

**Status: proposed; user approval and a Windows Desktop prototype are pending.** This decision record recommends a root-scoped global rightbar contribution managed by AppFrame, with one shared right track arbitrated against the native Session rightbar. The proposal requires a client layout extension; existing slots alone do not implement it.

## Table of Contents

- [Problem and constraints](#problem-and-constraints)
- [Existing behavior](#existing-behavior)
- [Options and recommendation](#options-and-recommendation)
- [Proposed Slot API](#proposed-slot-api)
- [Arbitration and lifecycle](#arbitration-and-lifecycle)
- [Geometry and accessibility](#geometry-and-accessibility)
- [Profile isolation](#profile-isolation)
- [Validation and open decisions](#validation-and-open-decisions)
- [Dev Note](#dev-note)

-----

<a id="problem-and-constraints"></a>
## Problem and constraints

Workbench needs an Agent Context panel on Home and other global pages while keeping the native Conversation, Session rightbar, Terminal, and Files available. The solution retains AppFrame and its original `root` and `rightbar` occupants; it does not use `shell.overlay` as a right column or introduce another Runtime, Session store, or RPC system.

The scope here is an architecture proposal and prototype plan. No proposed Slot, arbitration API, profile, plugin, or runtime result in this record has been implemented or validated.

-----

<a id="existing-behavior"></a>
## Existing behavior

AppFrame declares root-scoped `sidebar`, keyed `main`, `rightbar`, `shell.bottom`, `shell.overlay`, and `shell.leading` in [ui-layout index.ts:192–201](../../packages/client/ui-layout/src/client/index.ts). Its main selector uses the selected global panel key or `conversation` in [AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx), while [layout service.ts:27–36](../../packages/client/ui-layout/src/client/service.ts) selects a global panel without changing the current Session.

The native rightbar keeps Session views mounted but marks them hidden when a global panel is selected in [RightbarRoot.tsx:17–25, 29–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx). Its `rightbar.session` and pane tabs are Session-scoped in [ui-sidebar-right index.ts:232–247](../../packages/client/ui-sidebar-right/src/client/index.ts); Terminal and Files contribute to those existing seats as recorded in the [capability matrix](NATIVE_CAPABILITY_MATRIX.md).

`shell.bottom` occupies a full-width row, `shell.overlay` is a floating layer, and `shell.leading` serves limited window controls, as declared in [ui-layout index.ts:91–121](../../packages/client/ui-layout/src/client/index.ts). None declares a second layout-managed rightbar. AppFrame currently reserves one right track in [AppFrame.tsx:191–195, 288–296](../../packages/client/ui-layout/src/client/AppFrame.tsx); its stored `rightbarShown`, `rightbarTrack`, `rightbarFullscreen`, and width represent that track in [stores.ts:24–51](../../packages/client/ui-layout/src/client/stores.ts).

The native rightbar reports its presentation through `openRightbar` and `closeRightbar` in [ui-sidebar-right index.ts:221–223](../../packages/client/ui-sidebar-right/src/client/index.ts), not through a multi-owner arbiter. Its seat collapses an active expanded Session when a non-fullscreen panel receives `canShow=false`, and reports hidden on cleanup ([SidebarRight.tsx:397–413, 424–449](../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx)). Hiding DOM alone does not change the active flag, and passing `canShow=false` merely to yield the track can therefore collapse Session state. Root replacement would discard AppFrame's child declarations, as documented in [registry.ts:28–44](../../packages/client/ui-renderer/src/client/registry.ts).

-----

<a id="options-and-recommendation"></a>
## Options and recommendation

| Option | Benefits | Costs and limits |
|---|---|---|
| A: Context only in Conversation | Reuses the native Session surface and avoids a new layout Slot. | Home and other global pages lack Context; this changes the stated requirement. |
| B: Separate global Slot plus layout arbitration | Makes Context available across pages while retaining the native Session occupant and its tabs. | Requires a narrowly scoped AppFrame/client-layout extension, ownership rules, geometry work, and regression tests. |
| C: Context inside the native Session rightbar | Reuses native Session tabs and their lifetime. | The Session rightbar is hidden on global pages and depends on a Session; it cannot provide global Home Context by itself. |

**Recommend B for review**, using one physical right track and explicit selection between two retained occupants. This avoids two columns squeezing the center at once; it also means only one of Context and the Session rightbar is visible at a time. A side-by-side requirement would need a different geometry design and approval.

The extension changes the native **client layout owner** and may require a minimal adaptation in `ui-sidebar-right` to distinguish logical Session state from presentation eligibility; it does not replace native `root` or `rightbar` or change the Runtime. Plugin-only feasibility must not be claimed: the current layout owner does not declare, render, or arbitrate the proposed global Slot. Both client changes remain proposals pending approval.

-----

<a id="proposed-slot-api"></a>
## Proposed Slot API

The names and fields below are a design sketch, not existing exports or executable configuration. Final names and types require implementation review against the actual Slot contracts.

| Draft element | Proposed ownership and contract |
|---|---|
| `shell.rightbar.global` | A new `single`, root-scoped child declared and rendered by the AppFrame owner. A Workbench client plugin contributes one Context component; no Session binding is implied. |
| Owner-provided props | Effective width, viewport width, whether the slot is selected, and whether the available track can show it; props carry presentation facts, not mutable `ctx`. |
| Layout arbiter | The layout owner tracks contribution availability, selected surface, effective track, and reports isolated by source and registration generation. The Session occupant retains ownership of its logical expanded and mode state. |
| Global actions | A scoped action opens, closes, or selects Context and requests a preferred width; the layout owner validates ownership and computes the effective presentation. |
| Registration | The plugin waits on the declaration with `ctx.slots.inject` and registers via `ctx.slots.register`; the declaration and plugin fiber own cleanup, as in [registry.ts:194–209, 229–270](../../packages/client/ui-renderer/src/client/registry.ts). |

The single Slot has one winning contribution. The existing Slot registry selects the lowest numerical priority and rejects a duplicate cell at the same priority ([ui-slots index.ts:1266–1294](../../packages/client/ui-slots/src/index.ts)). P1 should use one known contribution and treat an unexpected conflicting registration as a visible configuration error rather than relying on unspecified load order.

-----

<a id="arbitration-and-lifecycle"></a>
## Arbitration and lifecycle

| Situation | Proposed result |
|---|---|
| Home or another global page | If Context is registered and enabled, show it in the right track; retain the hidden native Session subtree and its own state. If Context is closed or unavailable, release the track. |
| Conversation with a native rightbar request | The Session rightbar has initial priority; retain Context state and allow an explicit switch to Context. Suspension preserves the Session's logical expanded state, tabs, width preference, and focus target; switching back restores eligible presentation without recreating its Session. |
| Both surfaces request the track | Exactly one surface owns the visible track and drag handle. An explicit user selection wins until navigation or that selection becomes unavailable; never merge the two owners' presentation reports. |
| Native fullscreen and navigation | While Conversation is active, native fullscreen takes precedence. Navigation to Home or another global page is allowed: suspend native fullscreen presentation and show eligible Context. On return to Conversation, restore a still-valid explicit fullscreen mode or recompute automatic fullscreen from the current viewport; handle insufficient room without silently destroying logical Session state. |
| Plugin unload or declaration collapse | Remove Context registration and listeners, abort pending callbacks and drag, clear its selection and track claim, and reveal any eligible native Session surface. An old disposer must not clear a newer registration. |
| Renderer reload | Rebuild registrations and reconcile the active page with available occupants; do not assume in-memory width, selection, or Context content survives. Restore only data whose persistence is explicitly designed and tested. |

The native rightbar currently synchronizes its on-screen Session from both view and panel subscriptions, and unregisters both on disposal ([ui-sidebar-right index.ts:168–180](../../packages/client/ui-sidebar-right/src/client/index.ts)). Its active flag is derived from the selected page and Session, not the proposed arbiter selection ([RightbarRoot.tsx:17–24, 34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)). The prototype must represent logical expansion and presentation eligibility separately, provide a meaningful geometry-based `canShow` rather than falsifying it to suspend a surface, and define a suspension path that does not collapse or unmount a retained Session. This may require a minimal native rightbar adapter in addition to the layout extension.

The arbiter must isolate reports and cleanup by source and registration generation: a delayed transition callback, old unmount, or old disposer may release only its own live claim and must never clear a newer selection. Release every subscription, resize observer, queued callback, and pointer capture owned by the new code. The standard Slot disposer cascades through declared child registrations ([ui-slots index.ts:1190–1215](../../packages/client/ui-slots/src/index.ts)); additional presentation state still needs explicit cleanup.

When a selected global page unregisters, the existing store falls back to Conversation ([stores.ts:94–101](../../packages/client/ui-layout/src/client/stores.ts)). The proposed arbiter must recompute ownership from that new page and live registrations in the same state transition; otherwise a stale Context claim could leave an empty track or hide the Session controls.

-----

<a id="geometry-and-accessibility"></a>
## Geometry and accessibility

Existing `computeColumns` protects a 400 px center while a normal right track exists, clamps the right panel to a 300 px minimum and at most 70% of the viewport, and removes the right track when there is insufficient room ([columns.ts:10–31, 44–63](../../packages/client/ui-layout/src/client/columns.ts)). AppFrame measures with a `ResizeObserver` and cancels its queued animation frame on cleanup ([AppFrame.tsx:150–167](../../packages/client/ui-layout/src/client/AppFrame.tsx)).

The prototype should reuse the same column solver and drag semantics, keeping independent in-memory preferred widths for Context and Session. The currently selected surface alone drives the track width and resize handle; a drag captures the rendered width at gesture start ([AppFrame.tsx:202–205, 252–259](../../packages/client/ui-layout/src/client/AppFrame.tsx)). Narrow-window concession must not overwrite either preference; if the solver removes the right track, Context needs an accessible reopen control and a tested narrow presentation before the requirement can be considered met.

The hidden surface must be excluded from pointer interaction, tab order, and accessibility traversal while retaining the native Session content needed for restoration. Switching or unloading the focused surface must move focus to a visible, named control. Test Windows titlebar clearance, drawer transitions, fullscreen entry and exit, resize during drag, and the existing Terminal and Files interactions; the current drawer already marks sibling regions inert ([AppFrame.tsx:312–323](../../packages/client/ui-layout/src/client/AppFrame.tsx)).

-----

<a id="profile-isolation"></a>
## Profile isolation

The proposal uses a separate Workbench bundle and client entry, enabled only for a Workbench composition, while keeping the ordinary native Desktop composition as the rollback target. Desktop currently resolves `profiles/desktop` in [paths.ts:17–20](../../apps/desktop/src/paths.ts) and the Desktop Host supplies `desktop` to its runner in [desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts). A separate named Desktop profile and its isolation have not been demonstrated.

Prototype verification must first establish a supported isolated launch and separate configuration and data ownership, using a disposable test home rather than modifying the user's normal Desktop profile. Do not change the native Desktop launch flow until a separate design is approved; record any required carrier change as an open dependency.

-----

<a id="validation-and-open-decisions"></a>
## Validation and open decisions

Windows Native Desktop acceptance must exercise Home, Conversation, Context switching, Terminal and Files, native Session and Approval, window resizing and drag, narrow windows, renderer reload, plugin unload and re-registration, and rollback to the native composition. Open Terminal and Files, switch to Context, resize, then return: verify Session identity, tabs, logical expanded state, width preference, and an eligible focus target are preserved; also verify the explicit and automatic fullscreen navigation rules at viable and insufficient widths. Cover dual requests, delayed callbacks, cancellation during unload, focus, and repeated mount/unmount; check that no stale track or handler remains. These are required future prototype checks, not results from this design review.

Approval is requested for B's narrowly scoped client-layout extension and any necessary minimal `ui-sidebar-right` adaptation, one-track arbitration, page-aware fullscreen suspension, per-surface transient widths, and Home default. Also decide whether Context must remain visible at the same time as Session tools: if so, this one-track proposal is insufficient. Desktop profile isolation, native UI compatibility, actual teardown, and Windows behavior remain unverified until the prototype is run.

-----

<a id="dev-note"></a>
## Dev Note

Source evidence reflects the pinned baseline. Proposed APIs and behavior are not commitments to an implemented interface.
