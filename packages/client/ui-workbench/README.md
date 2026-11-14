---
description: "Workbench Liquid Glass presentation layer for dsh Desktop: top Work × Code mode switcher, Code layout presets, Global Task Inspector, offline fonts, and validated Custom Theme JSON settings."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-workbench

English | [中文](README.zh.md)

## Summary

Use this package to overlay the dsh Workbench user experience on top of the native dsh conversation shell. It mounts a **Work × Code** mode switcher in the conversation header without altering session identity or clearing input drafts, drives four Code presets (`Focus`, `Build`, `Review`, `Debug`) through `ui-sidebar-right`, hosts a global Work Task Inspector in the arbitrated `'shell.rightbar.global'` right rail, activates offline **ChillRoundM** and **JetBrains Mono** defaults while preserving custom font settings, and adds a durable **Workbench & Liquid Glass** configuration group in General Settings with strict JSON theme validation.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

This package pairs a thin Host configuration plugin (`src/index.ts`) with a browser client plugin (`src/client/index.ts`). In Desktop distributions it is mounted by `@deepseek-ai/dsh-workbench` (`packages/bundle/workbench`) so `web` and CLI profiles remain isolated unless opted in.

### Minimal configuration

```yaml
- insert:
    - id: ui-workbench
      name: "@deepseek-ai/dsh-client-ui-workbench"
```

All Host options (`defaultMode`, `accentPreset`, `reducedTransparency`, `reducedMotion`, and `customThemeJson`) are volatile `ui-workbench` user-settings fields stored in durable user preferences and described in the [configuration catalog](../../../docs/config-catalog.md). No separate fallback form page is generated (`settings.configure({ auto: false }, ctx.fiber)`).

### Top mode switcher and Code presets

`ModeSwitcher` occupies `'conversation.header.leading'`, keeping `--dsh-frame-leading-clearance` clear of macOS window controls and respecting Windows titlebar drag regions (`-webkit-app-region: no-drag`). Switching between **Work** and **Code** changes visual density and reveals **Focus / Build / Review / Debug** layout presets without creating or resetting sessions. `Focus` closes active right-rail panels, `Review` opens Workspace Files, and `Build` or `Debug` opens Terminal in the single shared right rail.

### Global Work Task Inspector

`WorkTaskInspector` occupies `'shell.rightbar.global'` and opens/closes through `ctx.layout.openGlobalRightbar` / `closeGlobalRightbar` so it never creates a second physical right column beside `Files`, `Terminal`, or `Browser`. Opening any native rightbar tool yields the right column automatically; clicking **Inspector** switches back.

### Workbench Appearance and Custom Theme JSON

In **Settings -> General**, `WorkbenchAppearanceRow` exposes Default Startup Mode, Accent Material (`Blue`, `Graphite`, `Amber`, `Custom`), Reduce Transparency, Reduce Motion, and a validated Custom Theme JSON editor (`32 KB` payload cap, plain-object check, allowlisted color/length token keys, CSS injection rejection, and `CSS.supports` color checking when available). Validated settings persist through `configForms` (falling back to `localStorage` in standalone sessions) and apply live token layers via `ctx.theme.overrideTokens`.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

### Typography and Liquid Glass layering

`src/client/styles/workbench-glass.css` sets `data-dsh-workbench="1"` on `document.documentElement` and overrides `--dsh-font-family-text-default` (`ChillRoundM`, `寒蝉半圆体`) and `--dsh-font-family-code-default` (`JetBrains Mono`) so bundled offline fonts lead by default while user custom font variables (`--dsh-font-family-text`, `--dsh-font-family-code`) in `ui-theme` continue to win whenever set. Accent palettes and validated Custom Theme tokens are applied via `ctx.theme.overrideTokens('@deepseek-ai/dsh-client-ui-workbench', ...)` with balanced `{ light, dark }` pairs.

### Client plugin boundaries

`src/workbench-settings.ts` is isomorphic between Host and Client. `src/index.ts` exports only `Config` and `apply`. React components under `src/client/components/` never import `@deepseek-ai/cordis`, call Host RPC directly, or receive `ctx`; they consume `PropsStore` snapshots (`useStore`, `actions`) backed by `defineStore` factories (`createModeSwitcherStore`, `createWorkbenchSettingsRowStore`) in `src/client/stores.ts` and standard slot callbacks injected by `src/client/index.ts`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-layout](../ui-layout/README.md) — global right-rail arbitration (`shell.rightbar.global`) and panel state.
- [ui-sidebar-right](../ui-sidebar-right/README.md) — native `Files`, `Terminal`, and `Browser` tabs opened from Code presets and Inspector shortcuts.
- [ui-theme](../ui-theme/README.md) — offline Workbench `@font-face` bundles, light/dark polarity, and token layer overrides.
- [dsh-workbench](../../bundle/workbench/README.md) — Desktop overlay bundle mounting this plugin over `web-app`.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side UI plugin layer that registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Milestones P2–P6 surfaces remain staged** — Milestone P1 establishes shell chrome, mode switching, single right-rail arbitration, offline typography, and theme persistence; richer timeline grouping, diff split views, terminal/browser polish, and inline approval cards arrive incrementally in P2–P6.
- **Standalone browser sessions without Host settings use `localStorage` fallback** — when `configForms` is read-only or unavailable outside a Host session, Workbench preferences fall back to `localStorage` under `dsh.workbench.preferences.v1`.
- **Mode switching does not mutate model prompts or tool availability in P1** — switching **Work** × **Code** currently adjusts layout density and native right-rail focus only; prompt/tool presets belong to later milestones.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
