# DSH Workbench agent execution rules

English | [中文](AGENT_RULES.zh.md)

These rules apply to all DSH Workbench tasks alongside the [repository rules](../../AGENTS.md) and [documentation rules](../AGENTS.md). `docs/workbench/DOCUMENTATION_GUIDE.md` owns the purpose and authority of project documents; this page defines agent execution requirements.

## Required reading

At the start of every task, agents must read the following base files and the materials relevant to the task; do not modify code after reading only a README.

1. The repository-root `AGENTS.md` and `docs/AGENTS.md`.
2. The project entry `WORKBENCH.md` and `docs/workbench/DOCUMENTATION_GUIDE.md`.
3. The [Workbench architecture](WORKBENCH_ARCHITECTURE.md), [development roadmap](DEVELOPMENT_ROADMAP.md), and task-relevant architecture designs, ADRs, and specifications.
4. `docs/workbench/instructions/README.md`, `docs/workbench/instructions/TEMPLATE.md`, and the actual instruction for the current task.
5. `workbench-reports/README.md`, `workbench-reports/TEMPLATE.md`, and relevant historical work reports.

Understand the product constraints, task phase, decision status, and prior outcomes before editing. The next section defines how to trace prior work; if an independent development or documentation-governance round has no instruction file, archive the user's actual authorization first, before other edits; record the files actually read in the report.

## Tracing prior work (required)

To learn the project's current state and past decisions, start from **git commit messages**, then follow the report path recorded in each message to the work report; never guess history from directory names, file names, or commit ids.

1. Browse the most recent messages first: `git log --oneline -n 30`; read full bodies with `git log -n 30 --format="%h%n%B"`.
2. Every functional commit body records `Report: workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md` plus a summary of that round, which identifies the round it belongs to.
3. Read that `WORK_REPORT.md` to confirm the round's goals, authorization, changed files, commands, and acceptance, then decide the scope of the current task.
4. A missing report path in a commit message, a missing report file, or a round absent from the indexes is a **traceability gap**: record the gap honestly in the report; do not invent content or guess history.

## Design, plans, and facts

Approved architecture and ADRs are the design basis; the roadmap and specifications state phase goals; the instruction defines the round's authorization; Git source and commit messages record the actual implementation and which round owns it; work reports and test evidence record verification and acceptance. Do not present proposals, pending ADRs, or plans as approved decisions or implemented facts.

Record differences between an implementation and approved design and follow the project's decision process; do not change the architecture for convenience. External projects, competitors, and upstream implementations are references only and do not override the project's original research or approved decisions.

## Instructions and reports

For each independent development or documentation-governance round, use `docs/workbench/instructions/TEMPLATE.md` to create `docs/workbench/instructions/YYYY-MM-DD-<slug>/INSTRUCTION.md`. Preserve the complete final instruction actually given to the agent, its goals, authorized scope, prohibitions, and acceptance criteria, and append later revisions. Do not leave the instruction only in conversation.

For each round, use the [report template](../../workbench-reports/TEMPLATE.md) to create `workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md`. Record the documents actually read, goals and authorized scope, baseline branch and starting point, actual branch, instruction path, the project-relative paths of every changed file in the round, verification environment, commands, results, evidence locations, design deviations, unfinished items, risks, and final acceptance.

Reports trace work through the **round directory** and the **project-relative paths of changed files**. Instructions, reports, and design deliverables must not embed commit SHAs, short hashes, or GitHub commit links; ids already recorded in historical rounds are replaced by the round's report path, and Git history itself carries the commit evidence.

Record actual commands, results, and test counts; state “count not provided” when a check does not supply one. Mark unrun checks `NOT_RUN` and report failures, timeouts, and skips; distinguish local-only from repository-archived evidence. Do not invent commits, test results, PR links, or screenshot paths; a report does not replace tests or security acceptance.

## Indexes and commits

At the end of each round, update `docs/workbench/instructions/README.md` and `workbench-reports/README.md`. Link the instruction and report to each other, make each new round discoverable in both indexes, and never link a nonexistent report. Mark missing original instructions in historical records without inventing their contents.

Give each commit one clear responsibility where practical; do not mix unrelated features, documentation, or fixes. Every commit message must state the round's report path and a work summary: the subject line is `<type>(workbench): <one-line responsibility>`, the body contains `Report: workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md`, followed by 1–3 lines on what changed and what was verified.

Do not overwrite historical work reports, fabricate commits, or rewrite Git history without authorization.

## Product and upstream isolation

Workbench uses a separate product branch structure. Without explicit user authorization, do not merge product code into the official DSH upstream, create product PRs in the official repository, target official branches for product feature merges, or change the product's relationship with upstream. An upstream update does not authorize automatic synchronization.

## Completion

An independent development or documentation-governance round is deliverable only after changes, applicable verification, commits, the work report, both indexes, remaining issues, and an acceptance conclusion are recorded. Mark unfinished or unverified items explicitly; finished code alone is not completion, and a report does not authorize production release or security-sensitive actions.
