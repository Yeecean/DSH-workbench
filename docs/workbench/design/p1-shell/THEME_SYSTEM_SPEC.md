# Theme system specification

English | [中文](THEME_SYSTEM_SPEC.zh.md)

## Summary

This proposed design reuses the native theme owner for Workbench surfaces. Color controls and imported themes are proposals; their persistence and Windows behavior are not yet verified.

## Table of Contents

- [Native capabilities](#native-capabilities)
- [Proposed responsibilities](#proposed-responsibilities)
- [Delivery and acceptance](#delivery-and-acceptance)
- [Dev Note](#dev-note)

-----

<a id="native-capabilities"></a>
## Native capabilities

The Host registers theme configuration and boot-time injection in [ui-theme index.ts:37–62](../../../../packages/client/ui-theme/src/index.ts); the Client owns `ThemeRuntime`, change events, and plugin registrations in [client index.ts:170–220](../../../../packages/client/ui-theme/src/client/index.ts). Its built-in choices are `light`, `dark`, and `system` ([theme-settings.ts:6–21](../../../../packages/client/ui-theme/src/theme-settings.ts)).

Existing settings provide separate text, code, and terminal font families and sizes; text size affects conversation content rather than every UI component ([theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)). The General settings section receives Appearance and font controls through slots ([client index.ts:630–650](../../../../packages/client/ui-theme/src/client/index.ts)).

The settings service writes editable values through the active profile configuration editor ([settings index.ts:343–350, 378–391](../../../../packages/settings/settings/src/index.ts)); the old `settings.yaml` is a legacy import, not the current write target ([settings index.ts:238–257](../../../../packages/settings/settings/src/index.ts)). Desktop uses the Web client in its Desktop host ([architecture.md](../../../architecture.md)); shared code does not itself prove identical platform behavior.

The layout presenter applies palette attributes, alias tokens and font variables to the document ([theme-presenter.ts:69–90](../../../../packages/client/ui-layout/src/client/theme-presenter.ts)); Host boot injection covers the pre-plugin interval ([boot-theme.ts:47–62](../../../../packages/client/ui-theme/src/boot-theme.ts)). Theme registration and two-mode token layers have disposers ([client index.ts:344–396](../../../../packages/client/ui-theme/src/client/index.ts)). Only built-in preference ids are written by `setTheme`; a registered custom id is not durably selected by this path ([client index.ts:252–265](../../../../packages/client/ui-theme/src/client/index.ts)).

-----

<a id="proposed-responsibilities"></a>
## Proposed responsibilities

Workbench consumes the existing semantic color and typography tokens and existing primitives, then proposes named, documented material or spacing aliases only where existing roles are insufficient. The [token map](TOKEN_MAPPING.md) distinguishes existing variables from proposed roles.

Theme choice, typography, and optional surface treatment remain presentation settings. They must not modify Agent Runtime, Session data, terminal state, or plugin business state. Theme changes must preserve native Conversation, Terminal, and Files behavior and avoid remounting them solely for a color update.

The selected appearance should offer light, dark, and system modes; proposed accent and surface controls must validate contrast for both schemes. Font lists need Chinese and English fallback, code glyph checks, monospace cell alignment, and DPI and zoom checks. An unavailable font uses the native fallback stack.

Third-party theme registration is trusted plugin code and can include icon replacements; it is not a safe file-import interface ([client index.ts:72–96](../../../../packages/client/ui-theme/src/client/index.ts)). An imported data file requires the separate constrained design in [theme import](THEME_IMPORT_SPEC.md).

-----

<a id="delivery-and-acceptance"></a>
## Delivery and acceptance

P1 design covers light and dark, restrained glass, opaque fallback, basic Appearance controls, and an import preview. P1 implementation should reuse native typography and built-in appearance controls and evaluate a limited accent setting. A complete, versioned theme import is required in P1 when safely feasible; otherwise it is scheduled immediately after P1 as P1.1, with export and multi-theme management evaluated for P2+.

Acceptance requires Windows Desktop and Web checks for theme boot and reload, settings-write failure, plugin disposal, contrast, zoom, native panel preservation, font fallback, and no unwanted Session reset. None of these prototype checks was run for this proposal.

-----

<a id="dev-note"></a>
## Dev Note

This document records source inspection and design intent; it does not assert that the proposed customization exists.
