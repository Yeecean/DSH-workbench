# P1 Desktop visual direction

English | [中文](VISUAL_DIRECTION.zh.md)

## Summary

Workbench aims for a refined, open, restrained Desktop interface with clear spatial hierarchy and enough density for extended technical work. This document defines two directions for comparison; neither is approved or implemented.

## Table of Contents

- [Shared principles](#shared-principles)
- [Directions to compare](#directions-to-compare)
- [Required comparison](#required-comparison)
- [Decision and evidence](#decision-and-evidence)
- [Dev Note](#dev-note)

-----

<a id="shared-principles"></a>
## Shared principles

Reuse native DSH components, semantic theme tokens, and interactions where they fit. Workbench may add product identity to its shell, Home, Context, and navigation without redrawing native Conversation, Terminal, or Files solely for visual consistency.

Use spacing to distinguish groups and reading hierarchy, not to inflate every surface. Home and Context may breathe more freely; Terminal, file lists, logs, and technical status retain useful density. Text, icons, borders, focus, selected, disabled, and error states remain legible in light and dark modes and at the user's font scale.

Controlled glass is an optional material, not an all-surface treatment. Its eligible surfaces, opaque fallback, contrast, performance, and accessibility requirements are in [Material guidelines](MATERIAL_GUIDELINES.md).

-----

<a id="directions-to-compare"></a>
## Directions to compare

| Direction | Design intent | Expected tradeoff |
|---|---|---|
| A: Native continuity | Retain native DSH geometry, palette, and components; reserve glass for a few floating or window-level surfaces and refine typography and spacing. | Lower visual migration and integration cost; less distinct Workbench identity. |
| B: Light product identity | Retain native foundations while differentiating the Workbench shell, Home, Context, and global navigation with controlled translucent material, subtle boundaries, and more deliberate spacing. | Stronger product recognition; token mapping, performance, and compatibility need closer review. |

Explore B first, but evaluate both on equivalent screens. The final direction requires user review; no visual preference here authorizes production UI changes.

-----

<a id="required-comparison"></a>
## Required comparison

Each direction needs the same editable design states: Home with global Context; Conversation with the native Session rail; Conversation with global Context; narrow-window rightbar behavior; Appearance Settings; and theme import with preview, failure, cancel, and recovery. Show at least one equivalent surface with glass enabled and with its opaque fallback.

Compare native compatibility, product recognition, information density, reading comfort, spatial hierarchy, contrast, GPU and window-compositor cost, custom-theme consistency, and implementation effort. Include light and dark appearances, keyboard focus, scaled text, and mixed Chinese/English content. The existing single-track rightbar proposal remains subject to its separate approval in the [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md).

-----

<a id="decision-and-evidence"></a>
## Decision and evidence

The design review chooses a direction only after equivalent editable prototypes and real Windows Desktop references are available. Record the source and revision of each design, measured contrast over representative backdrops, opaque and reduced-transparency behavior, and unresolved tradeoffs; do not present static design as a shipped capability.

Appearance controls and a theme-import entry are required in the design, while their behavior and delivery phases belong to the [prototype plan](../../P1_PROTOTYPE_PLAN.md) and [roadmap](../../DEVELOPMENT_ROADMAP.md). Prototyping an entry does not implement file import or persist settings.

-----

<a id="dev-note"></a>
## Dev Note

No direction has been approved by the user. This proposal does not copy another product's interface or authorize production UI implementation.
