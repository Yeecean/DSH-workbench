# P1 interaction design

English | [中文](INTERACTION_SPEC.zh.md)

## Summary

The proposed interface keeps navigation, Session tools, and appearance choices discoverable while preserving native behavior. Visual prototypes simulate interactions; they do not establish service or persistence behavior.

## Navigation and rightbar

This is a proposed single-track state model, not an existing API or tested implementation. Distinguish the Session's logical expanded state and tabs, the current visual track owner (`Context`, `Session`, or `None`), and geometric eligibility. A hidden Session seat is not a user-close action; the native seat can currently collapse on `canShow=false` and report a closing presentation during cleanup ([SidebarRight.tsx:397–449](../../../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx)). See the [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md).

| Event and prior state | Proposed visible owner and transition | Retained state and focus |
|---|---|---|
| Enter Home, with or without an active Session | Context is the default when registered, enabled, and geometrically eligible; otherwise the track is `None` with an accessible reopen or unavailable state. | Keep any Session selection and its rail state; show global Context and use a clear empty state for missing Session data. |
| Enter Conversation | Present the native Session rail by native default when it has a valid Session, open intent, and geometry; otherwise show `None` until an eligible explicit choice. | Keep the current Session; never create or change one as a side effect of selecting a rail. |
| Select Context in Conversation | Context takes the same track; Session is paused, not closed. | Retain Session tabs, panes, scroll position, logical expanded state, preferred width, and recoverable focus target. |
| Select Session from Context | Restore the eligible native Session rail in the same track; if unavailable, explain the state and keep a reachable action. | Restore retained tab, pane, scroll position, and width; restore the prior focus target if it still exists, otherwise focus the named rail switcher. |
| Conversation to Home | Context becomes the default eligible owner; suspend native Session fullscreen presentation on Home. | Preserve Session logical and explicit fullscreen intent; do not leave the native rail over Home. |
| Close the visible rail | Set the visible owner to `None` and release the track and handle. | Closing the current owner does not clear the other owner's logical state; focus returns to the invoking control or a visible named fallback. |
| Reopen the rail | Restore the current page's default eligible owner or the user's explicit selection; distinguish a missing plugin from a closed rail. | Apply that owner's retained preference only when geometry permits; do not fabricate persisted state. |
| Native Session fullscreen | In Conversation, follow native fullscreen priority; entering Home suspends its presentation. Returning to Conversation restores a still-valid explicit mode or recalculates automatic fullscreen from current geometry. | Keep logical state and focus intent separate from presentation; avoid silently treating temporary ineligibility as collapse. |
| Resize, drag, or narrow drawer | Recompute the sole eligible owner through the native layout semantics; use the reviewed narrow presentation or a reachable reopen action if the track cannot fit. | Keep each owner's preferred width; cancel or complete pointer capture safely and never expose two interactive rails. |
| Context unload, missing provider, or registration replacement | Dispose Context registrations, listeners, pending callbacks, and its track claim; show native Session only when eligible, otherwise `None`. | A stale cleanup may release only its own generation; retain Session state and move focus to an available named control. |
| Renderer reload | Rebuild contributions and re-evaluate the current page and available owners. | Restore only data covered by a verified persistence contract; otherwise show an honest default or empty state. |

Place a clearly named Context/Session switcher in the visible rightbar header or another consistently reachable control; the precise control is a design decision. Expose the active choice to assistive technology, keep keyboard focus and any shortcut discoverable, and provide a reachable narrow-window equivalent. Switching changes presentation only: it must not create, close, or select a Session.

Transitions are short, interruptible, and respect reduced-motion preferences. Resolve ownership before animating; never let both rails receive pointer input, keyboard focus, or accessibility traversal, and cancel pending drag or animation work on unload. Focus after close, switch, or removal must land on a visible named control if the previous target no longer exists.

## Appearance and import

Place Appearance Settings in the existing settings route. Offer mode, accent, UI and monospace fonts, size, theme import, and reset as planned controls; current support and scope are described in the [theme system](THEME_SYSTEM_SPEC.md). Preview changes before applying, allow cancellation, and preserve the active theme on validation failure; the [import spec](THEME_IMPORT_SPEC.md) owns the proposed data restrictions.

## States and accessibility

Show focus, selection, errors, loading, empty state, and disabled state without relying on color or blur alone. Dialogs and menus must remain keyboard operable, dismissible, and inside the viewport. Honor reduced motion and transparency where exposed; provide an opaque fallback whenever translucency is unavailable or unsuitable.

## Dev Note

All Workbench-specific controls and import steps are proposed, not shipped.
