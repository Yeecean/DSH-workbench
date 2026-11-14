# Workbench 执行指令｜2026-11-15-report-path-traceability

[English](INSTRUCTION.md) | 中文

- Status: 已由用户批准；本轮执行。
- Requested by: 本次对话中的用户。
- Agent / environment: Windows x64 上的 DSH agent；Node `v24.16.0`，pnpm `11.28.5`。
- Baseline branch and starting point: `feature/p8-s1-windows-release-security`；起点是上一轮收尾时的分支状态，不记录 commit 编号。
- Related architecture / ADR: [Workbench 架构提议](../../WORKBENCH_ARCHITECTURE.zh.md)；本轮未授权架构变更。
- Related roadmap milestone: [Workbench 开发路线图](../../DEVELOPMENT_ROADMAP.zh.md)；本轮是追溯方式与文档门禁任务，不实施 P8-S1。
- Corresponding report: [WORK_REPORT.md](../../../../workbench-reports/2026-11-15-report-path-traceability/WORK_REPORT.md)。

## 任务目标

把工作追溯的单位从 commit 编号改成“轮次报告目录 + 该轮变更文件的项目相对路径”，并把这套要求写进 agent 规则。想知道某次改动做了什么，先读提交信息，顺着里面的 `Report:` 路径进到该轮报告，再按项目相对路径看这轮改了哪些文件，而不是靠提交编号。

## 作业边界与授权

本轮范围已由用户批准：翻转追溯规则、清理历史 commit 编号、清掉上一轮留下的红灯门禁。修改规则、模板、两个索引、历史轮次、设计交付物和报告中点名的桌面发布代码属于授权范围。合并回官方上游、创建官方 PR、推送、打 tag，以及任何真实签名或发布动作都不在授权内。

## 需要完成的变更

1. 在 [Workbench 规则](../../AGENT_RULES.zh.md) 中新增必做的开工追溯步骤，并让英文侧保持镜像：先读近期提交信息，顺着每条 `Report:` 行读该轮报告，遇到没有报告路径或报告缺失的提交就如实记成追溯缺口。
2. 修改[指令模板](../TEMPLATE.zh.md)与[报告模板](../../../../workbench-reports/TEMPLATE.md)：一轮只记录基线分支与起点说明，以及本轮变更文件的项目相对路径，并写明提交信息格式包含报告路径和一到三条工作摘要。
3. 清掉工作报告中点名的历史指令、历史报告、设计交付物和原型页面里的 commit 编号，改写成轮次报告路径或普通描述。
4. 把 Manifest v2 的构建来源记录在 `apps/desktop/scripts` 及其测试中统一命名为 `buildIdentity`，让禁用词门禁通过，并让字段名直接说明它记录的是什么。
5. 补齐上一轮报红的双语配对、链接和硬换行，并用仓库配对命令重新记录每一对文档。
6. 在[指令索引](../README.zh.md)和[报告索引](../../../../workbench-reports/README.zh.md)登记本轮，然后复跑文档门禁，直到原先报红的检查全部转绿。

## 证据与验收

验收要求 `pnpm run test:docs` 通过，换行、链接、仓库引用、具体术语、双语配对、文档字数各单项检查通过，受影响的桌面测试与 typecheck 通过，工作报告按项目相对路径列出全部变更文件并附准确命令与结果。未运行的检查一律记为 `NOT_RUN`。

## 不属本轮范围

- 真实硬件 EV 签名、证书使用、生产上传与 OTA 发布。
- 合并回官方上游、创建官方 PR、改写历史。
- 放宽 P8-S1 签名策略或重新启用 `signed` 打包。
- 除 `buildIdentity` 改名外改动桌面发布行为。
