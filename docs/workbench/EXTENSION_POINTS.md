# Workbench Extension Points

English | [中文](EXTENSION_POINTS.zh.md)

## Summary

DeepSeekRuntime already exposes a layered set of extension mechanisms: Cordis services and events, scoped tool registration, LLM adapters, Session projections, interaction policy, bundles and profiles, Host/Client plugin packages, Typert Remote APIs, and client UI slots. A Workbench feature should use the narrowest mechanism that owns its decision and lifecycle. The source contracts below identify where product code belongs and which native behavior must remain unchanged.

## Table of Contents

- [Selection order](#selection-order)
- [Custom tools](#custom-tools)
- [Custom model routes](#custom-model-routes)
- [Custom Agent behavior](#custom-agent-behavior)
- [Session projections and activity](#session-projections-and-activity)
- [Approval and question policy](#approval-and-question-policy)
- [Host and Client plugin package](#host-and-client-plugin-package)
- [Bundle and profile composition](#bundle-and-profile-composition)
- [Typert Remote APIs](#typert-remote-apis)
- [Workspace, Terminal, Files, and Jobs](#workspace-terminal-files-and-jobs)
- [Client UI slots and theme](#client-ui-slots-and-theme)
- [Plugin inventory and mutation](#plugin-inventory-and-mutation)
- [Compatibility and recovery](#compatibility-and-recovery)
- [Validation requirements](#validation-requirements)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

-----

<a id="selection-order"></a>
## Selection order

Start with an existing capability call. If a native service exposes the operation, invoke that service. If the product needs to observe or influence a decision point, use the event or registration owned by that decision. If the product needs a new client presentation or route, add a client plugin. Add a product API only when Host state must be exposed to one or more clients.

| Need | Preferred extension | Native owner |
|---|---|---|
| Use an Agent, Session, file, terminal, job, setting, or plugin operation | Existing Host service or Typert API | Corresponding native package |
| Add a capability callable by the Agent | Scoped tool registration | `ctx.tools` |
| Add or route a model provider | LLM provider plugin or model selection policy | `ctx.llm`, Agent model selection |
| Change a turn decision or observe lifecycle | Documented Agent or capability event | Agent loop and owning service |
| Add model-visible derived content | Session message projection | `ctx.sessions` |
| Add product client screens | Client plugin and UI slot | Client Cordis and `ui-slots` |
| Expose new product Host state remotely | Typert Remote method or stream | Gateway and Remote access |
| Change a profile's plugin composition | Bundle patch and profile layer | App Boot |

The selection order prevents an ordinary feature from becoming a Runtime replacement. It also ensures cancellation, approval, access, persistence, and teardown stay with the service that already defines them.

-----

<a id="custom-tools"></a>
## Custom tools

Tools are capability registrations, not renderer shortcuts. A Workbench tool registers a schema and execution handler through `ctx.tools`; the Agent resolves the admitted schema for its selected model and invokes the tool inside the normal execution pipeline.

| Requirement | Current owner |
|---|---|
| Tool schema and model visibility | `ctx.tools` plus System Prompt assembly |
| Per-step admission | Agent loop tool-set resolution |
| Pre-execute, execute, and post-execute policy | Native tool execution events |
| Cancellation and result logging | Agent loop and Session events |
| Workspace and sandbox access | Native tool implementation and environment provider |

Read [Tools subsystem](../subsystems/tools.md), [`core/tools`](../../packages/core/tools/README.md), and the generated [tool catalog](../tool-catalog.md) before choosing an API. A custom tool should return a typed result and preserve the execution signal. It must not spawn unmanaged work that survives cancellation.

Tool-specific product examples include opening a Workbench panel, reading a product project record, or requesting an editor action. Shell, filesystem, terminal, MCP, and Skill work should check whether an official tool already owns the operation before adding another tool with overlapping authority.

-----

<a id="custom-model-routes"></a>
## Custom model routes

Model traffic belongs to the LLM service. A provider package implements the adapter contract under `ctx.llm`; a client or Session selects an available provider/model/effort before step preparation. The Agent loop fixes that selection before request construction, and `agent/request` cannot change it afterward.

| Control | Correct owner | Source |
|---|---|---|
| Provider adapter and stream | `ctx.llm` | [LLM streaming subsystem](../subsystems/llm-streaming.md) |
| Available models and metadata | Provider adapter registration | `packages/llm/*` |
| Route selection | `agent.model.select()` before step preparation | [agent.ts](../../packages/core/agent-loop/src/agent.ts), lines 289-323, 618-659 |
| Per-request controls | `agent/request` | [architecture.md](../architecture.md), line 114 |
| Retry policy | Provider call and `agent/request-error` | [agent.ts](../../packages/core/agent-loop/src/agent.ts), lines 547-569 |

**Source-inferred:** a Workbench model policy can observe Agent events, filter the model chooser, or choose a default route before a step. It must not mutate provider, model, or reasoning effort inside `agent/request`; the loop rejects that late change and directs callers to `agent.model.select()`.

A product router may select a route from project policy, data residency, capability, cost, or availability if the provider registry exposes the needed metadata. The selection must be recorded in Session-visible state. A route that changes silently across retries invalidates the meaning of the durable request history.

-----

<a id="custom-agent-behavior"></a>
## Custom Agent behavior

The Agent loop owns turn and step sequencing. Product policy attaches to events rather than copying that loop. A waterfall listener can annotate a decision and call `next()`, or intentionally short-circuit when it owns the policy. Serial and emit events have different ordering and must retain their documented semantics.

| Event or service | Product use | Constraint |
|---|---|---|
| `agent/pre-step` | Accept, rewrite, or reject claimed input; add admitted context | Waterfall; call `next()` when policy is not terminal |
| `agent/request` | Adjust allowed request controls | Provider, model, and effort are already fixed |
| `agent/request-error` | Apply retry policy | Must preserve cancellation and failure semantics |
| `agent/turn-stopping` | Inspect the stop boundary | Serial; no waterfall `next()` contract |
| `llm/stream` | Observe or transform provider stream according to contract | Must preserve stream frames and cancellation |
| `tools/pre-execute` | Apply tool policy before execution | Waterfall; preserve intended delegation |
| `tools/execute` | Wrap admitted execution | Must preserve signal and result identity |
| `tools/post-execute` | Observe or transform a settled result under contract | Preserve error and audit facts |

The exact generated event catalog is authoritative. A product listener must register through an owned Cordis effect and release it on unload. A malformed listener can affect every Agent in the Host, so a Workbench agent policy package should have a focused test suite and an explicit off switch in its profile.

Agent implementation replacement is valid only when the product needs a different `Agent` interface behavior that no event or service can provide. That change would require the same live events, Session events, cancellation, subagent, approval, and UI compatibility as the native loop.

-----

<a id="session-projections-and-activity"></a>
## Session projections and activity

Session events are the durable activity source. UI activity can observe live `agent/assistant-stream` frames for responsiveness, but the durable state reconciles from Session events. A plugin that changes existing message content registers a pure message projection; it does not rewrite stored events.

| Extension | Use | Source |
|---|---|---|
| Append a custom durable event | Product fact that must survive reload | `session.append()` and the event map |
| Observe Session events | Product timeline or follow stream | `session/event` and API follow methods |
| Observe transient Assistant stream | Low-latency rendering | `agent/assistant-stream` |
| Change model-visible message derivation | Plugin-owned pure projection | `ctx.sessions.registerMessageProjection()` |
| Recover pending input | Read `agent/inbox/spliced` projection | Native Inbox projection |

A Workbench Activity Center should label live-only and durable states differently. A stream chunk that disappears after a crash is not a completed message. A tool call is not a result until the corresponding Session event commits. Product-derived task status must identify the event range or projection generation that produced it.

-----

<a id="approval-and-question-policy"></a>
## Approval and question policy

Approval and questions already expose Host services and client interaction paths. Workbench should add a center for discovery, context, and response rather than a second permission layer. Unavailable answerers fail closed, and pending approval state is process-local while decisions are audited.

| Product behavior | Extension |
|---|---|
| Display pending approval | Native Approval API and client model |
| Approve or deny | Native Approval answer path |
| Ask or answer a user question | Native User Questions API |
| Add product policy | Approval policy plugin with explicit precedence |
| Show decision history | Session/audit event projection |

A product policy can require approval for a Workbench operation that would otherwise be automatic. It must not weaken a lower-level policy. If the Host or client cannot reach an answerer, the operation remains denied or blocked according to the native fail-closed rule.

-----

<a id="host-and-client-plugin-package"></a>
## Host and Client plugin package

A complete Workbench plugin can contain both halves. The Host entry is a Cordis plugin or service that registers Host capabilities. The package manifest declares its client entry under `dsh.client`, and the client module loads that entry into the renderer Cordis tree.

| Element | Host responsibility | Client responsibility |
|---|---|---|
| Package metadata | Host entry and service exports | `dsh.client` client entry |
| Lifecycle | Register Host services, events, tools, APIs | Register UI, stores, listeners, and routes |
| Authority | Filesystem, process, credential, and plugin operations | Presentation and user interaction only |
| Teardown | Dispose Host effects and owned resources | Dispose UI effects and stream/store scopes |
| Compatibility | Host release and Typert descriptor version | Client module and bootstrap compatibility |

The client half must not import Host implementation code into the browser. Communication goes through generated Typert Remote methods or streams. Shared pure types can be distributed through packages that have no Node-only dependency.

Read the [Plugin Manager README](../../packages/boot/plugin-manager/README.md) and [client modules README](../../packages/client/modules/README.md) before creating the package skeleton. A package that registers only a plain library API is not an installable profile plugin; classify the package by its manifest and entry behavior.

-----

<a id="bundle-and-profile-composition"></a>
## Bundle and profile composition

The Workbench bundle should add product rows to the native composition. A bundle exports a patch file and lets profiles stack it over `dsh-base`. A profile can add or replace rows, and users or deployments can overlay their own patches.

| Layer | Workbench use |
|---|---|
| `dsh-base` | Native Agent, Session, LLM, tools, persistence, policy, settings |
| Workbench bundle | Product Host API, policy, client module, and product rows |
| Workbench profile patch | Product defaults and selected presentation |
| Home patch | User environment and preference overrides |
| `--patch` overlay | Development, test, or deployment variation |

Bundle ownership should remain small and declarative. A change to one plugin's code belongs in its package. A change to which rows compose the product belongs in the bundle or profile patch. A deployment-specific host, port, credential, or path belongs in an overlay.

Profile patches replace a row's complete config. They must include every config field the target row requires, and a review should compare `dsh --profile <name> --dump-config` before and after the composition. Copying only one changed field into a replacement row can silently remove defaults.

-----

<a id="typert-remote-apis"></a>
## Typert Remote APIs

Typert is the supported Host/Client API pipeline. Business packages mark public Host methods with `@Remote`; scoped receiver methods use `@RemoteScope`. Generation produces input and result codecs, descriptors, client declarations, schemas, and resource metadata.

A product namespace is appropriate for Workbench-owned Host state, such as an execution-world registry or product workflow record. Native namespaces remain authoritative for Session, Workspace, Terminal, files, Jobs, Settings, credentials, commands, Skills, Plugins, and subagents.

| Requirement | Implementation |
|---|---|
| Call | `@Remote` on a public instance method |
| Scoped receiver | `@RemoteScope(key)` |
| Stream | `@Remote({ mode: 'stream' })` |
| Uplink | Declare the stream input and read the invocation uplink |
| Resource policy | Declare resource readers and register the owning resource kind |
| Failure | Throw `RemoteError` with a stable code and typed details |
| Client access | Use generated `ctx.remote` namespace methods |

Do not write a parallel request/response protocol, socket, or browser fetch wrapper for business calls. Use the existing HTTP unary path for calls and `/api/remote.mux` for logical streams. The native connection owns authentication, reconnect, request correlation, and stream lifecycle.

-----

<a id="workspace-terminal-files-and-jobs"></a>
## Workspace, Terminal, Files, and Jobs

These capabilities are especially sensitive to ownership because they cross the renderer, Host, operating system, and execution environment. Workbench UI should use their APIs and preserve Host policy.

| Capability | Confirmed native namespace | Workbench extension |
|---|---|---|
| Workspace selection and lifecycle | `workspace` | Product navigation and environment routing |
| Files | `workspaceFiles` | Tree, viewer, editor, save, upload, and diff UI |
| Terminal | `terminal` | Tabs, splits, task association, reconnect |
| Jobs and background work | `job` | Activity cards, progress, cancellation |
| Commands | `commands` | Command palette and execution entry |
| Skills | `skills` | Discovery and project-aware recommendations |
| Subagents | `subagents` | Tree, status, and stop controls |

A File Explorer must not read local paths directly from Chromium. It calls the Host file service so authentication, workspace scope, cancellation, and platform behavior apply. A Terminal panel attaches to Host terminal sessions and restores the correct Session or workspace context after reload.

-----

<a id="client-ui-slots-and-theme"></a>
## Client UI slots and theme

Client UI extensions are reversible Cordis registrations. Native `AppFrame` declares `sidebar`, keyed `main`, `rightbar`, `shell.bottom`, `shell.overlay`, and `shell.leading`. Their occupancy and scope differ: the native Session rightbar hides on global main panels, as detailed in the [Slot audit](APPFRAME_SLOT_AUDIT.md).

| Product surface | Recommended slot or client mechanism |
|---|---|
| Environment and mode rail | `shell.leading` or a sidebar occupant |
| Project and session navigation | `sidebar` |
| Main Work or Code surface | Keyed `main` |
| Agent activity and approvals | Session rightbar or `shell.bottom`; a persistent global Home rightbar needs a new extension |
| Command palette and modal flows | `shell.overlay` |
| Status and task progress | `shell.bottom` or a dedicated sidebar section |

Theme tokens should come from `ui-theme`, with product tokens added through the supported theme contract. A product component should use semantic tokens such as text, border, surface, accent, status, and focus rather than hard-coded global colors.

If a child-slot occupant needs Session, Workspace, or terminal scope, it must register inside the matching scope owner. UI state and effects should dispose with the slot registration. A component that remains mounted across Session changes must explicitly switch or dispose the underlying resource subscription.

-----

<a id="plugin-inventory-and-mutation"></a>
## Plugin inventory and mutation

Plugin inventory is suitable for product discovery. Plugin installation, removal, and updates are privileged Host operations because package code executes in-process outside the workspace sandbox. Git updates require a complete 40-character commit.

| Operation | Product requirement |
|---|---|
| Browse inventory | Show profile, package, version, source, state, and compatibility |
| Install | Name the profile and source; require the native approval path |
| Update | Pin a full commit for Git source; show the from/to state |
| Remove | Show dependent plugins and restart/reload impact |
| No-HMR result | Surface `restart-required` without claiming immediate completion |

The Workbench Plugin Center should not treat a package name or branch name as a content pin. It should preserve the Host's transaction result and display recovery steps if a release change requires restart.

-----

<a id="compatibility-and-recovery"></a>
## Compatibility and recovery

Host and client contracts can change independently across releases. A Host release update can invalidate loaded client modules, and a missing generated Typert descriptor can prevent a Product API from mounting. The client boot path detects release mismatch and can require reload.

Product extensions should record the native baseline SHA and required package versions in their build metadata. Runtime compatibility checks should fail with an actionable message that names the Host, product package, expected contract, and reload/restart action.

Reconnect uses the native connection generation and journal/snapshot semantics. A Workbench store must not keep writing to a disposed stream or assume the same collection baseline after reconnect. Session-follow and access-follow streams should be re-established from their native generation boundary.

-----

<a id="validation-requirements"></a>
## Validation requirements

Each extension point has its own proof:

| Extension | Required verification |
|---|---|
| Host service or event | Focused contract test plus load/unload disposal test |
| Tool | Schema generation, admission, execution, cancellation, and result logging |
| Model route | Provider stream, selection record, retry, and unavailable-provider behavior |
| Session projection | Deterministic derived messages after restore and replacement |
| Typert method or stream | Generated artifact, access policy, cancellation, reconnect, and error code |
| Client plugin | Route/slot render, locale, theme, focus, disposal, and Host reload behavior |
| Bundle/profile | `--dump-config` diff and profile boot in a clean home |
| Plugin mutation | Privilege/approval, full commit pin, and restart-required recovery |

Planned behavior remains a proposal until the owning test or executed product path exists. A successful typecheck does not prove lifecycle, authorization, recovery, or user-visible behavior.

-----

<a id="further-exploration"></a>
## Further Exploration

- [Native architecture audit](NATIVE_ARCHITECTURE_AUDIT.md) — read the runtime and process behavior behind these extension points.
- [Workbench architecture](WORKBENCH_ARCHITECTURE.md) — place extensions in the target product composition.
- [Platform compatibility](PLATFORM_COMPATIBILITY.md) — apply platform constraints to files, terminals, sandbox, and future WSL.
- [Development roadmap](DEVELOPMENT_ROADMAP.md) — order implementation and acceptance work.

-----

<a id="dev-note"></a>
## Dev Note

None.
