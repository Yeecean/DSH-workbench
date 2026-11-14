# P1 responsive layout design

English | [中文](RESPONSIVE_SPEC.zh.md)

## Summary

The design follows the native frame's concession order while the proposed Context slot remains subject to the [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md). Values below describe existing source, not verified prototype behavior.

## Native geometry

The current column solver protects a 400 px center while a normal right track is present, requires at least 300 px for that track, and removes it when available width is insufficient ([columns.ts:10–31, 44–63](../../../../packages/client/ui-layout/src/client/columns.ts)). The sidebar uses a drawer below 768 px and automatically collapses below 1024 px, subject to user interaction ([columns.ts:20–25](../../../../packages/client/ui-layout/src/client/columns.ts), [stores.ts:107–124](../../../../packages/client/ui-layout/src/client/stores.ts)). These are frame measurements and source rules; an outer-window width or mockup label alone does not prove the actual layout.

## Proposed behavior by measured frame width

The sizes below are design and acceptance checkpoints. A visible normal right track also depends on sidebar state, user preferences, selected owner, fullscreen mode, and the real solver result; do not hardcode a second independent set of column widths.

| Frame width | Sidebar intent | Main and rightbar intent |
|---|---|---|
| 1440 px | Expanded navigation where the user's preference permits. | Show a readable main area and the sole selected Context or native Session track when the solver permits, with one resize handle. |
| 1280 px | Preserve expanded or user-collapsed navigation and its preference. | Retain the main area and one selected rail if eligible; exercise both owner widths and constrained text. |
| 1024 px | Check both sides of the automatic-collapse boundary; the source's automatic condition is below, not equal to, 1024 px. | Ask the solver whether the selected track fits after the actual sidebar width; a large expanded sidebar can change the result. |
| 768 px | Still above the source drawer transition because the drawer condition is below 768 px; sidebar may be in its collapsed rail state. | Preserve usable main content and use one normal track only if the actual solve allows it; test the boundary on both sides. |
| 767 px and narrower | Use the source drawer behavior; its reopening control remains reachable. | Preserve the main task and provide an accessible Context/Session choice or reopen path. Native Session derives automatic fullscreen below 768 px; the proposed Context narrow presentation remains unverified. |

When the normal track cannot fit, preserve Session and Context logical open intent and their preferred widths; a layout concession must not be treated as user close. A selected Context must not receive space by forcing the Session seat's `canShow` to false, because that can alter its expanded state ([SidebarRight.tsx:397–413](../../../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx)). The exact narrow presentation needs approval and Windows measurement.

## Required review

Measure actual frame and column widths on Windows Native Desktop at each checkpoint and just either side of the thresholds. Test drag cancellation and resize, UI and terminal font changes, system scaling, Windows titlebar clearance, focus transfer, long translated labels, drawer open and close, and native fullscreen and Context transitions. Avoid clipping controls; retain readable main content and compact Terminal and Files density.

Check only one rail has pointer access, keyboard focus, and accessibility traversal, including during animation. Renderer reload and restoration need separate verification; this design does not promise persistence or claim the prototype has passed these checks.

## Dev Note

The visual prototypes illustrate responsive intent; actual AppFrame geometry and accessibility remain to be tested on Windows Desktop.
