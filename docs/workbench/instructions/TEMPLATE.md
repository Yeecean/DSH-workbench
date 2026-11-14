# Execution instruction | <YYYY-MM-DD-slug>

English | [中文](TEMPLATE.zh.md)

- Status: Proposed / Approved / Executed
- Requested by:
- Agent / environment:
- Baseline branch and starting point:
- Related architecture / ADR:
- Related roadmap milestone:
- Corresponding report: `workbench-reports/YYYY-MM-DD-slug/WORK_REPORT.md`

## Task objective

Describe the observable deliverables and the non-goals.

## Required reading confirmed before starting

Following `docs/workbench/AGENT_RULES.md`, list the base documents plus the task's architecture, ADR, specification, instruction, and historical reports; read each one before starting, and record the actual reading in the round's report.

## Authorized changes

List the files, modules, and dependency boundaries.

## Constraints that must not be broken

- Native DSH Agent/Session/Host/Client contracts come first; do not create a parallel Runtime without approval.
- Do not change signing, release, real-machine, credential, or sensitive-permission configuration without authorization.
- External research is reference only; it must not override the project's approved original architecture.
- Name the significant changes that need approval and the conditions that must stop the work.

## Execution steps

List the operations, outputs, and the rollback logic needed on failure, step by step.

## Acceptance criteria

List explicit checks for code, tests, Windows real-machine/simulated runs, data protection, CI, and so on. State any check that was not run.

## Delivery requirements

- Commit the work with a clear, logically independent subject; the commit body records the round's report path `Report: workbench-reports/YYYY-MM-DD-slug/WORK_REPORT.md` and a work summary.
- Fill in the round's `WORK_REPORT.md` with the changed files by project-relative path, the differences, and the evidence; the report must not embed commit SHAs.
- Mark failing or skipped tests, residual risks, and operations that were not authorized.
- Update the instruction and report indexes.

## Instruction revision history

| Date | Change | Reason / approver |
| --- | --- | --- |
| | | |
