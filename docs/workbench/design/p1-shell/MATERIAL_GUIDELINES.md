# P1 Desktop material guidelines

English | [中文](MATERIAL_GUIDELINES.zh.md)

## Summary

These proposed rules use translucent material only where it clarifies layering, while retaining stable reading surfaces and an opaque fallback. They require visual and performance validation before product implementation.

## Table of Contents

- [Surface placement](#surface-placement)
- [Contrast and fallback](#contrast-and-fallback)
- [Spacing and density](#spacing-and-density)
- [Windows review](#windows-review)
- [Dev Note](#dev-note)

-----

<a id="surface-placement"></a>
## Surface placement

Candidate glass surfaces are a compact toolbar, floating menu or popover, drawer scrim, selected navigation surface, and lightweight Context controls. A candidate must earn its blur by clarifying depth without obscuring underlying content.

Conversation text, Terminal, code, logs, diffs, file content, dense tables and settings forms use opaque or otherwise stable reading surfaces by default. Dangerous actions, confirmations, and errors need unambiguous boundaries and must not rely on blur for importance.

Use a small number of material layers; avoid stacking large blurred surfaces or placing text over complex moving imagery. Prefer existing semantic tokens and shared primitives over component-specific literal styles. Shadow should communicate a genuinely floating surface, not decorate every panel.

-----

<a id="contrast-and-fallback"></a>
## Contrast and fallback

Assess text, icons, borders, and focus rings against representative light, dark, and high-contrast content behind every translucent surface. Target at least 4.5:1 for normal text and 3:1 for large text and necessary control or focus indicators, applying the relevant exceptions explicitly. Measure the rendered combination in both appearances; a background-independent token value alone is not sufficient evidence.

When blur is unavailable, expensive, or reduced transparency is requested by the operating system where exposed, use an opaque semantic surface with equivalent readable foreground and visible boundary. Reduced motion removes nonessential transitions. Selection, disabled, focus, and error states also use shape, text, outline, or another non-color cue; blur alone never conveys state.

-----

<a id="spacing-and-density"></a>
## Spacing and density

Define semantic spacing for frame edges, columns, groups, rows, and control insets against existing theme values rather than hardcoding independent component scales. Use clear title/body/metadata hierarchy, readable line height and measure, restrained radius, borders, and separators.

Home and Context overview sections may use wider group spacing; Terminal output, file lists, tool status, and tables retain compact rows. Evaluate empty, loading, and error states at the same widths and text scales as populated views. Font scaling must not conceal navigation or action labels.

-----

<a id="windows-review"></a>
## Windows review

Compare glass and opaque examples in light and dark appearances on Windows Native Desktop. Check high DPI, window resizing, long-running Terminal output, representative GPU/compositor configurations, and system transparency or motion preferences where available; record device, scale, measurements, and any untested conditions.

Inspect keyboard focus, text selection, scrolling, menus, and screen-reader order at narrow widths. If the effect degrades response or legibility, use the opaque material rather than treating blur as mandatory.

-----

<a id="dev-note"></a>
## Dev Note

These are design requirements, not claims that the existing theme supports runtime blur control or platform preference detection.
