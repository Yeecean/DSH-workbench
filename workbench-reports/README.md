# DSH Workbench work report index

English | [中文](README.zh.md)

[Documentation policy](../docs/workbench/DOCUMENTATION_GUIDE.md) · [Instruction index](../docs/workbench/instructions/README.md) · [Report template](TEMPLATE.md)

**The archive unit is the execution round, not a commit id.** Every functional commit is registered in its round's report by “project-relative paths of the changed files + the work + the verification evidence”, and its commit body states the round's report path; going from a commit to its report is the only entry point for understanding past work.

| Round | Report | Related instruction | Notes |
| --- | --- | --- | --- |
| 2026-11-14 documentation governance | [WORK_REPORT](2026-11-14-docs-governance/WORK_REPORT.md) | [Instruction index (authorized by the conversation)](../docs/workbench/instructions/README.md) | Project entry, documentation management, and templates |
| 2026-11-14 round 2 installer/updater | [WORK_REPORT](2026-11-14-round2-signing-installer-updater/WORK_REPORT.md) | Historical instruction not archived in the repository | Original implementation and acceptance record retained |
| 2026-11-14 P8-S1 release-chain security hardening | [WORK_REPORT](2026-11-14-p8-s1-signing-isolation/WORK_REPORT.md) | [INSTRUCTION](../docs/workbench/instructions/2026-11-14-p8-s1-signing-isolation/INSTRUCTION.md) | S1 policy gates, workflow isolation, and Manifest v2 (S2 disabled) |
| 2026-11-14 agent governance rules | [WORK_REPORT](2026-11-14-agent-governance-rules/WORK_REPORT.md) | [INSTRUCTION](../docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md) | Project-level agent execution rules, templates, and traceability indexes |
| 2026-11-15 report-path traceability | [WORK_REPORT](2026-11-15-report-path-traceability/WORK_REPORT.md) | [INSTRUCTION](../docs/workbench/instructions/2026-11-15-report-path-traceability/INSTRUCTION.md) | Tracing inverted to “commit message → report path → report”; historical commit ids and documentation gates cleaned up |

A round missing from this index is not proof it never existed; when backfilling, verify the actual files and command results, and never speculate or fabricate historical evidence.
