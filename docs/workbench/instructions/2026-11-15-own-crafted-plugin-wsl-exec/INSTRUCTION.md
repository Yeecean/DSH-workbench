# Workbench execution instruction | 2026-11-15-own-crafted-plugin-wsl-exec

English | [中文](INSTRUCTION.zh.md)

- Status: Approved by the user; executed in this round.
- Requested by: The user in this conversation.
- Agent / environment: DSH agent on Windows x64; Node `v24.16.0`, pnpm `11.28.5`.
- Baseline branch and starting point: `feature/p8-s1-windows-release-security`; the starting point is the branch state where the previous round closed, recorded without commit identifiers.
- Related architecture / ADR: None; this round changes no product architecture or runtime contract.
- Related roadmap milestone: None; this round archives a self-built plugin deliverable and implements no P0–P8 roadmap item.
- Corresponding report: [WORK_REPORT.md](../../../../workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/WORK_REPORT.md).

## Task objective

Archive the already verified WSL2 execution environment plugin `@local/dsh-wsl-exec` into `Own-Crafted-Plugin/`: plugin source, delivery report, actual behavior and verification evidence, and selected real-desktop screenshots; create this round's instruction and work report, update both indexes, then commit and push.

## Pre-execution reading confirmation

Following the [Workbench rules](../../AGENT_RULES.md), read `AGENTS.md`, `docs/AGENTS.md`, the [documentation policy](../../DOCUMENTATION_GUIDE.md), the [project entry](../../../../WORKBENCH.md), the instruction and report templates, both indexes, and the previous round's report; record the actual reading in the same round's report.

## Allowed modification scope

`Own-Crafted-Plugin/**` (new archive content), `docs/workbench/instructions/2026-11-15-own-crafted-plugin-wsl-exec/**`, `workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/**`, the two workbench indexes, and their bilingual pairing records.

## Non-negotiable constraints

- Do not modify product source under `packages/` or `apps/`, the desktop installation directory, or `app.asar`.
- Do not commit secrets, tokens, real device identifiers, or sensitive logs.
- Do not change the native DSH Agent/Session/Host/Client contracts or create a parallel Runtime.
- Do not create an official upstream PR or rewrite Git history without authorization; this round only commits and pushes the current product branch as the user directed.

## Execution steps

1. Copy the plugin source, reports, evidence, and screenshots from the default workspace into `Own-Crafted-Plugin/`, and fix relative links for the archived layout.
2. Create this round's instruction and work report, recording actual reading, changed files, verification evidence, and remaining issues per the templates.
3. Update both indexes, complete the bilingual pairs, and re-record them.
4. Run the documentation gates and plugin syntax checks, then commit and push after confirming there are no failures.

## Acceptance criteria

- `Own-Crafted-Plugin/` lets a reader access the plugin source, delivery report, evidence summary, and at least five screenshots without leaving the directory.
- `pnpm run test:docs` passes; the new Markdown passes wrap, link, and bilingual pairing checks.
- The plugin source passes `node --check` (`index.js`, `client.js`).
- The work report lists every changed file by project-relative path and marks failed or unrun items honestly.
- The commit title is `<type>(workbench): <one-line responsibility>`, and its body contains this round's report path.

## Delivery requirements

- Commit and push to `origin/feature/p8-s1-windows-release-security`.
- Fill in the same round's `WORK_REPORT.md` without commit SHAs or commit links.
- Mark unrun items, residual risks, and unauthorized operations.
- Update the instruction and report indexes.

## Instruction revision record

| Date | Change | Reason/approver |
| --- | --- | --- |
| 2026-11-15 | Created this round's instruction | The archiving and commit directive the user gave in this conversation |
