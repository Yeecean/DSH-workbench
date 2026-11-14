# DSH Workbench Phase 1 Baseline

English | [中文](README.zh.md)

## Summary

This directory records the Phase 1 baseline for the DSH Workbench: the preserved fork, the clean upstream worktree, a source-led audit of the native runtime, the verified Windows Desktop build, and a proposed extension architecture. The Workbench reuses the DeepSeek Harness Runtime and its Host/Client protocol, then adds product behavior through Cordis plugins, bundles, profiles, Typert APIs, and client UI slots. This phase establishes evidence for review; it does not ship a new Agent loop, Session store, RPC layer, Plugin Manager, or WSL bridge.

## Table of Contents

- [Phase boundaries](#phase-boundaries)
- [Document map](#document-map)
- [Baseline at a glance](#baseline-at-a-glance)
- [Decision labels](#decision-labels)
- [Evidence status](#evidence-status)
- [Architecture review point](#architecture-review-point)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

-----

<a id="phase-boundaries"></a>
## Phase boundaries

Phase 1 answers whether Workbench can stand on the native DSH architecture without forking core contracts. It protects the original fork, produces a clean baseline from official `master`, audits source ownership, verifies the official Windows Desktop launch path, and proposes a staged product architecture for approval.

**Verified:** the baseline worktree starts the Electron Desktop, a private Desktop Host, and the standard Web Client. Type checking, lint, library builds, the Desktop build, and focused reruns of two timing-sensitive GUI tests pass.

**Source-inferred:** the recommended design retains `AppFrame`, the native Host/Client API, and the unmodified Runtime, then contributes a Workbench client bundle and focused client plugins. **Not yet verified:** the proposed Workbench screens, File Explorer, Editor, Approval Center, WSL Host adapter, and plugin UX have not been implemented.

-----

<a id="document-map"></a>
## Document map

The pages have separate owners. Start with the audit and sync report, then review the proposed architecture, extension boundaries, platform limits, and roadmap.

| Document | Purpose |
|---|---|
| [Upstream sync report](UPSTREAM_SYNC_REPORT.md) | Fork identity, branch topology, pinned baseline, research export, and build evidence |
| [Native architecture audit](NATIVE_ARCHITECTURE_AUDIT.md) | Source-led review of Cordis, Agent Runtime, Session, Typert, Desktop, UI, and Windows |
| [Workbench architecture](WORKBENCH_ARCHITECTURE.md) | Proposed target composition, module classification, and UI options |
| [Extension points](EXTENSION_POINTS.md) | Supported ways to add tools, models, behavior, Host/Client plugins, APIs, and UI |
| [Platform compatibility](PLATFORM_COMPATIBILITY.md) | Verified Windows behavior, WSL2 constraints, and the future execution-world design |
| [Development roadmap](DEVELOPMENT_ROADMAP.md) | Staged work with dependencies, source areas, acceptance conditions, and risks |
| [AppFrame Slot audit](APPFRAME_SLOT_AUDIT.md) | P1 source review and the global-page rightbar limitation |
| [Native capability matrix](NATIVE_CAPABILITY_MATRIX.md) | Native service, API, and UI ownership and preservation conditions |
| [WSL2 feasibility](WSL2_FEASIBILITY.md) | Observed WSL environment and unverified Host paths |
| [Known issues](KNOWN_ISSUES.md) | Desktop shutdown, IPC, and GUI timeout investigation status |
| [Git synchronization report](GIT_SYNC_REPORT.md) | Branch synchronization checkpoint and retained history |
| [Global rightbar ADR](GLOBAL_RIGHTBAR_ADR.md) | Options, proposed layout contract, and pending decisions |
| [Desktop Profile feasibility](DESKTOP_PROFILE_FEASIBILITY.md) | Desktop composition, isolation, and verification plan |
| [P1 prototype plan](P1_PROTOTYPE_PLAN.md) | Minimal prototype scope and Windows acceptance plan |
| [P1 visual direction](design/p1-shell/VISUAL_DIRECTION.md) | Two visual directions and required comparison states |
| [P1 material guidelines](design/p1-shell/MATERIAL_GUIDELINES.md) | Controlled glass, opaque fallback, density, and Windows review |

-----

<a id="baseline-at-a-glance"></a>
## Baseline at a glance

The worktree is based on the recorded upstream commit and is separate from the older fork snapshot. A Workbench-specific documentation commit is present on the P1 branch; it does not implement the Workbench product shell. See the [Git synchronization report](GIT_SYNC_REPORT.md).

| Item | Recorded value |
|---|---|
| Fork | `https://github.com/Yeecean/DSH-workbench` |
| Upstream | `https://github.com/deepseek-ai/deepseek-harness` |
| Official default branch | `master` |
| Fork default branch | `main` |
| Baseline branch | `upstream-baseline-2026-11-12` |
| Baseline commit | `e8f7 b93a 3449 64de 3dca 1ace 9e72 b6e4 d6de 87cb` |
| Package version | `0.2.2-rc.2` |
| Node / pnpm | `24.16.0` / `11.28.5` |

Commit identifiers are grouped in four-character blocks to satisfy the repository reference policy; remove the spaces to obtain the exact SHA. The older `main` and `workbench` fork branches remain at `6649 1b05 e3f0 5ad3 5bcd d4f6 cd7e d260 41d9 e3db` (`0.2.2-rc.1`). Neither branch has a fork-specific commit. The official `master` and the local baseline are 1,734 commits ahead of that snapshot.

-----

<a id="decision-labels"></a>
## Decision labels

The proposed architecture classifies every material module so review can distinguish direct composition from product work.

| Label | Meaning |
|---|---|
| `REUSE` | Consume the native package and contract without replacing its implementation |
| `EXTEND` | Add behavior through a documented Cordis, Typert, bundle, profile, or client UI extension point |
| `REPLACE` | Supply a different implementation behind an existing service or client contract |
| `BUILD` | Create Workbench-owned product code that has no native owner |

The proposed Workbench uses `REUSE` for the Runtime, Agent loop, Session, Typert transport, Remote access policy, Terminal service, filesystem service, and provider adapters. It uses `EXTEND` for tools, model routing, lifecycle observation, Desktop composition, UI slots, routes, and localization. It reserves `REPLACE` for shell-level product policy or presentation that cannot be expressed as an occupant. It uses `BUILD` for Workbench product screens, the execution-world selector, and a later WSL adapter.

-----

<a id="evidence-status"></a>
## Evidence status

Operational statements in this collection use three evidence labels. Commands in the sync report were executed against the recorded worktree; source references identify the implementation that supports an architectural inference.

| Status | Use |
|---|---|
| `已验证` | An observed command, launch, or file-system result establishes the statement |
| `源码推断` | Current source establishes the behavior, but the complete product path was not executed |
| `尚未验证` | A proposal, environment gap, external dependency, or unexecuted path prevents a conclusion |

The audit does not treat a README claim as sufficient evidence when source is available. A statement that spans generated Typert methods, Desktop packaging, or an untested WSL configuration remains marked as inferred or unverified.

-----

<a id="architecture-review-point"></a>
## Architecture review point

P1 implementation is paused at the requested Slot review: the existing Session rightbar hides on independent global pages, so the requested Home rightbar needs an additional layout extension or a changed requirement. See the [AppFrame Slot audit](APPFRAME_SLOT_AUDIT.md).

Windows Native remains the first acceptance platform; a WSL execution world is a later, separately verified Host topology. The P1 documentation has been committed and pushed; the Workbench shell and product release remain unimplemented.

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages after this index. The order moves from repository state to source behavior, then from the proposed composition to platform and delivery constraints.

- [Upstream sync report](UPSTREAM_SYNC_REPORT.md) — confirm the preserved fork and pinned source baseline.
- [Native architecture audit](NATIVE_ARCHITECTURE_AUDIT.md) — understand the native services, protocols, processes, and extension ownership.
- [Workbench architecture](WORKBENCH_ARCHITECTURE.md) — review the proposed composition and UI choice.
- [Extension points](EXTENSION_POINTS.md) — select the narrowest supported extension for each feature.
- [Platform compatibility](PLATFORM_COMPATIBILITY.md) — separate Windows acceptance from future WSL2 work.
- [Development roadmap](DEVELOPMENT_ROADMAP.md) — review the proposed sequence and acceptance conditions.

-----

<a id="dev-note"></a>
## Dev Note

None.
