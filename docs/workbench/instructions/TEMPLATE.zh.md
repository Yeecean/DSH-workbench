# 执行指令｜<YYYY-MM-DD-slug>

[English](TEMPLATE.md) | 中文

- Status: Proposed / Approved / Executed
- Requested by:
- Agent / environment:
- Baseline branch and starting point:
- Related architecture / ADR:
- Related roadmap milestone:
- Corresponding report: `workbench-reports/YYYY-MM-DD-slug/WORK_REPORT.md`

## 任务目标

描述可观察的交付目标与非目标。

## 执行前必读确认

按照 `docs/workbench/AGENT_RULES.zh.md` 列出基础文档和本任务相关的架构、ADR、规格、指令及历史报告；执行前逐项阅读，并在同轮报告记录实际阅读情况。

## 允许修改范围

列出文件、模块与依赖边界。

## 不可突破的约束

- 原生 DSH Agent/Session/Host/Client 契约优先；不得未经批准创建平行 Runtime。
- 不得未经授权更改签名、发布、真实机器、凭据和敏感权限配置。
- 外部研究只供参考，不得覆盖本项目已批准原创架构。
- 明确需要审批的重大变更和必须停止的条件。

## 执行步骤

逐步列出操作、输出物以及必要的失败回滚逻辑。

## 验收标准

列出代码、测试、Windows 实机/模拟、数据保护、CI 等明确检查项。未运行项须如实说明。

## 交付要求

- 提交 commit（主题清晰、逻辑独立），提交信息正文写明本轮报告路径 `Report: workbench-reports/YYYY-MM-DD-slug/WORK_REPORT.md` 与工作摘要。
- 填写同轮 `WORK_REPORT.md`，按项目相对路径列出本轮变更文件、差异和证据；报告不得写入 commit SHA。
- 标注失败/跳过测试、残余风险、未获授权的操作。
- 更新指令与报告索引。

## 指令修订记录

| 日期 | 变更 | 原因/批准人 |
| --- | --- | --- |
| | | |
