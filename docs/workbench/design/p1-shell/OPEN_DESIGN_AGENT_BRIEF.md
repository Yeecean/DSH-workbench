# Open Design agent brief: DSH Workbench P1

English | [中文](OPEN_DESIGN_AGENT_BRIEF.zh.md)

## Assignment

Use the running Open Design environment to create an editable Windows Desktop design for DSH Workbench. Treat the user's V2 instruction file as the detailed source of requirements; this brief is an execution handoff. Complete design and review materials only. Preserve existing files and projects, and do not modify production code, commit, or push without a separate user instruction.

## Read first

Review the [design index](README.md), [native audit](DESIGN_AUDIT.md), [visual direction](VISUAL_DIRECTION.md), [theme and token mapping](THEME_SYSTEM_SPEC.md), [interaction spec](INTERACTION_SPEC.md), [responsive spec](RESPONSIVE_SPEC.md), [Context information architecture](CONTEXT_INFORMATION_ARCHITECTURE.md), and the [global rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md). Read `C:/Users/Haoyang/Downloads/Download-Chorm/DSH-workbench_P1开发指导指令_V2.md` for the complete instructions, especially sections 6–13 and appendices A–B. The [local HTML exploration](source/index.html) is a reference, not a native Open Design project or an approved product.

## Design scope

Create two comparable directions: A continues native DSH visual language; B adds restrained Workbench identity. Use the same states for each: Home with global Context and no active Session, Conversation with native Session tools, Conversation with Context, a narrow-window fallback, Appearance Settings, and theme import with preview, failure, cancel, apply, and recovery. Clearly mark sample data and unimplemented controls; do not copy another product's UI or imply official endorsement.

Show one physical right track with an explicit Context/Session switch. Design preserved Session tabs, panes, expanded intent, width preference, and restorable focus; show close/reopen, narrow layout, fullscreen navigation, and plugin-unavailable fallback. Keep global Workspace, execution, and Agent information distinct from Session-scoped information; do not portray candidate fields as connected APIs or conflate installed tools with those admitted to a Session.

Use restrained glass only where it improves hierarchy, with an opaque comparison and fallback. Keep Conversation text, Terminal, Files, logs, and dense settings readable on stable surfaces. Cover light and dark, contrast and focus, Windows scaling, reduced transparency and motion, UI and monospace fonts, size, accent, and reset. Theme files are proposed versioned data with validation and rollback; never demonstrate execution of scripts or arbitrary CSS as a feature.

## Required outputs

Save the editable native Open Design project, its exact location and opening instructions, and separately inspectable exports for each core state under the existing design workspace or another user-approved location. Do not overwrite existing assets. Include 1440 × 900, 1280 × 800, 1024 px, 768 px, and 767 px reference layouts, and record which sizes were actually inspected. Link the native project and exports from the design index; if the tool cannot provide a native project or an export, report the exact blocker rather than substituting a screenshot as an editable source.

Provide a comparison of A and B based on compatibility, identity, density, reading comfort, contrast, accessibility, performance, theme compatibility, and implementation cost. Recommend a direction without treating it as approved. Report the Context data contracts still unknown, the visual decisions needing user approval, and the difference between observed native screens, design simulations, and unrun Windows acceptance.

## Boundaries

Do not replace `root` or the native `rightbar`, use `shell.overlay` as a permanent layout column, add a second Runtime, Session store, or RPC, or begin implementation. The proposed layout extension, any minimal native rightbar adaptation, single-track policy, isolated Desktop Profile, final visual direction, and P1 scope remain subject to user approval.

Do not use real credentials, Sessions, user Workspace data, or destructive Desktop preparation. If native visual references require authentication or isolation cannot be established, report the limitation. Stop after delivering the design for review.

## Dev Note

This handoff delegates Open Design operation to the user's chosen agent; it does not claim that the requested Open Design project already exists.
