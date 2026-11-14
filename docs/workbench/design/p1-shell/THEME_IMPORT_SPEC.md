# Theme file import specification

English | [中文](THEME_IMPORT_SPEC.zh.md)

## Summary

Theme import is a required product capability. This proposal targets P1 if it can be implemented safely; otherwise it is scheduled for P1.1 immediately after P1. The format and workflow below are drafts, not implemented APIs.

## Table of Contents

- [Draft file model](#draft-file-model)
- [Validation boundary](#validation-boundary)
- [Preview, apply, and recovery](#preview-apply-and-recovery)
- [Acceptance](#acceptance)
- [Dev Note](#dev-note)

-----

<a id="draft-file-model"></a>
## Draft file model

Evaluate UTF-8 JSON with a fixed format marker, integer schema version, bounded theme ID and display name, optional author/source text, a light or dark base, and a small explicitly allowed set of semantic colors and font choices. The following illustrative file is not an existing format:

```json
{
  "format": "dsh-workbench-theme",
  "version": 1,
  "id": "quiet-blue",
  "name": "Quiet blue",
  "base": "light",
  "colors": { "accent": "#315AC4", "surface": "#FFFFFF" },
  "fonts": { "text": "Segoe UI", "terminal": "Consolas" }
}
```

The concrete allowed keys and their mapping require theme-owner review; shape, spacing, and material fields may be added only when supported and bounded. Do not assume raw native CSS variables, plugin icon documents, or custom theme IDs are safe or durably selected by the native system. The existing registration contract is trusted plugin code ([ui-theme client index.ts:72–96, 252–265](../../../../packages/client/ui-theme/src/client/index.ts)).

-----

<a id="validation-boundary"></a>
## Validation boundary

Import data only: reject scripts, HTML, stylesheets, CSS declarations, URLs, dynamic modules, plugin code, and arbitrary icon markup. Restrict token names to an explicit allowlist and color values to a strictly parsed color format; normalize bounded font family names with native rules ([theme-settings.ts:155–168](../../../../packages/client/ui-theme/src/theme-settings.ts)) and never fetch a font from a file-supplied URL.

Before parsing, cap bytes and require UTF-8. Bound collection counts, nesting, ID/name/source lengths, numeric ranges, and strings; reject duplicate keys and unsupported schema versions. For version 1, reject unknown fields with a clear path-specific error; any future compatibility policy must be versioned. The final limits require implementation review and tests.

Check required foreground/background and control/focus contrast after resolving the chosen base, including the opaque fallback. Reject inaccessible combinations or make a safe correction visible before confirmation. A file must not store credentials, file paths, Session content, or other private user data.

-----

<a id="preview-apply-and-recovery"></a>
## Preview, apply, and recovery

Select file → parse and validate → display name, source and base mode → preview without durable mutation → confirm or cancel → apply and persist. Preview must not write settings or change Session state; cancelling or dismissing it restores the previous appearance. Warn clearly if a referenced font is unavailable and show its fallback.

On confirmation, validate again against the current state; make the visible update and durable write one recoverable transaction, handle concurrent settings changes explicitly, and preserve the previous committed theme if validation, rendering, or persistence fails. A crash or reload must resolve to a complete previous or complete new valid theme, never a partial token set. Offer restore-default and revert-to-previous actions.

Export and management may follow in P2+, without delaying the required import. An export proposal must omit personal paths, credentials, Session data and unnecessary metadata; actual persistence design is still open because native custom IDs are not persisted by the built-in preference writer.

-----

<a id="acceptance"></a>
## Acceptance

Exercise valid light/dark files, unknown fields or versions, malformed JSON, duplicate keys, oversized input, unsafe CSS or URLs, missing fonts, contrast failure, cancellation, concurrent changes, storage failure, crash recovery, and restart. Verify the previous appearance and native Session, Terminal, and Files remain usable after every failed import. These checks are planned, not run.

-----

<a id="dev-note"></a>
## Dev Note

The JSON example is design-only and must not be presented as an accepted file format.
