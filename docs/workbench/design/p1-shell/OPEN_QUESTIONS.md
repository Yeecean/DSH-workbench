# P1 visual design decisions for review

English | [中文](OPEN_QUESTIONS.zh.md)

## Summary

These decisions remain open until the user reviews the visual alternatives and architecture evidence. Prototype illustrations and planned behavior do not establish an implemented product capability.

## Table of Contents

- [Decisions](#decisions)
- [Evidence required](#evidence-required)
- [Dev Note](#dev-note)

-----

<a id="decisions"></a>
## Decisions

| Decision | Current recommendation and tradeoff |
|---|---|
| Visual direction | Compare native continuity A with light product identity B on matching screens; explore B first, and do not select the final direction before review. |
| Context and Session rail | The [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md) proposes one arbitrated track; decide whether switching is acceptable or simultaneous visibility requires a different layout. |
| Desktop Profile | The [profile report](../../DESKTOP_PROFILE_FEASIBILITY.md) proposes an isolated Harness home using the reserved `desktop` profile; decide whether the prototype may use it or a separately named Electron profile is mandatory. |
| Theme fields | Decide the supported accent, surface, fonts, sizes, material, and accessibility controls after reviewing the [theme system](THEME_SYSTEM_SPEC.md), compatibility, and actual prototype. |
| Theme import schedule | Import is required no later than P1.1; decide whether audited facilities make a safe P1 delivery practical. Export and theme collections can be considered for P2 or later. |
| Native visual comparison | Decide the final material treatment only after reviewing matching opaque and glass examples, light and dark modes, contrast, density, performance, and real Windows Desktop references. |

-----

<a id="evidence-required"></a>
## Evidence required

Review editable design sources for both directions and the same Home, Conversation, Context, Session rail, narrow-window, Appearance, and import states. The review needs actual Windows references and recorded measurements; planned comparisons must remain marked unverified until performed.

Theme import requires a versioned data-only format, allowlisted validation, preview and explicit application, cancellation, failure without losing the current theme, and reset or rollback. The [import specification](THEME_IMPORT_SPEC.md) describes the proposed boundary; a design image is not a working importer.

The layout and Desktop Profile decisions are independent of the visual direction. Production implementation remains outside this design review and requires the approvals recorded in the [prototype plan](../../P1_PROTOTYPE_PLAN.md).

-----

<a id="dev-note"></a>
## Dev Note

No option in this list has been approved merely because it is recommended for exploration.
