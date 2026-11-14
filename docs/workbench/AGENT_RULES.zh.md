# DSH Workbench agent 执行规范

[English](AGENT_RULES.md) | 中文

本规范适用于所有 DSH Workbench 相关任务，与[仓库级规则](../../AGENTS.md)和[文档规则](../AGENTS.md)共同生效。项目文档的职责和权威边界由 `docs/workbench/DOCUMENTATION_GUIDE.zh.md` 定义；本文件规定 agent 的执行要求。

## 执行前阅读

每次任务开始时，agent 必须阅读以下基础文件，并结合任务范围阅读有关资料；不得只读 README 后直接修改代码。

1. 仓库根目录 `AGENTS.md` 和 `docs/AGENTS.md`。
2. 项目入口 `WORKBENCH.zh.md` 和 `docs/workbench/DOCUMENTATION_GUIDE.zh.md`。
3. [Workbench 架构](WORKBENCH_ARCHITECTURE.zh.md)、[开发路线图](DEVELOPMENT_ROADMAP.zh.md)以及任务涉及的架构设计、ADR 和专项规格。
4. `docs/workbench/instructions/README.md`、`docs/workbench/instructions/TEMPLATE.md` 及当前任务的实际执行指令。
5. `workbench-reports/README.md`、`workbench-reports/TEMPLATE.md` 及相关历史工作报告。

先理解产品边界、任务所处阶段、决策状态和历史结果，再开始修改。独立开发或文档治理轮次尚无指令文件时，先依据用户实际授权归档指令，再进行其他修改；报告须记录实际读过的文件。

## 设计、计划与事实

已批准的架构和 ADR 是设计依据；路线图和专项规格记录阶段目标；执行指令界定本轮授权；Git 源码与提交记录实际实现；工作报告和测试证据记录验证与验收。提案、待决 ADR 和规划不能当成已批准决策或已实现事实。

实现与已批准设计不一致时，记录偏差并按项目决策流程处理；不得因实现方便擅改架构。外部项目、竞品和上游实现仅供参考，不得覆盖项目原创研究和已批准决策。

## 指令与报告

每轮独立开发或文档治理必须从 `docs/workbench/instructions/TEMPLATE.md` 建立 `docs/workbench/instructions/YYYY-MM-DD-<slug>/INSTRUCTION.md`，保存实际交付给 agent 的完整最终指令，写明目标、授权范围、禁止事项、验收标准，并追加记录后续修改。不得只在对话中保存指令。

每轮必须以[报告模板](../../workbench-reports/TEMPLATE.md)为基础建立 `workbench-reports/YYYY-MM-DD-<slug>/WORK_REPORT.md`，记录实际阅读依据、目标与授权范围、基线分支及完整 SHA、实际分支、指令、每个提交的完整 SHA、变更文件与内容、验证环境、命令、结果、证据位置、设计偏差、未完成事项、风险和最终验收结论。

每个功能性提交必须映射到具体工作内容和验证证据。记录实际命令、结果与测试数量；检查工具不提供计数时明确写出“未提供计数”。未运行项写 `NOT_RUN`，失败、超时和跳过如实记录；区分仅本机保存与仓库已归档的证据。不得编造 SHA、测试结果、PR 链接或截图路径，报告不能代替实际测试和安全验收。

提交内容无法包含自身完整 SHA 时标记 `PENDING`，在后续提交中核实并回填；用于最终回填的提交自身仍可标记 `PENDING`，并在交付中提供其实际 SHA。不得猜测 SHA 或为回填重写历史。

## 索引与提交

完成每轮时同步更新 `docs/workbench/instructions/README.md` 和 `workbench-reports/README.md`，使指令与报告互相链接，且每个新轮次均可从两个索引找到；不得链接不存在的报告。已有历史记录缺少原始指令时，标明缺口，不补造内容。

每个提交尽可能只承担一个明确职责，不混入无关功能、文档或修复；不得覆盖历史工作报告、伪造提交或擅自重写 Git 历史。

## 产品与上游隔离

Workbench 使用独立产品分支体系。未经用户明确授权，禁止将产品代码合并回官方 DSH 上游、向官方仓库创建产品 PR、以官方分支作为产品功能合并目标，或改变产品分支与上游的关系。上游更新不构成自动同步授权。

## 完成条件

独立开发或文档治理轮次只有完成修改、适用验证、提交、工作报告、指令索引和报告索引，且记录遗留问题及验收结论后才可交付。未完成或未验证的项目必须明确标记；不得仅凭代码写完宣布完成，也不得以报告代替生产发布或安全授权。
