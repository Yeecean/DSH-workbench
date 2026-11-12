# Workbench Development Roadmap

English | [中文](DEVELOPMENT_ROADMAP.zh.md)

## Summary

The roadmap turns the audited native architecture into prioritized product work. It starts with architecture approval, then establishes the Workbench shell and one shared Session path, followed by the file, terminal, approval, plugin, and Work/Code surfaces. Windows Native is the first delivery world; WSL2 begins only after the local Host, recovery, and plugin boundaries are stable. Every task below names its dependencies, source area, expected change, acceptance condition, and principal risk.

## Table of Contents

- [Planning rules](#planning-rules)
- [Priority order](#priority-order)
- [P0: Architecture review](#p0-architecture-review)
- [P1: Workbench shell](#p1-workbench-shell)
- [P2: Session and activity](#p2-session-and-activity)
- [P3: Workspace and editor](#p3-workspace-and-editor)
- [P4: Terminal and jobs](#p4-terminal-and-jobs)
- [P5: Approval and plugin center](#p5-approval-and-plugin-center)
- [P6: Work and Code orchestration](#p6-work-and-code-orchestration)
- [P7: WSL execution world](#p7-wsl-execution-world)
- [P8: Release and upstream cadence](#p8-release-and-upstream-cadence)
- [Milestone exit criteria](#milestone-exit-criteria)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

-----

<a id="planning-rules"></a>
## Planning rules

Each phase produces a runnable, reviewable product slice. A later phase may consume a stable interface from an earlier phase, but it must not rely on an unfinished Host contract. A feature that needs a native behavior not exposed by the Host stays blocked until its extension point is implemented and verified.

The plan keeps four constraints:

- Native Agent, Session, LLM, tool, MCP, Skill, persistence, Remote, and Plugin contracts remain authoritative.
- Workbench changes arrive through a bundle, Host/Client plugins, profiles, Typert APIs, client slots, and theme tokens.
- Windows Native is the acceptance platform until the WSL phase explicitly changes scope.
- Plans become deliverables only after their source, tests, documentation, and observed product path exist.

No phase authorizes a second RPC stack, a replacement Agent loop, a replacement Session model, or a renderer with direct Node access.

-----

<a id="priority-order"></a>
## Priority order

The sequence front-loads architecture proof and the user’s primary work loop. File editing and terminal integration follow the shared Session surface because they depend on its resource scope and routing.

| Priority | Phase | Outcome |
|---|---|---|
| P0 | Architecture review | Approval or revision of composition, layout, platform, and plugin-safety decisions |
| P1 | Workbench shell | Branded, navigable Windows Desktop with a native Host and bounded product bundle |
| P2 | Session and activity | One Workbench Session center with usable Agent/activity states |
| P3 | Workspace and editor | Native workspace file operations inside a coherent product workspace |
| P4 | Terminal and jobs | Product terminal and background activity through native services |
| P5 | Approval and plugins | Safe interaction, plugin inventory, and privileged mutation UX |
| P6 | Work and Code | Shared runtime with coherent product modes and presets |
| P7 | WSL execution world | Separate Linux Host endpoint and recovery model |
| P8 | Release cadence | Reproducible packaging, upgrade, and upstream synchronization |

-----

<a id="p0-architecture-review"></a>
## P0: Architecture review

### Goal

Approve the Workbench composition, retain or replace decision for the client layout, Windows-first platform order, and privileged Plugin Manager behavior before code begins.

### Prerequisites

- Read the [upstream sync report](UPSTREAM_SYNC_REPORT.md), [native audit](NATIVE_ARCHITECTURE_AUDIT.md), [target architecture](WORKBENCH_ARCHITECTURE.md), and [extension points](EXTENSION_POINTS.md).
- Confirm the pinned upstream SHA and whether a newer official baseline requires re-audit.
- Resolve any disputed product boundary before package names or acceptance tasks are fixed.

### Source areas

`packages/boot/app-boot`, `packages/bundle/base`, `packages/client/modules`, `packages/client/ui-layout`, `packages/client/ui-slots`, `apps/desktop`, and `apps/desktop-host`.

### Expected changes

Documentation and architecture decisions may be revised. No product feature, Runtime modification, or WSL bridge is implemented in this phase.

### Acceptance condition

Review explicitly approves or requests changes for the `AppFrame` strategy, Windows-first scope, native API boundary, plugin privilege model, and phase sequence. Any requested architecture change updates the affected pages before P1 starts.

### Risk

Approving an ambiguous shell or authority model creates costly rework across every later client and Host plugin. Treating the recommendation as shipped behavior would hide unverified paths.

-----

<a id="p1-workbench-shell"></a>
## P1: Workbench shell

Implementation is paused after the source review: the native Session rightbar hides on global Home pages. The requested layout needs an additional extension or a changed requirement before implementation can resume; see the [Slot audit](APPFRAME_SLOT_AUDIT.md).

### Goal

Produce a Windows Desktop build with a distinctive Workbench shell, product navigation, execution/mode context, and a native Host that starts through an isolated Workbench profile.

### Prerequisites

- P0 approval.
- A clean package shape for the Workbench bundle and client entry.
- A product theme and localization inventory.
- A selected native `AppFrame` child-slot map.

### Source areas

`apps/desktop`, `apps/desktop-host`, `packages/boot/app-boot`, `packages/bundle/base`, `packages/client/modules`, `packages/client/ui-layout`, `packages/client/ui-slots`, `packages/client/ui-theme`, and `packages/client/ui-primitives`.

### Expected changes

- Add a Workbench bundle/profile composition.
- Add the Workbench client package and `dsh.client` entry.
- Contribute a leading rail, grouped sidebar, main region, and overlays inside `AppFrame`.
- Add semantic product tokens and localized shell copy.
- Preserve Desktop security settings and boot injection.

### Acceptance condition

A clean Windows home can select the Workbench profile and launch Desktop. The renderer shows Workbench navigation, reaches the private Host, survives a reload, and displays a recoverable boot error when the Host cannot start. Unloading the client package removes all shell registrations.

### Risk

Client modules can be invalidated by a Host release change. Shell work can accidentally duplicate route, focus, locale, or scope ownership from native `AppFrame`, increasing reload and accessibility failures.

-----

<a id="p2-session-and-activity"></a>
## P2: Session and activity

### Goal

Deliver one Workbench Session center that displays durable messages, live Assistant stream state, tool calls, subagents, jobs, and Agent status without maintaining a second conversation authority.

### Prerequisites

- P1 shell and resource scope routing.
- Confirmed native `session`, `subagents`, and `job` methods and their generated catalogs.
- A defined policy for live-only versus durable activity.

### Source areas

`packages/core/session`, `packages/core/agent-loop`, `packages/api/gateway`, `packages/client/connection`, `packages/client/ui-session`, `packages/subagents`, `packages/jobs`, and generated Typert artifacts.

### Expected changes

- Add the Workbench Session surface and route.
- Follow Session events and reconstruct from the native journal/snapshot path.
- Render Assistant stream frames as transient state and reconcile to `assistant/message` or `assistant/attempt`.
- Show tool calls, subagent activations, jobs, and approval waits with stable resource identity.
- Add Activity Center filters without changing the Session event model.

### Acceptance condition

Two clients can open one Session and converge on the same durable history after reconnect. A dropped stream does not create a completed message. A crashed renderer reconstructs from the Host. Activity views identify Host generation, Session, and event range, and dispose their subscriptions on Session close.

### Risk

Live stream rendering can race with durable settlement. Product projections can become stale across reconnect or access changes. A copied message store can diverge from the append-only Session source.

-----

<a id="p3-workspace-and-editor"></a>
## P3: Workspace and editor

### Goal

Provide a Workbench file workspace and editor experience backed by native Host file operations, with project navigation, tabs, file changes, and platform-correct save behavior.

### Prerequisites

- P1 resource scopes and P2 Session/workspace routing.
- Confirmed `workspace` and `workspaceFiles` methods, upload/download routes, and file access policy.
- An editor component decision that does not bypass Host file authority.

### Source areas

`packages/workspace`, `packages/fs`, `packages/client/ui-workspace`, `packages/client/ui-files`, `packages/client/file-upload`, `packages/client/ui-primitives`, and generated file APIs.

### Expected changes

- Add Workbench File Explorer, file tabs, viewer, and editable buffer.
- Route read, write, rename, upload, and delete through Host APIs.
- Show native workspace and file access state.
- Preserve unsaved buffers across panel changes and reconnect with explicit conflict handling.
- Add editor commands without exposing raw filesystem access.

### Acceptance condition

Files can be opened and saved on Windows without direct Renderer filesystem access. Concurrent external edits produce a recoverable conflict. Cancellation and access revocation stop the operation. Symlink and workspace-boundary behavior matches the Host's current file semantics.

### Risk

Editor buffers can overwrite newer Host content if revision and conflict rules are missing. Product tabs can retain files from an old workspace or Host generation. Large-file and binary handling need explicit limits.

-----

<a id="p4-terminal-and-jobs"></a>
## P4: Terminal and jobs

### Goal

Integrate persistent terminals and job activity into Workbench so users can follow execution, reconnect after reload, and cancel or stop owned work through native Host services.

### Prerequisites

- P1 layout and P2 activity state.
- Confirmed `terminal` and `job` methods.
- Windows ConPTY and persistent PowerShell behavior tested in the desktop carrier.

### Source areas

`packages/terminal`, `packages/subprocess`, `packages/jobs`, `packages/client/ui-terminal`, `packages/client/ui-jobs`, and Desktop process ownership.

### Expected changes

- Add terminal tabs and splits.
- Attach each terminal to a Workspace or Session context.
- Restore terminal state after renderer reload where the native service supports it.
- Show Job progress, output, cancellation, and failure.
- Tie process ownership to the active Host generation and execution world.

### Acceptance condition

A terminal starts in the correct workspace and shell, survives a renderer reload, and can be closed without orphaning processes. Job cancellation reaches the Host and records the native result. Window close follows readiness, graceful stop, timeout, and forced-stop behavior.

### Risk

Process ownership can outlive the UI. Terminal output can be lost on reconnect. WSL later introduces a separate process world that the Windows terminal host cannot assume.

-----

<a id="p5-approval-and-plugin-center"></a>
## P5: Approval and plugin center

### Goal

Give Workbench complete approval, question, plugin inventory, and plugin mutation UX while preserving fail-closed policy and privileged Host behavior.

### Prerequisites

- P1 shell and P2 activity input.
- Confirmed approval, question, `pluginInventory`, and `pluginManager` methods.
- A product copy and security review for privileged operations.

### Source areas

`packages/interaction/user-approval`, `packages/interaction/user-questions`, `packages/boot/plugin-manager`, `packages/client/modules`, `packages/client/ui-settings`, and API Remote access.

### Expected changes

- Add Approval Center and pending approval choice/input UI.
- Show decision history and question answers.
- Add plugin inventory, compatibility, source, and profile details.
- Implement guarded install, update, and remove flows.
- Display restart/reload outcomes, including `restart-required`.

### Acceptance condition

No client can answer outside its authorized scope. Unavailable answerers leave the operation blocked or denied. Plugin operation displays profile, source, full Git commit where applicable, requested effect, and approval state. A reload or restart requirement is visible and testable.

### Risk

Approval UI can appear authoritative while Host policy remains the real owner. Plugin code executes in-process; an unclear mutation path can elevate a user mistake into a Host-wide change.

-----

<a id="p6-work-and-code-orchestration"></a>
## P6: Work and Code orchestration

### Goal

Provide distinct Work and Code product presentations over the same Session, Agent, model, MCP, Skills, project, file, task, and permission system.

### Prerequisites

- P2–P5 surfaces are stable enough to compose.
- Shared Session switching does not lose identity or activity.
- Product presets have a durable, user-visible representation.

### Source areas

The Workbench client bundle, `packages/client/ui-layout`, `packages/client/ui-session`, product localization, and Host policy plugins where a preset changes admission.

### Expected changes

- Add mode navigation and default panel composition.
- Add Work-focused documents, tasks, activity, and approvals.
- Add Code-focused workspace, files, terminal, and tool activity.
- Make mode switches preserve the current Session and record any preset changes.
- Keep permission and environment controls shared across modes.

### Acceptance condition

A task moves between Work and Code presentations without changing its Session identity or duplicating durable history. A hidden panel does not grant or revoke a Host permission. A mode-specific tool or prompt preset is visible in the Session audit and compatible with reconnect.

### Risk

Product modes can drift into duplicate runtimes or ambiguous state. Hidden controls can create false assumptions about permission and environment.

-----

<a id="p7-wsl-execution-world"></a>
## P7: WSL execution world

### Goal

Design and later implement a complete Linux DSH Host in WSL2 that Windows Workbench can discover, launch, authenticate, route, recover, and shut down without exposing Linux paths to the renderer.

### Prerequisites

- Windows product slices and recovery paths are stable.
- A WSL distribution has supported Linux Node and pnpm installation.
- Endpoint discovery, authentication, and path policy are approved.
- A threat model covers local users, NAT, Host/Origin, cookies, and process supervision.

### Source areas

`apps/desktop`, `apps/desktop-host`, `packages/client/connection`, `packages/api/gateway`, `packages/api/remote-access`, `packages/workspace`, `packages/fs`, `packages/subprocess`, `packages/terminal`, and platform provider packages.

### Expected changes

- Add a Workbench Host adapter for WSL discovery and lifecycle.
- Define a private authenticated endpoint.
- Start the complete Linux DSH profile inside the distribution.
- Route Session, Workspace, Terminal, Files, and Job calls to the selected Host.
- Persist execution-world identity and recover after socket, Host, or VM loss.

### Acceptance condition

A Windows renderer connects to the WSL Host and completes a Session without importing Host logic into the browser. File and terminal operations use Linux Host APIs. Disconnect and Host restart reconcile from native Session data. No path is silently translated between worlds, and unauthenticated network access is rejected.

### Risk

NAT and localhost behavior, native module compatibility, duplicate process trees, credential leakage, path confusion, and crash recovery remain unresolved. The phase should remain blocked until its environment and security acceptance exist.

-----

<a id="p8-release-and-upstream-cadence"></a>
## P8: Release and upstream cadence

### Goal

Create a repeatable Workbench build, packaging, upgrade, and upstream-sync process that preserves the exact native baseline and product extension set.

### Prerequisites

- A product slice is stable enough to package.
- Host/client compatibility and plugin reload rules are tested.
- Release signing, update distribution, and supply-chain paths are selected.

### Source areas

`apps/desktop`, root build scripts, `scripts/release`, `pnpm-lock.yaml`, `packages/client/modules`, and release/update documentation.

### Expected changes

- Record upstream SHA, package version, Workbench version, and build environment.
- Add reproducible build and smoke-launch checks.
- Produce Windows artifacts with signing and update metadata.
- Add an upstream fetch/diff/rebase review routine that preserves original-fork refs.
- Document rollback and compatibility behavior.

### Acceptance condition

A clean machine can reproduce the build from the recorded inputs. A packaged Windows artifact launches, connects Host and renderer, and completes a smoke Session without developer tools. An upstream-sync review starts from a fresh SHA, reports affected areas, and runs the selected tests before landing.

### Risk

Binary mirrors, native modules, keys, and release automation can hide environmental dependencies. An unpinned upstream update can invalidate generated Typert artifacts, client modules, and extension assumptions.

-----

<a id="milestone-exit-criteria"></a>
## Milestone exit criteria

The product should not advance a phase solely because its UI compiles. Each milestone needs a clean-home setup, Host boot, renderer connection, ownership disposal, one failure/recovery path, and evidence at the same source commit.

| Milestone | User-visible result | Engineering proof |
|---|---|---|
| M1: Shell | Workbench launches on Windows | Profile boot, Host connection, native AppFrame integration |
| M2: Session | A native Agent conversation works in Workbench | Stream settlement, reconnect, restore, scope disposal |
| M3: Workspace | Files open and save through the Host | Access, conflict, cancellation, platform path tests |
| M4: Execution | Terminal and jobs are usable and recoverable | Process ownership, shutdown, job cancellation |
| M5: Safety | Approvals and plugins are reviewable and fail closed | Unauthorized answer refusal, commit pin, restart matrix |
| M6: Modes | Work and Code share one task identity | Shared Session, visible policy, mode switch recovery |
| M7: WSL | A separate Linux Host is reachable and recoverable | Discovery, auth, path map, crash, and shutdown tests |

-----

<a id="further-exploration"></a>
## Further Exploration

- [Workbench architecture](WORKBENCH_ARCHITECTURE.md) — review the architecture this plan implements.
- [Extension points](EXTENSION_POINTS.md) — select the contract for each phase.
- [Platform compatibility](PLATFORM_COMPATIBILITY.md) — confirm Windows and WSL boundaries.
- [Upstream sync report](UPSTREAM_SYNC_REPORT.md) — reproduce the baseline before phase work.

-----

<a id="dev-note"></a>
## Dev Note

None.
