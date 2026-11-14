# Workbench execution instruction | 2026-11-14-agent-governance-rules

English | [中文](INSTRUCTION.zh.md)

- Status: Approved by the user; see the revisions below.
- Requested by: The user in this conversation.
- Agent / environment: Codex on Windows.
- Baseline branch and starting point: `feature/p8-s1-windows-release-security`; the [work report](../../../../workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md) lists changed files by project-relative path instead of commit identifiers.
- Related architecture / ADR: [Workbench architecture proposal](../../WORKBENCH_ARCHITECTURE.md); no architecture change is authorized.
- Related roadmap milestone: [Workbench roadmap](../../DEVELOPMENT_ROADMAP.md); this is a cross-phase governance task, not P8-S1 implementation.
- Corresponding report: [WORK_REPORT.md](../../../../workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md).

## Task objective

Establish the project-level agent and documentation governance requested in the complete original instruction below.

## Required reading

Read the files named in the original instruction and record the actual reading in the work report; the current task instruction is this file.

## Authorized changes

Change the requested rules, navigation, templates, indexes, and this round's instruction and report; add the bilingual counterparts and records needed for new documents.

## Constraints

Preserve the upstream repository rules and existing reports. Do not change P8-S1 code, workflows, signing or release configuration; do not merge, rewrite history, push upstream, or create a PR.

## Execution and acceptance

Follow the original instruction and revisions below. Record actual checks, limitations, commits, and acceptance in the corresponding report.

## Original instruction as delivered

The original Chinese text is preserved verbatim as the authoritative record of the user's request.

~~~~text
# 任务：建立 DSH Workbench 项目级 Agent 执行与文档治理规则

## 一、任务目标

为 DSH Workbench 建立长期有效的项目级 Agent 规则，确保所有参与项目开发的 AI Agent：

1. 开始任务前必须阅读项目现有的指导文档。
2. 必须理解项目架构、开发路线和当前任务所处阶段。
3. 必须遵循现有目录结构保存执行指令。
4. 必须严格按照统一模板编写工作报告。
5. 必须建立指令、代码提交、测试证据、验收结论之间的完整追溯关系。
6. 不得自行改变项目与官方 DSH 上游仓库的隔离关系。

本轮只建设项目治理规则，不执行 P8-S1 修复，不修改任何运行时代码、发布流程或签名配置。

## 二、执行前必须阅读的文件

首先完整阅读以下文件：

### 1. 仓库级规则

- `AGENTS.md`
- `docs/AGENTS.md`

必须理解现有 DSH 仓库的 Agent 规则，不能覆盖或破坏原有规则。

### 2. Workbench 项目指导

- `WORKBENCH.zh.md`
- `docs/workbench/DOCUMENTATION_GUIDE.zh.md`
- `docs/workbench/WORKBENCH_ARCHITECTURE.zh.md`
- `docs/workbench/DEVELOPMENT_ROADMAP.zh.md`

必须理解项目定位、原创架构、设计权威性、路线规划和文档层级。

### 3. 执行指令体系

- `docs/workbench/instructions/README.md`
- `docs/workbench/instructions/TEMPLATE.md`
- 当前任务对应的 `INSTRUCTION.md`

### 4. 工作报告体系

- `workbench-reports/README.md`
- `workbench-reports/TEMPLATE.md`
- 最近相关轮次的 `WORK_REPORT.md`

如果涉及某个具体功能，还必须阅读该功能对应的架构设计、ADR、专项规格和历史报告。

不得只阅读 README 就开始开发。

## 三、建立项目级 Agent 规则

新增：

`docs/workbench/AGENT_RULES.zh.md`

该文件是 DSH Workbench 项目的专属 Agent 执行规范，至少包含以下内容。

### 规则 A：强制文档阅读

任何 Agent 开始 Workbench 相关工作之前，必须：

1. 阅读仓库级 `AGENTS.md`。
2. 阅读 Workbench 项目入口和文档治理规范。
3. 阅读相关架构、路线图及 ADR。
4. 阅读当前任务的执行指令。
5. 阅读相关历史工作报告。

禁止在不了解现有架构和历史决策的情况下直接修改代码。

阅读范围应与任务相关，但上述基础文件不得省略。

### 规则 B：架构优先级

必须遵守现有文档的权威层级：

- 已批准架构和 ADR：设计依据。
- 开发路线图：阶段目标。
- 执行指令：本轮授权范围。
- Git 源码和 Commit：实际实现事实。
- 工作报告和测试证据：验证事实。

不得因为某种实现更方便，就自行修改项目架构。

外部项目、竞品和上游实现只能作为参考，不能凌驾于我们的原创研究和架构决策之上。

### 规则 C：每轮工作必须有独立指令

每轮独立开发必须建立：

`docs/workbench/instructions/YYYY-MM-DD-<slug>/INSTRUCTION.md`

要求：

- 保存实际交付给 Agent 的完整最终指令。
- 写明目标、范围、禁止事项和验收标准。
- 记录指令的追加修改。
- 更新 `instructions/README.md`。

不得只在对话中保存执行指令而不归档。

### 规则 D：工作报告必须遵循统一结构

每轮开发必须建立：

`workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md`

必须以 `workbench-reports/TEMPLATE.md` 为基础，不得自行创造另一套报告格式。

报告至少包含：

1. 任务目标与授权范围。
2. 基线分支和完整 SHA。
3. 实际工作分支。
4. 对应执行指令。
5. 每个 Commit 的完整 SHA。
6. Commit 对应的修改文件和工作内容。
7. 实际运行的测试命令及结果。
8. 验证环境和证据位置。
9. 设计偏差与未完成事项。
10. 遗留风险。
11. 最终验收结论。

特别要求：

- 每个功能性 Commit 必须能追溯到具体工作内容和验证证据。
- 不允许只写「测试通过」，必须给出实际命令、结果和测试数量。
- 未运行的测试标记 `NOT_RUN`。
- 失败和超时必须如实记录。
- 本机证据与仓库已归档证据必须区分。
- 不允许编造 SHA、测试结果、PR 链接或截图路径。
- 报告不能代替实际测试和安全验收。
- 无法在当前 Commit 中确定自身 SHA 时，使用 `PENDING`，提交后在后续 Commit 回填。

### 规则 E：索引必须同步

每轮工作完成后，必须同步更新：

- `docs/workbench/instructions/README.md`
- `workbench-reports/README.md`

确保指令与报告相互链接。

禁止出现已有工作报告却没有对应索引，或者指令指向不存在的报告。

### 规则 F：Commit 管理

- 一个 Commit 尽可能只承担一个明确职责。
- 不得将无关功能、文档和修复混入同一个 Commit。
- 不得覆盖历史工作报告。
- 不得伪造历史提交记录。
- 不得为了整理报告擅自重写已有 Git 历史。

### 规则 G：产品分支隔离

DSH Workbench 是独立产品分支体系。

严禁未经用户明确授权：

- 将 Workbench 产品代码合并回官方 DSH 上游。
- 向官方仓库创建产品 PR。
- 将官方分支作为产品功能的合并目标。
- 擅自改变产品分支与上游的关系。
- 将外部上游更新视为必须立即同步的任务。

### 规则 H：任务结束条件

Agent 不得仅凭代码编写完成就宣布任务结束。

必须完成：

1. 代码或文档修改。
2. 对应验证。
3. Commit。
4. 工作报告。
5. 指令索引更新。
6. 报告索引更新。
7. 遗留问题与验收结论。

未完成事项必须明确标记，不能用模糊的「基本完成」代替。

## 四、接入现有 Agent 规则体系

修改根目录 `AGENTS.md`：

- 增加简短的强制阅读入口，指向 `docs/workbench/AGENT_RULES.zh.md`。
- 明确所有 Workbench 相关任务都必须遵守该规则。
- 保留原有 DSH 仓库规则。
- 不复制整篇治理规范到根目录。

同时检查 `WORKBENCH.md` 和 `WORKBENCH.zh.md` 的文档导航，在适当位置增加 Agent 规则入口。

## 五、强化现有模板

检查并适度完善：

- `docs/workbench/instructions/TEMPLATE.md`
- `workbench-reports/TEMPLATE.md`

要求：

1. 指令模板增加执行前必读文档确认。
2. 报告模板增加实际阅读的文档依据。
3. 报告模板强化 Commit、验证证据和验收状态的对应关系。
4. 保留已有字段和结构，不无故重写。
5. 不制造重复的文档治理规则。

## 六、验证要求

完成后检查：

- 新增规则是否能从根目录 `AGENTS.md` 找到。
- Workbench 入口是否能够找到规则。
- 指令模板与报告模板是否一致。
- 指令索引和报告索引是否正确。
- 所有 Markdown 内部链接是否有效。
- 是否与 `DOCUMENTATION_GUIDE.zh.md` 冲突。
- 是否违反 `docs/AGENTS.md` 的文档分层要求。

运行与本轮文档变更相关的仓库文档检查，例如：

- `pnpm run test:docs`
- `pnpm run doc-sync`

根据实际环境执行，不能把未执行的检查报告为通过。

## 七、交付要求

本轮必须形成一个独立工作轮次：

- 执行指令：`docs/workbench/instructions/2026-11-14-agent-governance-rules/INSTRUCTION.md`
- 工作报告：`workbench-reports/2026-11-14-agent-governance-rules/WORK_REPORT.md`

提交独立 Commit，并更新两个索引。

不要修改 P8-S1 的代码、Workflow 或既有工作报告。

不要执行分支合并、历史重写、上游推送或未经授权的 PR 操作。

最终向用户报告：

1. 新增和修改的文件。
2. 建立的项目级规则。
3. Agent 强制阅读机制如何生效。
4. 工作报告模板有哪些强制要求。
5. 验证结果。
6. Commit 完整 SHA。
7. 尚未解决的问题。

**最终目标：以后任何 Agent 接手 DSH Workbench，都必须先理解项目，再执行任务，并按照统一的文档体系留下完整、可审计的工作记录。**
~~~~

## Instruction revision history

| Date | Revision | Reason / approval |
| --- | --- | --- |
| 2026-11-14 | The user added: “不要独立分支，直接在当前分支进行修改，对于我的指令和实际有不准确的地方进行修改”. | Use the existing branch and correct factual mismatches using repository evidence. |
| 2026-11-15 | The user added: “请继续”. The requested `2026-11-14` directory name remains unchanged. | Work continued on 2026-11-15; do not present the directory date as the completion date. |
