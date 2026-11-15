# Workbench execution instruction index

English | [中文](README.zh.md)

[Documentation policy](../DOCUMENTATION_GUIDE.md) · [Project entry](../../../WORKBENCH.md)

Each independent development round creates `YYYY-MM-DD-<slug>/INSTRUCTION.md` from the [template](TEMPLATE.md). It preserves the **final instruction actually delivered to the executing agent**, including later revisions; never backfill a work report into an instruction.

| Round | Instruction | Report | Status |
| --- | --- | --- | --- |
| 2026-11-14 documentation governance | Authorized by the conversation; no historical instruction file was invented | [Work report](../../../workbench-reports/2026-11-14-docs-governance/WORK_REPORT.md) | Documentation build-out; the instruction-archiving rule applies from this round |
| 2026-11-14 round 2 installer/updater | Historical instruction is not archived in the repository | [Work report](../../../workbench-reports/2026-11-14-round2-signing-installer-updater/WORK_REPORT.md) | Historical record retained; no instruction invented |
| 2026-11-14 · P8-S1 release-chain security hardening | [Detailed instruction](2026-11-14-p8-s1-signing-isolation/INSTRUCTION.md) | [Work report](../../../workbench-reports/2026-11-14-p8-s1-signing-isolation/WORK_REPORT.md) | S1 code and unit tests done (awaiting PR review); S2 hardware signing and real release remain disabled |
| 2026-11-14 · Agent governance rules | [Instruction](2026-11-14-agent-governance-rules/INSTRUCTION.md) | [Work report](../../../workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md) | Project-level agent rules and documentation traceability |
| 2026-11-15 · Report-path traceability | [Instruction](2026-11-15-report-path-traceability/INSTRUCTION.md) | [Work report](../../../workbench-reports/2026-11-15-report-path-traceability/WORK_REPORT.md) | Tracing becomes “commit message → report path → report”, with historical commit ids and documentation gates cleaned up |
| 2026-11-15 · Self-built plugin deliverable archive | [Instruction](2026-11-15-own-crafted-plugin-wsl-exec/INSTRUCTION.md) | [Work report](../../../workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/WORK_REPORT.md) | Archives the WSL2 execution plugin source, reports, evidence, and screenshots; commits and pushes after documentation gates pass |

Instructions from earlier rounds may still live in external conversations or locally; do not assume they are archived, and migrate them round by round after verification.
