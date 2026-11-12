# P1 Desktop design workspace

English | [中文](README.zh.md)

## Summary

This workspace gathers the proposed P1 visual directions, native theme evidence, and editable design exploration. It does not imply product implementation or final visual approval.

## Documents

| Document | Purpose |
|---|---|
| [Design audit](DESIGN_AUDIT.md) and [brief](DESIGN_BRIEF.md) | Evidence, limitations, scope, and comparison criteria |
| [Visual direction](VISUAL_DIRECTION.md) and [materials](MATERIAL_GUIDELINES.md) | Two directions and restrained translucency |
| [Design system](DESIGN_SYSTEM.md) and [component mapping](COMPONENT_MAPPING.md) | Design rules and reuse of native components |
| [Theme system](THEME_SYSTEM_SPEC.md) and [token mapping](TOKEN_MAPPING.md) | Existing theme ownership and proposed token roles |
| [Theme import](THEME_IMPORT_SPEC.md) and [appearance settings](APPEARANCE_SETTINGS_SPEC.md) | Proposed customization, validation, preview, and recovery |
| [Interaction](INTERACTION_SPEC.md) and [responsive layout](RESPONSIVE_SPEC.md) | Proposed navigation, states, and width behavior |
| [Context information architecture](CONTEXT_INFORMATION_ARCHITECTURE.md) | Global and Session-scoped information and unresolved data sources |
| [V2 precheck](PRECHECK_REPORT.md) and [Open Design agent brief](OPEN_DESIGN_AGENT_BRIEF.md) | Current source checkpoint and the handoff for the user's design agent |
| [Open questions](OPEN_QUESTIONS.md) | Decisions and evidence still required |
| [Editable visual prototype](source/index.html) | Preserved local HTML exploration and initial baseline |

## Open Design project and exports

The native Open Design project `DSH Workbench P1 — Desktop Shell 与右栏仲裁` (project ID `dsh-workbench-p1-shell`) is saved at `C:/Users/Haoyang/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/dsh-workbench-p1-shell`. Open the project in the Open Design desktop workspace and select `index.html` for the interactive A/B workbench prototype (`?preset=S1..S8`, `?dir=native|product`, `?view=compare`, `?vp=1440|1280|1024|768|767`), or open `screens/01-home-context.html` through `screens/06-theme-import.html` for dedicated state boards alongside `assets/tokens.css`, `assets/theme-schema.json`, and `DESIGN_COMPARISON.md`.

| Exported screen | State and direction |
|---|---|
| [Direction A Home and Context](exports/od-a-home-context.png) and [Direction B Home and Context](exports/od-b-home-context.png) | Home with global Context when no active Session exists (`1440 × 900`) |
| [Direction A Conversation and Session](exports/od-a-conv-session.png) and [Direction B Conversation and Session](exports/od-b-conv-session.png) | Conversation with native Session rightbar (`Terminal` and `Files` on opaque surfaces, `1440 × 900`) |
| [Direction A Conversation and Context](exports/od-a-conv-context.png) and [Direction B Conversation and Context](exports/od-b-conv-context.png) | Single-track switch to global Context while preserving Session logical state (`expanded = true`, tabs/panes, preferred width `360px`, focus target) |
| [Narrow window fallback](exports/od-b-narrow-767.png) | Narrow layout (`767 × 900`) where left navigation enters drawer mode and the right track yields to an explicit overlay entry |
| [Appearance settings and opaque fallback](exports/od-b-appearance-glass-vs-solid.png) | Controlled shell glass vs. opaque fallback (`prefers-reduced-transparency` / no `backdrop-filter`) and native `ui-theme` font controls |
| [Theme import validation and recovery](exports/od-b-theme-import-flow.png) | Versioned theme JSON preview, unsafe CSS/URL rejection, cancel, apply, and rollback to default light theme |
| [Direction A vs. Direction B comparison matrix](exports/od-ab-comparison-matrix.png) | Side-by-side architectural and visual evaluation across ten review dimensions |
| [Preserved baseline exports](exports/desktop-home-a.png) | Earlier local HTML exploration snapshots ([Home B](exports/desktop-home-b.png), [Session Dark](exports/desktop-session-dark.png), [Narrow Context](exports/narrow-context.png), [Native Welcome](exports/native-welcome.png)) |

## Review boundaries

Both visual directions require the same screens and states, including an opaque and glass comparison. Imported themes are a required capability scheduled no later than P1.1, with safe data validation and recovery; the visual prototype does not implement real import.

The native Session rightbar and proposed global Context use the [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md), which remains pending approval. Both the preserved local HTML exploration and the editable Open Design project (`dsh-workbench-p1-shell`) are review artifacts; the P1 design review does not change the native Runtime or authorize product UI implementation.

## Dev Note

Prototype data, labels, and interactions are examples unless explicitly identified as a native observation.
