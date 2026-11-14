# Appearance settings specification

English | [中文](APPEARANCE_SETTINGS_SPEC.zh.md)

## Summary

This design proposes a reversible Appearance surface for Workbench. The native mode and separate text, code and terminal typography settings exist; accent controls and theme-file import remain proposed.

## Table of Contents

- [Controls](#controls)
- [Preview and failure states](#preview-and-failure-states)
- [Acceptance](#acceptance)
- [Dev Note](#dev-note)

-----

<a id="controls"></a>
## Controls

The existing theme plugin registers Appearance and font controls into the General settings section ([client index.ts:630–650](../../../../packages/client/ui-theme/src/client/index.ts)). The prototype should show the following understandable roles without claiming unimplemented actions are live.

| Control | Status and proposed behavior |
|---|---|
| Theme mode | Existing light, dark, and system preference; preview system changes and expose the selected state. |
| Accent and surface | Proposed constrained palette or validated custom color; preserve focus and semantic status distinctions. |
| UI text font | Existing text family list; show availability and native fallback. |
| Code and terminal fonts | Existing separate family settings; explain and preview monospace alignment. |
| Text, code, terminal size | Existing separate bounded integer sizes; label text size as conversation content, not global interface scaling. |
| Import theme | Proposed file selection and preview; in the design prototype it is a simulated flow. |
| Reset and undo | Proposed explicit restore-default and restore-previous actions with clear outcome. |

The native size ranges are text 10–22 px, code 10–16 px, and terminal 10–20 px ([theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)); a separate universal UI scale or density control is not established by this evidence. Long names, Chinese and English mixed text, numbers, glyphs, missing fonts, high DPI and narrow windows all need review.

-----

<a id="preview-and-failure-states"></a>
## Preview and failure states

Preview changes before confirmation, or support immediate preview with an explicit undo. Show representative Home, Conversation, context, and terminal content in both light and dark; verify opaque fallback and glass treatment against contrast, focus, and legibility. Theme import follows [the import specification](THEME_IMPORT_SPEC.md): file selection, validation, metadata and preview, confirmation, persistence, and cancellation.

Show a visible error beside the relevant control when a color, font, file, or save is invalid; leave the last committed appearance intact. Distinguish unsupported blur, reduced transparency, and missing font fallbacks from a failed save. Settings must be reachable by keyboard and announce selection, errors, preview, and recovery actions.

-----

<a id="acceptance"></a>
## Acceptance

Compare native-continuity and light-product directions using the same content, including an opaque-versus-glass view and a narrow layout. Verify that a theme change does not reset Session or obstruct Terminal and Files. File import must ship no later than P1.1 if safe P1 implementation is infeasible; export and advanced management can be evaluated later. The proposal has not been tested against the Desktop application.

-----

<a id="dev-note"></a>
## Dev Note

Control visuals and exact custom-color behavior await design review and a supported persistence design.
