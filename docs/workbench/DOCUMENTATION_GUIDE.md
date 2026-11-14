# Workbench documentation system and traceability policy

English | [中文](DOCUMENTATION_GUIDE.zh.md)

> Scope: DSH Workbench changes made in this fork. Upstream DSH documentation, its existing translations, and its synchronization rules are preserved; this policy does not require rewriting upstream files.

## 1. Information layers and authority

| Layer | File or directory | What it records | Judgment boundary |
| --- | --- | --- | --- |
| Product entry | [WORKBENCH.md](../../WORKBENCH.md) | Positioning, boundaries, navigation | Does not replace the upstream README |
| Architecture | [WORKBENCH_ARCHITECTURE.md](WORKBENCH_ARCHITECTURE.md), [EXTENSION_POINTS.md](EXTENSION_POINTS.md), approved ADRs | Original design principles, responsibilities, interfaces, decisions | **Design authority**; a research reference cannot override it |
| Planning | [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md), topic specifications | Plans, dependencies, acceptance criteria | **Goal**, not a fact about the current implementation |
| Instructions | [instructions/](instructions/README.md) | Agent input, authorized scope, and constraints for each round | Must not change architecture on their own authority |
| Implementation | Git commit / diff | The code actually committed | **Code fact**, reviewed against an explicit SHA and branch |
| Evidence | [workbench-reports/](../../workbench-reports/README.md) | Test commands, results, screenshot and log paths, issues | **Verification fact**; a report never stands in for run evidence |
| Acceptance | Acceptance conclusion in the same round's report, or an independent review | Pass, conditional pass, blocked, residual risk | "Tests passed" is never inferred as "release approved" |

**Conflict handling**: the implementation follows the source at the corresponding SHA; the intended design follows the approved architecture and ADRs; when the two disagree, record the deviation and the decision instead of silently rewriting the architecture to match current state.

## 2. Fixed directories and naming

```text
WORKBENCH.md / WORKBENCH.zh.md
docs/workbench/
  DOCUMENTATION_GUIDE.zh.md
  WORKBENCH_ARCHITECTURE*.md     # 保留现有主架构
  DEVELOPMENT_ROADMAP*.md        # 保留现有 P0–P8 路线
  instructions/
    README.md
    TEMPLATE.md
    YYYY-MM-DD-<slug>/INSTRUCTION.md
workbench-reports/
  README.md
  TEMPLATE.md
  YYYY-MM-DD-<slug>/WORK_REPORT.md
  YYYY-MM-DD-<slug>/VERIFICATION.md   # 可选，报告较长时拆分
  YYYY-MM-DD-<slug>/artifacts/        # 可选，轻量、脱敏证据
```

Naming uses **execution rounds** as the unit and never requires a commit SHA in a directory name: a commit cannot know its own SHA before it exists. One round may contain several commits, but the report must list every commit's full SHA, change scope, and verification mapping. A report may be committed with the implementation and receive its final SHA in a later commit; never fabricate, guess, or self-reference a commit SHA.

## 3. Change loop (required)

1. **Planning and decision**: state the architecture, milestone, and ADRs relied on; to change a native boundary, submit a separate ADR for approval first.
2. **Before execution**: create a standalone `INSTRUCTION.md` from the [instruction template](instructions/TEMPLATE.md) that fixes the scope, prohibitions, acceptance criteria, rollback plan, and authorization conditions. Keep the final version sent to the Agent, and append a revision record for any change made mid-round.
3. **During execution**: keep each commit to one responsibility; the commit message states the intent; never record unverified conclusions as facts.
4. **After commit**: fill in a report from the [work report template](../../workbench-reports/TEMPLATE.md) that links the instruction path, the actual branch, every commit's full SHA, the file changes, verification and failures, residual issues, and evidence locations.
5. **Review**: record `PASS / CONDITIONAL / FAIL / NOT_RUN` with the reason. Permission-sensitive, signing, and official release work needs its own security gate; a merged report is not an approval.
6. **Update the indexes**: add each new round to the [instruction index](instructions/README.md) and the [report index](../../workbench-reports/README.md); link the actual PR or commit and keep earlier records from being overwritten.

**Minimum requirement**: every functional commit must be traceable from its round report to the execution instruction and its verification state; formatting-only or documentation-maintenance commits may share the round report but must still list their SHA or say that it is pending backfill.

## 4. Evidence and security constraints

- Distinguish **plan, code change, unit test, integration test, real-environment acceptance, and not-run items**.
- Record re-runnable commands, the runtime environment, result counts, failure and skip reasons, and actual log locations; mark uncommitted local evidence as "this machine only" and never claim the repository stores it.
- Never commit tokens, PINs, keys, user privacy, real device identifiers, or sensitive logs; keep large build artifacts in a controlled CI Artifact or Release and record their SHA-256.
- Never let documentation work change the Git branch strategy, the original upstream README content, production signing configuration, or release switches on its own.
- Prefer incremental indexing of existing directories; keep old reports in place, cross-link them where useful, and never invent missing historical instructions.

## 5. Document status and maintenance

A document header should state `Status: Proposal / Approved / Implemented / Superseded`, `Owner`, `Updated`, and `Related`. A document is a Proposal until its ADR is approved; historical baseline material is kept with the time range it applies to stated clearly. Native multilingual documents keep their existing i18n workflow; when a new Chinese governance document needs an English version, add it through the repository convention.
