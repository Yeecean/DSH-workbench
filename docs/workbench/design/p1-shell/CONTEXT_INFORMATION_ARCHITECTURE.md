# P1 Context information architecture

English | [中文](CONTEXT_INFORMATION_ARCHITECTURE.zh.md)

## Summary

This proposal organizes Context by source and scope so Home remains useful without an active Session. Field names below are candidates, not claims that a corresponding API, permission, or live data source exists.

## Table of Contents

- [Scope and priority](#scope-and-priority)
- [Candidate groups](#candidate-groups)
- [Session states](#session-states)
- [Availability and admission](#availability-and-admission)
- [Design and verification limits](#design-and-verification-limits)
- [Dev Note](#dev-note)

-----

<a id="scope-and-priority"></a>
## Scope and priority

Use an execution/workspace-first overview on Home: show known global execution and current Workspace context, followed by current Agent or model configuration and resource summaries. In Conversation, put explicitly labeled Session-local information first, followed by the independently labeled global and Agent groups. The relative order is a design recommendation, not a data-precedence rule.

Every displayed fact needs an identified owner and scope: global execution or Workspace, Agent configuration, or a specific Session. A Session-local value represents only that Session; global values do not silently override it, and selection changes must replace or clear stale Session-local content. A missing Workspace, Agent, or data source must be shown honestly rather than synthesized.

Current `main` selection can switch global panels without changing the current Session ([layout service.ts:27–36](../../../../packages/client/ui-layout/src/client/service.ts)); the native Session rightbar hides its Session views outside Conversation ([RightbarRoot.tsx:17–25, 34–37](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)). These facts explain scope separation but do not establish an API for the proposed global Context panel.

-----

<a id="candidate-groups"></a>
## Candidate groups

| Group and scope | Candidate content | Display and verification boundary |
|---|---|---|
| Execution; global | Execution-world identity and connection state, such as Windows Native. | Show a real value or live status only after verifying its provider and freshness; WSL stays an unconnected future option until proven. |
| Workspace; global or selected Workspace | Current Workspace or project identity and work directory. | Require the actual Host/API source and its authorization; a visible path does not imply unrestricted access. |
| Agent; current configuration | Non-sensitive Agent identity and configuration summary. | Label its owner and source; never show credentials, API keys, tokens, or private authentication data. |
| Model; current configuration or Session if actually scoped there | Non-sensitive Provider and model names. | Confirm actual source and scope before showing current status; do not infer authentication details. |
| Resources; explicitly scoped | Skills, MCP servers, Tools, and Plugins as separate kinds. | Preserve installed, currently available, and Session/Agent-admitted distinctions; do not infer tool invocation rights from plugin inventory. |
| Session; selected Session only | Non-sensitive local details that have a verified source. | Show only with an active Session and identify it; clear or replace these fields on Session switch. |

P1 should start with only fields whose data, scope, permissions, and refresh behavior have been verified. Broader activity, resource search, and richer group details require separate data contracts and can follow in P2 or later; do not fill a P1 design with invented counts, token usage, task totals, or activity.

-----

<a id="session-states"></a>
## Session states

| State | Proposed Context presentation |
|---|---|
| No active Session | Keep global Execution, Workspace, and Agent groups available where their real sources exist. Show a clear Session empty state or omit Session-local content; a missing source has its own unavailable state. |
| Active Session | Label the selected Session and separate its local group from global Workspace and Agent configuration. A Session change clears stale local values before showing newly verified data. |
| No active Workspace or Agent | Show an honest empty or unavailable state for that group; never infer access to a local directory or fabricate an Agent. |

The screen must remain useful without Session-local fields. Any illustrative values in a visual prototype must be marked as sample data and cannot stand in for runtime evidence.

-----

<a id="availability-and-admission"></a>
## Availability and admission

`Installed` means present in an identified inventory; `available` means the responsible provider currently reports the resource usable; `admitted` means the identified Agent or Session is allowed to use it. These are proposed display labels, not interchangeable facts or currently established API fields. `Unknown`, loading, unavailable, and error must remain distinct from an empty collection or a denied action.

Never describe a Plugin as callable by an Agent merely because it is installed. Determine the authority, timing, and scope of each signal before showing a badge or action; where no reliable source exists, omit the field or mark it unavailable rather than guessing.

-----

<a id="design-and-verification-limits"></a>
## Design and verification limits

Design both no-Session and active-Session states, plus missing Workspace, loading, unavailable, and error states. Use progressive grouping or collapse when content grows; search is a later option until scope and data contracts justify it. The visual comparison should not imply that grouping, data refresh, or navigation is already implemented.

Validate the data authority and permissions for each proposed P1 field, Session switching and stale-data cleanup, keyboard access, narrow width, and independent rightbar lifecycle. Preserve native Session, Terminal, Files, and the single-track arbitration in the [interaction specification](INTERACTION_SPEC.md) and [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md).

-----

<a id="dev-note"></a>
## Dev Note

This is a design for review; no Context data binding, authorization state, or runtime verification is claimed.
