# DSH Workbench

English | [中文](WORKBENCH.zh.md)

> This is the **DSH Workbench product entry point**, separate from the upstream DeepSeek Harness [README](README.md).

DSH Workbench is a desktop agent workbench built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), presenting **Work** and **Code** modes over one native Agent/Session runtime. The product owns the shell, UX, and orchestration; DSH retains the native Agent, Session, Tool, MCP, Skill, Host/Client, and plugin contracts.

## Navigation

| Path | Purpose |
| --- | --- |
| `apps/desktop/` | Electron desktop, packaging, installer |
| `packages/client/ui-workbench/` | Workbench-specific interface |
| `packages/` | Native DSH packages and plugin ecosystem |
| `docs/workbench/` | Workbench architecture and planning |
| `docs/workbench/instructions/` | Versioned execution-agent instructions |
| `workbench-reports/` | Implementation, commit, verification and acceptance evidence |

Read the [agent execution rules](docs/workbench/AGENT_RULES.md), [documentation policy and index](docs/workbench/DOCUMENTATION_GUIDE.md), [architecture](docs/workbench/WORKBENCH_ARCHITECTURE.md), [roadmap](docs/workbench/DEVELOPMENT_ROADMAP.md), [instruction index](docs/workbench/instructions/README.md), and [report index](workbench-reports/README.md).

**Source of truth:** A roadmap or old phase-baseline document does not establish current implementation status. Verify the active branch, commits, source, tests, and acceptance evidence.

Keep native contracts authoritative; avoid a duplicate Agent Loop, Session Store, or RPC stack. Third-party UX/architecture research must not supersede the project's original architecture and recorded decisions. Follow the [documentation policy](docs/workbench/DOCUMENTATION_GUIDE.md) for every substantive change.

For upstream setup and developer instructions, see [README.md](README.md) and [docs/development.md](docs/development.md).
