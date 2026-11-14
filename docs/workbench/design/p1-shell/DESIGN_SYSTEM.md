# P1 Workbench design system

English | [中文](DESIGN_SYSTEM.zh.md)

## Summary

This proposal organizes Workbench appearance around native DSH theme ownership, shared controls, and semantic roles. Values, component treatments, and the final visual direction require design review and Windows validation.

## Table of Contents

- [Native foundation](#native-foundation)
- [Semantic roles](#semantic-roles)
- [Typography and density](#typography-and-density)
- [Controls and accessibility](#controls-and-accessibility)
- [Validation](#validation)
- [Dev Note](#dev-note)

-----

<a id="native-foundation"></a>
## Native foundation

The native theme supplies light, dark, and system preferences and separate text, code, and terminal font settings ([theme-settings.ts:6–63](../../../../packages/client/ui-theme/src/theme-settings.ts)). Its base styles define text and code fallback stacks and radius values ([base.css:7–31](../../../../packages/client/ui-theme/src/styles/base.css)). The native General Settings slot already receives appearance and font rows ([ui-theme index.ts:630–653](../../../../packages/client/ui-theme/src/client/index.ts)).

Reuse these owners and existing shared primitives when they fit. Product-specific appearance, color controls, and file import are proposals, not evidence of an existing Workbench settings page. The [theme system](THEME_SYSTEM_SPEC.md) and [token mapping](TOKEN_MAPPING.md) distinguish existing values from proposed roles.

-----

<a id="semantic-roles"></a>
## Semantic roles

| Role | Proposed use |
|---|---|
| Surface and content | Separate base, raised, floating, primary, and secondary content using native semantic aliases where suitable. |
| Interaction and feedback | Keep action, focus, success, warning, and error meanings distinct from user-selected accents. |
| Shape and space | Reuse documented radius roles; establish named frame, group, row, and control spacing only after checking existing values. |
| Material | Treat blur, opacity, glass boundary, and opaque fallback as named material roles rather than per-component effects. |

Each new role needs a name, owner, light and dark value, and readable fallback. Do not expose unreviewed arbitrary CSS through theme input. [Material guidelines](MATERIAL_GUIDELINES.md) govern where glass can appear and how to assess the actual rendered backdrop.

-----

<a id="typography-and-density"></a>
## Typography and density

Use a restrained hierarchy for title, body, secondary copy, and metadata. Home and Context can use wider grouping while Conversation, Terminal, Files, and technical lists retain useful row density. Keep equal roles visually consistent rather than assigning every component a separate size or spacing value.

Check mixed Chinese and English, numbers, code symbols, font fallback, and monospaced Terminal alignment at high DPI and user font sizes. Existing content font sizing is not a general UI zoom control ([theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)); any broader Workbench scale needs its own design and validation.

-----

<a id="controls-and-accessibility"></a>
## Controls and accessibility

Prefer shared Button, Menu, Modal, Tooltip, and Toast controls and preserve their documented keyboard and focus behavior ([ui-primitives catalog:45–71](../../../../packages/client/ui-primitives/README.md)). Keep navigation labels, destructive confirmation, loading, empty, error, and disabled states meaningful without relying on color or blur alone.

Measure normal text, large text, icons, borders, and focus indicators against actual light and dark surfaces, including glass over representative content. Maintain keyboard order and visible focus, respect supported reduced-motion and reduced-transparency preferences, and provide an opaque fallback. Contrast targets and platform review are in [material guidelines](MATERIAL_GUIDELINES.md).

-----

<a id="validation"></a>
## Validation

Compare both proposed visual directions on the same Home, Conversation, Context, Session rail, narrow window, Appearance, and import states. Review real Windows Desktop references, font fallback, opacity fallback, scaling, resize behavior, and component preservation; a design mockup does not establish runtime behavior.

-----

<a id="dev-note"></a>
## Dev Note

This is an unapproved proposal. It does not add a parallel Theme Runtime or alter native feature ownership.
