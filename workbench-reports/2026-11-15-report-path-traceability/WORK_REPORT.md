# 工作报告｜2026-11-15-report-path-traceability

- Status: PASS
- Baseline branch / starting point: `feature/p8-s1-windows-release-security`；起点为上一轮收尾时的分支状态，不记录 commit 编号。
- Actual branch: `feature/p8-s1-windows-release-security`
- Related instruction: [INSTRUCTION.md](../../docs/workbench/instructions/2026-11-15-report-path-traceability/INSTRUCTION.md)
- Related architecture / ADR / milestone: [Workbench 架构提议](../../docs/workbench/WORKBENCH_ARCHITECTURE.zh.md) · [全局右栏 ADR（提议中）](../../docs/workbench/GLOBAL_RIGHTBAR_ADR.zh.md) · [开发路线图](../../docs/workbench/DEVELOPMENT_ROADMAP.zh.md)；本轮为追溯方式与文档门禁治理，不改架构决策。
- PR URL: NOT_CREATED（本轮未授权创建 PR，也未推送）
- Report update date: 2026-11-15

## 目标、边界与授权

用户在本轮对话中直接批准三件事：把工作追溯的单位从 commit 编号改成“轮次报告目录 + 变更文件的项目相对路径”；让 agent 开工了解现状时必须先读提交信息，再顺着提交信息里的报告路径去读该轮工作报告；顺手清掉上一轮遗留的文档门禁红灯（链接、双语配对、硬换行、禁用词）。

授权范围包括规则、模板、两个索引、历史轮次报告、设计交付物、原型页面与 `apps/desktop` 发布脚本的改名。未授权的动作包括：合并回官方上游、创建官方 PR、推送、打 tag，以及任何真实签名、生产上传或发布。

## 实际阅读的文档依据

- 仓库规则：`AGENTS.md`、`docs/AGENTS.md`、`docs/i18n/README.md`、`docs/i18n/terminology.md`、`scripts/AGENTS.md`。
- 项目入口与决策：`WORKBENCH.md`、`WORKBENCH.zh.md`、`docs/workbench/DOCUMENTATION_GUIDE.zh.md`、`WORKBENCH_ARCHITECTURE.zh.md`、`DEVELOPMENT_ROADMAP.zh.md`、`GLOBAL_RIGHTBAR_ADR.zh.md`；架构文件与右栏 ADR 仍是提议，不作为已批准决策引用。
- 门禁源码：`scripts/verify-md-wrap.ts`、`verify-md-links.ts`、`verify-repository-references.ts`、`verify-concrete-terms.ts`、`verify-translation-pairing.ts`、`scripts/translation-pairing.ts`、`scripts/translation-links.ts`、`scripts/doc-budgets.manifest.json`、`scripts/run-gates.ts`。
- 既有轮次：`docs/workbench/instructions/` 与 `workbench-reports/` 下 2026-11-14 的四轮指令与报告、两个索引与模板。

## 追溯规则的具体改动

规则的含义变了：一份报告不再回答“这是哪个提交”，而是回答“这一轮改了哪些文件”，提交信息只负责把读者送到报告。

- 新增必做的开工追溯步骤：先 `git log --oneline -n 30` 读提交信息，找到每条提交里的 `Report:` 行，据此打开该轮 `WORK_REPORT.md`；提交没有报告路径、报告不存在或索引里查不到该轮，一律记为追溯缺口，不用猜测补齐。
- 提交信息格式固定为 `<type>(workbench): <一句话职责>`，正文写 `Report: workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md` 和一到三条工作内容摘要。
- 指令、报告和设计交付物不再出现 commit 编号、短哈希或 GitHub 提交链接；需要指代历史轮次时写轮次报告路径。
- 报告模板的“提交与变更映射”以提交主题、变更目的、变更文件（项目相对路径）、验证证据四列记录，反向查询用 `git log -- workbench-reports/YYYY-MM-DD-slug/`。

## 提交与变更映射

| 提交主题 | 变更目的和工作内容 | 变更文件（项目相对路径） | 验证证据编号及验收状态 |
| --- | --- | --- | --- |
| docs(workbench): trace work through report paths and clear documentation gates | 反转追溯规则（提交信息 → 报告路径 → 报告）、清理历史提交编号、清掉链接/双语配对/硬换行/禁用词门禁红灯、把构建来源字段改名为 buildIdentity | 见下方「本轮文件清单」 | V1–V3 全部通过；V4 NOT_RUN |

**说明**：报告以轮次目录和变更文件的项目相对路径作为追溯单位，不记录 commit SHA、短哈希或提交链接。本轮全部改动在一个提交内完成；提交主题行见上表。核对提交时用 `git log -- workbench-reports/2026-11-15-report-path-traceability/` 找出引入本报告的提交。

## 本轮文件清单（项目相对路径）

规则与模板：

- `docs/workbench/AGENT_RULES.md`、`docs/workbench/AGENT_RULES.zh.md`、`docs/workbench/AGENT_RULES.i18n.yaml`
- `docs/workbench/instructions/TEMPLATE.md`、`docs/workbench/instructions/TEMPLATE.zh.md`、`docs/workbench/instructions/TEMPLATE.i18n.yaml`（原 `TEMPLATE.md` 中文内容移入 `TEMPLATE.zh.md`，新建英文 `TEMPLATE.md`）
- `workbench-reports/TEMPLATE.md`

索引与入口：

- `docs/workbench/instructions/README.md`、`README.zh.md`、`README.i18n.yaml`（原中文 `README.md` 改名为 `README.zh.md`，新建英文 `README.md`）
- `workbench-reports/README.md`、`README.zh.md`、`README.i18n.yaml`（同上改名方式）
- `WORKBENCH.md`、`WORKBENCH.zh.md`
- `README.zh.md`（根入口 banner 与英文侧链接序列对齐）

本轮指令与报告：

- `docs/workbench/instructions/2026-11-15-report-path-traceability/INSTRUCTION.md`、`INSTRUCTION.zh.md`、`INSTRUCTION.i18n.yaml`
- `workbench-reports/2026-11-15-report-path-traceability/WORK_REPORT.md`

历史轮次清理：

- `workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md`
- `workbench-reports/2026-11-14-docs-governance/WORK_REPORT.md`
- `workbench-reports/2026-11-14-p8-s1-signing-isolation/WORK_REPORT.md`
- `workbench-reports/2026-11-14-round2-signing-installer-updater/WORK_REPORT.md`
- `docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md`、`INSTRUCTION.zh.md`、`INSTRUCTION.i18n.yaml`
- `docs/workbench/instructions/2026-11-14-p8-s1-signing-isolation/INSTRUCTION.md`、`INSTRUCTION.zh.md`（原中文 `INSTRUCTION.md` 改名）、`INSTRUCTION.i18n.yaml`
- `workbench-design-deliverables/p1-work-code-ux/README.md`、`README.zh.md`、`README.i18n.yaml`
- `workbench-design-deliverables/p1-work-code-ux/prototype/screens/code-focus.html`

双语配对与链接：

- `docs/workbench/DOCUMENTATION_GUIDE.md`、`DOCUMENTATION_GUIDE.zh.md`、`DOCUMENTATION_GUIDE.i18n.yaml`
- `workbench-design-deliverables/p1-shell/README.md`、`README.zh.md`、`README.i18n.yaml`
- `workbench-design-deliverables/p1-shell/open-design-project/dsh-workbench-p1-shell/README.md`、`README.zh.md`、`README.i18n.yaml`
- `workbench-design-deliverables/p1-shell/workspace-design-index/README.zh.md`、`README.i18n.yaml`
- `packages/client/ui-workbench/README.md`、`README.zh.md`、`README.i18n.yaml`
- `README.i18n.yaml`

构建身份字段改名（`apps/desktop`，纯改名，无行为变更）：

- `apps/desktop/scripts/desktop-release-store.ts`、`desktop-publish-route.ts`、`desktop-upload-plan.ts`、`publish-desktop-ci.ts`
- `apps/desktop/tests/desktop-release-store.spec.ts`、`desktop-publish-route.spec.ts`、`desktop-upload-plan.spec.ts`、`desktop-rollout.spec.ts`、`publish-website-ci.spec.ts`

## 验证证据

| 证据编号 / 类别 | 环境 / 实际命令 | 结果、退出码及通过 / 失败 / 跳过数量 | 证据位置及保存范围 |
| --- | --- | --- | --- |
| V1 / 文档门禁总闸 | Windows x64；Node `v24.16.0`、pnpm `11.28.5`；`pnpm run test:docs`（doc-quick 聚合，21 个门禁） | PASS；exit 0；21 passed / 0 failed / 0 skipped，37.84s（提交前最终复跑，新增文件已纳入门禁语料） | 本机终端输出 |
| V1a / 单项复核 | `pnpm run verify-md-links` / `verify-md-wrap` / `verify-concrete-terms` / `verify-repository-references` / `verify-translation-pairing` / `verify-doc-budgets` | 全部 PASS：links 2615 文件；wrap 2652 文件；concrete-terms 无禁用词；repository-references 无违规引用；pairing 1308 对全一致；doc-budgets 7 个受控文档未超限 | 本机终端输出 |
| V2 / 单元测试 | `pnpm exec vitest run apps/desktop/tests/desktop-release-store.spec.ts desktop-publish-route.spec.ts desktop-upload-plan.spec.ts desktop-rollout.spec.ts publish-website-ci.spec.ts` | PASS；5 个测试文件、93 passed / 0 failed，7.58s | 本机终端输出 |
| V3 / 类型检查 | `pnpm run typecheck` | PASS；5 passed / 0 failed / 0 skipped，32.31s | 本机终端输出 |
| V4 / 真实设备/安装/升级 | 未执行 | NOT_RUN | 真实 EV 签名、生产上传与 OTA 联调未授权，沿用上一轮 BLOCKED 记录 |

说明：文档门禁与配对记录均以工作树当前内容为准；未提供计数的检查已按原文记录。

## 风险与遗留问题

- 追溯链依赖人守规则：规则写进了 `AGENT_RULES`，但外部 agent 是否真的先读提交信息、再读报告，仓库只能在下一次审查时抽查，无法机械保证。
- 历史轮次只移除提交编号，不改写当时的事实、验证结果与遗留项；历史报告中出现的旧文件名（如 `instructions/README.md`）指向现在的中文侧文件，语义仍在同一轮。
- 构建身份字段改名是源码级改名，未做真实 EV 签名、生产上传和 OTA 联调；P8-S1 的真实签名与发布仍是 NO。
- 本轮未跑 P8-S1 的真实签名链路与工作流实机验证，相关结论沿用上一轮的 NOT_RUN / BLOCKED 记录。
- 设计交付物快照 `workbench-design-deliverables/p1-shell/workspace-design-index` 的中文侧相对链接按副本内实际存在的文件对齐为无后缀路径，与原目录 `docs/workbench/design/p1-shell` 的写法存在这一处差异。

## 验收结论

PASS：规则、模板、索引、历史轮次清理、双语配对与门禁修复全部落地；`pnpm run test:docs` 21 个门禁全绿，桌面发布相关 93 个用例与 `pnpm run typecheck` 全绿；所有变更文件按项目相对路径登记在本报告中，未执行的真实签名与发布已标记 NOT_RUN。本轮不具备也不声称任何生产发布授权。
