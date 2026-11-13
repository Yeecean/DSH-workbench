---
description: "Desktop Workbench overlay bundle: adds the Liquid Glass UI, Work × Code mode switcher, Global Task Inspector, and offline fonts on top of dsh-web-app."
kind: "package-bundle"
---

# @deepseek-ai/dsh-workbench

English | [中文](README.zh.md)

## Summary

`@deepseek-ai/dsh-workbench` layers the formal dsh Workbench desktop experience (`@deepseek-ai/dsh-client-ui-workbench`) on top of `@deepseek-ai/dsh-web-app` without modifying the shipped `web` CLI profile template. The Electron Desktop launcher includes this bundle after `dsh-web-app` by default (opt out cleanly with `DSH_WORKBENCH=0`). This package is a composition bundle rather than an importable library.

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

The Desktop app appends `@deepseek-ai/dsh-workbench` to its `dsh` profile bundle list automatically when preparing launches. To layer it manually onto another `web-app`-backed profile, list it after `@deepseek-ai/dsh-web-app`:

```json
{
  "name": "my-workbench-profile",
  "private": true,
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@deepseek-ai/dsh-workbench"
      ]
    }
  }
}
```

Set `DSH_WORKBENCH=0` in the Electron Desktop environment to fall back to the unmodified `web` profile bundle list (`@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app`).

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`cordis.patch.yml` appends one plugin row (`id: ui-workbench`, `name: "@deepseek-ai/dsh-client-ui-workbench"`) over the base + web-app composition. All runtime UI, single right-rail arbitration, font activation, and theme validation live in `@deepseek-ai/dsh-client-ui-workbench`; the Desktop launcher hides this bundle from the external plugin manager UI (`HIDDEN_BUNDLES`) while keeping user-installed third-party plugins intact.

| File | Role |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | Overlay patch inserting `@deepseek-ai/dsh-client-ui-workbench` |
| [`src/index.ts`](src/index.ts) | Package entry stub; carries no runtime API |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-workbench](../../client/ui-workbench/README.md) — client/host plugin mounted by this bundle.
- [dsh-web-app](../web-app/README.md) — underlying browser surface bundle composed first.
- [Desktop app](../../../apps/desktop/README.md) — Electron Desktop launcher managing `dsh` profile composition.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through each inserted row's package, which owns that row's model-facing behavior.

#### KV Cache effect

The bundle itself adds no request prefix; each inserted row's package owns any cache effect.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Requires `@deepseek-ai/dsh-web-app` before it in the bundle list** — applying this overlay without `dsh-web-app` omits required browser UI services (`ui-layout`, `ui-theme`, `ui-conversation`, `ui-settings`).
- **Default Desktop inclusion can be disabled only by `DSH_WORKBENCH=0`** — in-app third-party plugin disable switches preserve built-in profile bundles including this overlay.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
