# Workbench execution instruction | 2026-11-15-report-path-traceability

English | [中文](INSTRUCTION.zh.md)

- Status: Approved by the user; executed in this round.
- Requested by: The user in this conversation.
- Agent / environment: DSH agent on Windows x64; Node `v24.16.0`, pnpm `11.28.5`.
- Baseline branch and starting point: `feature/p8-s1-windows-release-security`; the starting point is the branch state where the previous round closed, recorded without commit identifiers.
- Related architecture / ADR: [Workbench architecture proposal](../../WORKBENCH_ARCHITECTURE.md); no architecture change is authorized.
- Related roadmap milestone: [Workbench roadmap](../../DEVELOPMENT_ROADMAP.md); this is a traceability and documentation-gate task, not P8-S1 implementation.
- Corresponding report: [WORK_REPORT.md](../../../../workbench-reports/2026-11-15-report-path-traceability/WORK_REPORT.md).

## Task objective

Replace commit identifiers as the unit of work traceability with the round report directory plus the project-relative paths of the files changed in that round, and make the agent rules say so. Anyone asking what a change did reads the commit message, follows the `Report:` path it carries into the round report, and reads the changed files there by project-relative path instead of by commit number.

## Work boundaries and authorization

The user approved this scope in this conversation: reverse the traceability rule, clean the historical commit identifiers, and clear the documentation gates the previous round left red. Editing the rules, templates, indexes, historical rounds, design deliverables and desktop release code named in the report is authorized. Merging to the official upstream, creating an official pull request, pushing, tagging, and any real signing or publishing action are not authorized.

## Required changes

1. Add a required tracing step to the [workbench rules](../../AGENT_RULES.md) and mirror it on the Chinese side: read recent commit messages first, follow each `Report:` line into the round report, and record a gap when a commit carries no report path or the report is missing.
2. Change the [instruction template](../TEMPLATE.md) and the [report template](../../../../workbench-reports/TEMPLATE.md) so a round records its baseline branch and starting point plus the files it changed by project-relative path, and states the commit message format that names the report path with one to three work summaries.
3. Remove commit identifiers from the historical instructions, reports, design deliverables and prototype screens named in the work report, and replace them with round report paths or plain descriptions.
4. Rename the manifest v2 build-origin record to `buildIdentity` across `apps/desktop/scripts` and its tests so the forbidden-term gate passes and the field name states the exact thing it records.
5. Complete the bilingual pairs, link fixes and hard-wrap fix the previous round reported as red, and record every pair with the repository pairing command.
6. Record the round in the [instruction index](../README.md) and the [report index](../../../../workbench-reports/README.md), then rerun the documentation gates until the previously red checks are green.

## Evidence and acceptance

Acceptance requires `pnpm run test:docs` green, the individual wrap, link, repository-reference, concrete-term, translation-pairing and document-budget checks passing, the affected desktop tests and typecheck passing, and the work report listing every changed file by project-relative path with the exact commands and results. Any check that was not run is recorded as `NOT_RUN`.

## Out of scope

- Real hardware EV signing, certificate use, production upload and OTA publishing.
- Merging to the official upstream, creating an official pull request, or rewriting history.
- Widening the P8-S1 signing policy or re-enabling `signed` packaging.
- Changing desktop release behavior beyond the `buildIdentity` rename.
