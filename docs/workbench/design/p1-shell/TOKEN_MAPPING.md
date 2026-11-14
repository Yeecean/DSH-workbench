# Token mapping

English | [中文](TOKEN_MAPPING.zh.md)

## Summary

This source-backed map identifies native theme variables available to the proposed Workbench design. New material and spacing roles remain proposals, not existing settings or APIs.

## Table of Contents

- [Existing roles](#existing-roles)
- [Proposed roles and limits](#proposed-roles-and-limits)
- [Dev Note](#dev-note)

-----

<a id="existing-roles"></a>
## Existing roles

The native palettes define both schemes in [design-platform.css:177–204, 325–330](../../../../packages/client/ui-theme/src/styles/design-platform.css); the theme service lists inspectable aliases in [client index.ts:153–167](../../../../packages/client/ui-theme/src/client/index.ts). This is a representative map, not a claim that every native component uses only aliases.

| Workbench role | Existing native variable or contract | Reuse and limitation |
|---|---|---|
| Base and raised surfaces | `--dsw-alias-bg-base`, `--dsw-alias-bg-layer-1`, `--dsw-alias-bg-layer-2` | Use base and layer aliases; validate pairs in both modes. |
| Foreground and dividers | `--dsw-alias-label-primary`, `--dsw-alias-label-secondary`, `--dsw-alias-border-l1`, `--dsw-alias-border-l2` | Pair text, borders, and focus indication with actual surfaces. |
| Brand and states | `--dsw-alias-brand-primary`, `--dsw-alias-state-error-primary`, `--dsw-alias-state-success-primary`, `--dsw-alias-state-warn-primary` | Semantic states remain distinct from a user-selected accent. |
| Sidebar | `--dsw-specific-sidebar-fill` | Retain the existing native sidebar role; validate the Workbench treatment around it. |
| Font families | `--dsh-font-family-text`, `--dsh-font-family-code`, `--dsh-font-family-terminal` | Role-specific normalized lists and native fallback stacks ([theme-settings.ts:64–78](../../../../packages/client/ui-theme/src/theme-settings.ts), [base.css:7–31](../../../../packages/client/ui-theme/src/styles/base.css)); xterm reads the theme snapshot directly ([terminal.tsx:95–103](../../../../packages/client/ui-sidebar-terminal/src/client/terminal.tsx)). |
| Content sizes | `--dsh-content-font-size`, `--dsh-code-font-size`, `--dsh-terminal-font-size` | Native per-role sizes are bounded; content text size is not a universal UI scale ([theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)). |
| Radius | `--dsw-radius-xs` through `--dsw-radius-xl`, `--dsw-radius-panel` | Existing native shape scale ([base.css:18–23](../../../../packages/client/ui-theme/src/styles/base.css)). |

-----

<a id="proposed-roles-and-limits"></a>
## Proposed roles and limits

Define global Workbench material opacity, blur strength, glass border, opaque fallback, and layout spacing only after comparing existing tokens and primitives. Names, units, allowed bounds, mode pairs, and fallback values need implementation review. Avoid per-component literals and unbounded theme values; do not override native error or focus semantics merely to match an accent.

The token sheets contain fixed palette values and some components contain literal styling, such as the terminal cleanup shadow in [TerminalCleanup.module.css:2](../../../../packages/client/ui-sidebar-terminal/src/client/TerminalCleanup.module.css). This sample establishes an exception, not a corpus-wide measurement. The import allowlist must be explicitly defined and cannot assume all existing CSS variables are safe input.

-----

<a id="dev-note"></a>
## Dev Note

Values and visual contrast are not verified design decisions; assess them in both schemes against the rendered prototype.
