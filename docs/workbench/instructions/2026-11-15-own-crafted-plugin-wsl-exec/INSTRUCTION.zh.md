# Workbench 执行指令｜2026-11-15-own-crafted-plugin-wsl-exec

[English](INSTRUCTION.md) | 中文

- Status: 已由用户批准；本轮执行。
- Requested by: 本次对话中的用户。
- Agent / environment: Windows x64 上的 DSH agent；Node `v24.16.0`，pnpm `11.28.5`。
- Baseline branch and starting point: `feature/p8-s1-windows-release-security`；起点是上一轮收尾时的分支状态，不记录 commit 编号。
- Related architecture / ADR: 无；本轮不改变产品架构或任何运行时契约。
- Related roadmap milestone: 无；本轮为自研插件交付归档，不涉及 P0–P8 路线实施。
- Corresponding report: [WORK_REPORT.md](../../../../workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/WORK_REPORT.md)。

## 任务目标

把已经实机验证过的 WSL2 执行环境插件 `@local/dsh-wsl-exec` 归档到 `Own-Crafted-Plugin/`：插件源码、交付报告、实际效果与验证证据、部分实机截图；按仓库要求建立本轮指令与工作报告、更新两个索引，并提交、推送。

## 执行前必读确认

按 [Workbench 规则](../../AGENT_RULES.zh.md) 阅读 `AGENTS.md`、`docs/AGENTS.md`、[文档体系与追溯规范](../../DOCUMENTATION_GUIDE.zh.md)、[项目入口](../../../../WORKBENCH.md)、指令与报告模板、两个索引以及上一轮报告；并在同轮报告记录实际阅读情况。

## 允许修改范围

`Own-Crafted-Plugin/**`（新增归档内容）、`docs/workbench/instructions/2026-11-15-own-crafted-plugin-wsl-exec/**`、`workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/**`、两个工作台索引及其双语配对记录。

## 不可突破的约束

- 不修改 `packages/`、`apps/` 等产品源码，不修改桌面安装目录或 `app.asar`。
- 不提交密钥、token、真实设备标识或敏感日志。
- 不改变 DSH 原生 Agent/Session/Host/Client 契约，不创建平行 Runtime。
- 未经授权不创建官方上游 PR、不改写 Git 历史；本轮仅按用户指令提交并推送当前产品分支。

## 执行步骤

1. 从默认工作区复制插件源码、报告、证据与截图到 `Own-Crafted-Plugin/`，并修正归档后的相对链接。
2. 建立本轮指令与工作报告，按模板记录实际阅读、变更文件、验证证据与遗留问题。
3. 更新两个索引，补齐双语配对并重新记录。
4. 运行文档门禁与插件语法检查，确认无失败项后提交并推送。

## 验收标准

- `Own-Crafted-Plugin/` 内可独立读到插件源码、交付报告、证据汇总和至少五张截图。
- `pnpm run test:docs` 通过；新增 Markdown 通过换行、链接与双语配对检查。
- 插件源码通过 `node --check`（`index.js`、`client.js`）。
- 工作报告按项目相对路径列出全部变更文件，失败或未运行项如实标记。
- 提交信息标题为 `<type>(workbench): <一句话职责>`，正文包含本轮报告路径。

## 交付要求

- 提交 commit 并推送到 `origin/feature/p8-s1-windows-release-security`。
- 填写同轮 `WORK_REPORT.md`，不写入 commit SHA 或提交链接。
- 标注未运行项、残余风险与未授权操作。
- 更新指令与报告索引。

## 指令修订记录

| 日期 | 变更 | 原因/批准人 |
| --- | --- | --- |
| 2026-11-15 | 建立本轮指令 | 用户在本轮对话给出的归档与提交指令 |
