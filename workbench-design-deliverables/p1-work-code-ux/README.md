# DSH Workbench Work / Code UX specification

English | [中文](README.zh.md)

Status: design baseline; design-only, not a claim that the production feature exists. Based on development commits on the `workbench-p1-shell-prototype` branch.

## Approved decisions
- The only top-level workspaces are **Work** and **Code**; there is no Home.
- Work: general agent work, research, file handling, analysis, documents, and deliverable handoff.
- Code: Repository, Coding Session, multi-panel development, Diff, Terminal, and debugging.
- Work UX follows the current unified task experience of Claude Desktop; Code UX follows Claude Code Desktop and absorbs the Codex parallel-agent, worktree, and diff-review patterns.
- The single current UI visual language: Apple macOS Design Language / Liquid Glass.
- English defaults to JetBrains Mono; Chinese defaults to 寒蝉半圆体; font switching stays available.
- Soft Editorial is recorded as future reference only; this stage neither implements nor mixes it.
- The old A/B prototype is a historical archive only and is not a visual or component baseline.

## Document map
- [Product UX and information architecture](PRODUCT_UX_SPEC.zh.md)
- [Work page specification](WORK_UX_SPEC.zh.md)
- [Code page specification](CODE_UX_SPEC.zh.md)
- [Component design specification](COMPONENT_DESIGN_SPEC.zh.md)
- [Apple visual system specification](APPLE_VISUAL_SYSTEM_SPEC.zh.md)
- [Open Design agent brief](OPEN_DESIGN_AGENT_BRIEF.zh.md)
- [Research references](RESEARCH_REFERENCES.zh.md)

## Architecture boundaries
Reuse the native DSH Agent Runtime, Session, Model Provider, Tools, MCP, Skills, permissions, Terminal, Files, and plugin lifecycle. Work / Code are two product presentations of one Runtime; never create two Runtimes or two Session histories. The right-side Inspector / Session tools keep the single-rail arbitration proposal; never create a second physical right rail. Browser, Worktree, Diff, Editor, Checkpoint, Scheduled Task, Artifact Preview, and similar capabilities must be audited at the API level first; prototype sample data does not mean the backend is connected.

## Prototype order
Build the two baseline screens, Work Empty and Code Focus, first; after user review, expand to Work Running / Waiting / Completed and Code Build / Review / Debug / Parallel Sessions, and finish with Appearance Settings and responsive states. This round changes no production code, Runtime, Electron launcher, or formal settings system.
