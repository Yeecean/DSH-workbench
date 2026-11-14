# 工作报告｜2026-11-14-agent-governance-rules

- Status: CONDITIONAL（本轮定向验证通过；仓库级文档检查存在下列失败项）
- Baseline branch / starting point: `feature/p8-s1-windows-release-security`（起点为当轮开工时的分支状态；按 2026-11-15 报告路径追溯规则，本报告不保留 commit 编号）
- Actual branch: `feature/p8-s1-windows-release-security`
- Related instruction: [INSTRUCTION.md](../../docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md)
- Related architecture / ADR / milestone: [Workbench 架构提议](../../docs/workbench/WORKBENCH_ARCHITECTURE.zh.md) · [全局右栏 ADR（提议中）](../../docs/workbench/GLOBAL_RIGHTBAR_ADR.zh.md) · [开发路线图](../../docs/workbench/DEVELOPMENT_ROADMAP.zh.md)；本轮为跨阶段文档治理。
- PR URL: NOT_CREATED（本轮未授权创建 PR）
- Report update date: 2026-11-15；目录名按用户指定保留 2026-11-14。

## 目标、边界与授权

建立 Workbench agent 强制阅读、决策权威、指令与报告追溯、提交及上游隔离规则，并更新入口、模板和两个索引。用户追加要求直接使用当前分支，按仓库实际情况修正指令中的不准确之处。本轮不修改运行时代码、P8-S1 代码、工作流、签名配置、发布流程或既有工作报告，不合并、重写历史、推送上游或创建 PR。

## 实际阅读的文档依据

- 仓库规则：`AGENTS.md`、`docs/AGENTS.md`、`docs/i18n/README.md` 和 `docs/i18n/terminology.md`。
- 项目入口与决策：`WORKBENCH.md`、`WORKBENCH.zh.md`、`docs/workbench/DOCUMENTATION_GUIDE.zh.md`、`WORKBENCH_ARCHITECTURE.zh.md`、`DEVELOPMENT_ROADMAP.zh.md`、`GLOBAL_RIGHTBAR_ADR.zh.md`。架构文件及该 ADR 标为提议，不作为已批准决策。
- 指令与报告：`docs/workbench/instructions/README.md`、`TEMPLATE.md`、本轮 `INSTRUCTION.md`，以及 `workbench-reports/README.md`、`TEMPLATE.md`、文档治理和 P8-S1 两轮 `WORK_REPORT.md`。
- 文档与 agent 指令设计：`dsh-doc-writing`、`dsh-prose-standard`、`agent-experience` 及其工具设计参考；本轮不涉及功能实现，未将具体功能 ADR 的提议视为授权。

## 提交与变更映射

| 提交主题 | 变更目的和工作内容 | 变更文件（项目相对路径） | 验证证据编号及验收状态 |
| --- | --- | --- | --- |
| `docs(workbench): establish agent governance rules` | 建立本轮治理规则、入口、模板、指令、报告及索引 | 见下方「本轮文件清单」 | V4、V5、V8、V10、V11 为 PASS；V6、V7 为 FAIL，见验收结论 |
| `docs(workbench): record governance commit evidence` | 回填提交前检查结果、hook 结果与本条记录 | `workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md` | 该提交的暂存差异检查与 hook 结果记录在提交信息中 |

**说明**：提交与轮次报告的对应关系由提交信息的 `Report:` 行和 `git log -- workbench-reports/2026-11-14-agent-governance-rules/` 双向确定，不再在文档中记录 commit 编号。

## 实现与设计偏差

规则区分已批准架构与提案：现有 Workbench 主架构和全局右栏 ADR 均标为提议，不能笼统称为已批准。按仓库双语规则为本轮新建的 `docs/` 文档添加对侧文件和配对记录；原始中文用户指令作为原文保留。历史缺失指令只标记缺口，不补造。

本轮文件清单：

- 根入口：`AGENTS.md`、`WORKBENCH.md`、`WORKBENCH.zh.md`。
- 项目规则：`docs/workbench/AGENT_RULES.md`、`AGENT_RULES.zh.md`、`AGENT_RULES.i18n.yaml`。
- 执行指令：`docs/workbench/instructions/README.md`、`TEMPLATE.md`、本轮目录下 `INSTRUCTION.md`、`INSTRUCTION.zh.md`、`INSTRUCTION.i18n.yaml`。
- 工作报告：`workbench-reports/README.md`、`TEMPLATE.md`、本轮目录下 `WORK_REPORT.md`。

## 验证证据

环境：Windows x64，Node `v24.16.0`，pnpm `11.28.5`。以下输出为本次本机命令会话输出，未在仓库归档原始日志；命令结果与数量如实摘录。

| 证据编号 / 类别 | 环境 / 实际命令 | 结果、退出码及通过 / 失败 / 跳过数量 | 证据位置及保存范围 |
| --- | --- | --- | --- |
| V1 / 基线双语检查 | 修改前 `pnpm run verify-translation-pairing` | FAIL，exit 1；10 条既有诊断，包括 Workbench 治理文件缺配对及根 README 配对记录失步。 | 本机命令会话；未归档原始日志 |
| V2 / 基线链接检查 | 修改前 `pnpm run verify-md-links` | FAIL，exit 1；2 条既有链接诊断，均为 `packages/client/ui-workbench/README` 的配置目录锚点。 | 本机命令会话；未归档原始日志 |
| V3 / 基线引用检查 | 修改前 `pnpm run verify-repository-references` | FAIL，exit 1；10 条既有诊断，包括历史指令和报告中的完整 commit SHA。 | 本机命令会话；未归档原始日志 |
| V4 / 新文档双语检查 | `pnpm run verify-translation-pairing docs/workbench/AGENT_RULES.md docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md` | PASS，exit 0；2 组配对一致。 | 配对记录已归档在两组文档旁；本机命令会话 |
| V5 / 本轮链接与索引检查 | 见下方实际命令；另检查三个入口及本轮指令与报告的双向引用。 | PASS，exit 0；12 个 Markdown 文件、0 条断链；4 份报告及 2 份指令、0 项索引缺失；3 个入口及 2 个双向引用、0 项缺失。 | 本机命令会话；未归档原始日志 |
| V6 / 文档快速检查 | `pnpm run test:docs` | FAIL，exit 1；最终复跑 16 项通过、5 项失败、0 项跳过。首次为 15 项通过、6 项失败；根 `AGENTS.md` 字数超限已修正并复跑。 | 本机命令会话；未归档原始日志 |
| V7 / 文档完整检查 | `pnpm run doc-sync` | FAIL，exit 1；36 项通过、7 项失败、0 项跳过。 | 本机命令会话；未归档原始日志 |
| V8 / 差异检查 | `git diff --check`；`git diff --cached --check` | PASS，均 exit 0；未报告空白错误，工具未提供计数。 | 本机命令会话；首个提交的暂存内容另由 Git hook 检查 |
| V9 / 产品功能及真实发布 | 未运行 | NOT_RUN；本轮无产品代码或发布授权。 | 无 |
| V10 / 文档字数 | `pnpm run verify-doc-budgets` | PASS，exit 0；7 个受限文档均在上限内。 | 本机命令会话；根 `AGENTS.md` 为 2080 / 2080 词 |
| V11 / 首次提交检查 | `git commit -m 'docs(workbench): establish agent governance rules'` | PASS，exit 0；3 个 hook 通过、3 个因无匹配文件跳过，暂存的 2 组双语配对一致。 | 本机命令会话；未归档原始日志 |

V5 使用仓库 Markdown 解析器检查本轮全部 Markdown 文件，实际命令如下：

```powershell
node --import tsx/esm --input-type=module -e "import {resolve} from 'node:path'; import {findViolations,markdownLinkCache} from './scripts/verify-md-links.ts'; const f=['AGENTS.md','WORKBENCH.md','WORKBENCH.zh.md','docs/workbench/AGENT_RULES.md','docs/workbench/AGENT_RULES.zh.md','docs/workbench/instructions/README.md','docs/workbench/instructions/TEMPLATE.md','docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md','docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.zh.md','workbench-reports/README.md','workbench-reports/TEMPLATE.md','workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md']; const c=markdownLinkCache(); const v=f.flatMap(x=>findViolations(resolve(x),c)); console.log(f.length+' files checked; '+v.length+' broken links'); if(v.length){console.error(v);process.exitCode=1}"
python -c "from pathlib import Path as P; i=P('docs/workbench/instructions/README.md').read_text(encoding='utf-8'); j=P('workbench-reports/README.md').read_text(encoding='utf-8'); r=list(P('workbench-reports').glob('*/WORK_REPORT.md')); s=list(P('docs/workbench/instructions').glob('*/INSTRUCTION.md')); e=[str(p) for p in r if (p.parent.name+'/WORK_REPORT.md' not in i or p.parent.name+'/WORK_REPORT.md' not in j)]+[str(p) for p in s if (p.parent.name+'/INSTRUCTION.md' not in i or p.parent.name+'/INSTRUCTION.md' not in j)]; print(len(r),'reports,',len(s),'instructions,',len(e),'index errors'); assert not e"
```

V6 的失败项为仓库级链接、双语配对、历史 P8-S1 指令换行、仓库引用和具体术语检查。V7 另有 Cordis catalog 与 Cordis inspect catalog 失败：前者报告现有 `ui-settings/open` 事件未映射到文档分区，后者报告该事件缺少 `@mode` 和 `@param sectionId`。上述现有源码和历史报告未修改。

## 风险与遗留问题

既有文档双语配对、链接、换行、术语和 Cordis 目录问题需在相关范围另行修复；历史报告及 P8-S1 指令未被改写。仓库引用检查禁止提交标识，本报告曾按当时的要求写入完整 commit SHA，因此该检查当轮不能称为通过；2026-11-15 的报告路径追溯规则把追溯单位改为轮次目录与项目相对路径，本报告的 commit 编号随之移除。原始命令日志未归档，需复跑命令获取；本报告记录观测结果。规则是 agent 指令，不会以机械方式保证每个外部 agent 实际遵守。

## 验收结论

CONDITIONAL：本轮规则、入口、模板及追溯链经定向验证；仓库级检查仍有上述失败，本轮新增完整 SHA 也与引用检查冲突。该结论仅适用于文档治理，不授权生产签名或发布。
