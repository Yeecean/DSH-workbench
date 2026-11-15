# 工作报告｜2026-11-15-own-crafted-plugin-wsl-exec

- Status: PASS
- Baseline branch / starting point: `feature/p8-s1-windows-release-security`；起点为上一轮收尾时的分支状态，不记录 commit 编号。
- Actual branch: `feature/p8-s1-windows-release-security`
- Related instruction: [INSTRUCTION.md](../../docs/workbench/instructions/2026-11-15-own-crafted-plugin-wsl-exec/INSTRUCTION.md)
- Related architecture / ADR / milestone: 无；本轮为自研插件交付归档，不改变架构决策与路线里程碑。
- PR URL: NOT_CREATED（用户只要求提交并推送，未要求创建 PR）
- Report update date: 2026-11-15

## 目标、边界与授权

用户在本轮对话要求：把插件源码、工作报告、实际效果与部分截图放到 `Own-Crafted-Plugin/`，并按仓库要求提交和推送。授权范围是本轮指令列出的归档目录、同轮指令与报告、两个索引及其双语配对记录；提交与推送到当前产品分支已获授权，创建官方上游 PR、改写历史、发布与签名未获授权。

交付对象是已经在本机实机验证过的 `@local/dsh-wsl-exec` 插件：把 WSL2（RockyLinux-9.8）里的 Linux 原生 DSH Host 通过独立反代端口挂进 Windows 官方桌面，桌面源码与 `app.asar` 均未改动。

## 实际阅读的文档依据

- 仓库规则：`AGENTS.md`、`docs/AGENTS.md`。
- Workbench 规则与文档规范：`docs/workbench/AGENT_RULES.zh.md`、`docs/workbench/DOCUMENTATION_GUIDE.zh.md`、`WORKBENCH.zh.md`。
- 模板：`docs/workbench/instructions/TEMPLATE.zh.md`、`workbench-reports/TEMPLATE.md`。
- 索引与上一轮：`docs/workbench/instructions/README.zh.md`、`README.md`、`workbench-reports/README.zh.md`、`README.md`、`workbench-reports/2026-11-15-report-path-traceability/WORK_REPORT.md`、`docs/workbench/instructions/2026-11-15-report-path-traceability/INSTRUCTION.zh.md`。
- 交付源文件：默认工作区的 `wsl-exec-plugin/README.md`、`WSL2_EXEC_ENV_REPORT.md`、`DESIGN_NOTES.md` 与插件源码。

## 提交与变更映射

| 提交主题（提交后填写） | 变更目的和工作内容 | 变更文件（项目相对路径） | 验证证据编号及验收状态 |
| --- | --- | --- | --- |
| docs(workbench): archive the WSL2 execution plugin deliverable | 归档 WSL2 执行环境插件的源码、交付报告、实际效果、验证脚本与五张实机截图；建立本轮指令、报告与索引 | 见下方「本轮文件清单」 | V1–V3 通过；V4 NOT_RUN |

**说明**：报告以轮次目录和变更文件的项目相对路径作为追溯单位，不记录 commit SHA、短哈希或提交链接。核对提交时用 `git log -- workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/` 找出引入本报告的提交。

## 本轮文件清单（项目相对路径）

归档主体：

- `Own-Crafted-Plugin/README.md`、`README.zh.md`、`README.i18n.yaml`
- `Own-Crafted-Plugin/wsl-exec-plugin/package.json`、`cordis.patch.yml`、`index.js`、`client.js`、`shell.html`、`icon.svg`、`USAGE.md`
- `Own-Crafted-Plugin/wsl-exec-plugin/locale/en.json`、`locale/zh.json`
- `Own-Crafted-Plugin/reports/WSL2_EXEC_ENV_REPORT.md`、`DESIGN_NOTES.md`、`EVIDENCE.md`
- `Own-Crafted-Plugin/tools/verify-plugin.mjs`
- `Own-Crafted-Plugin/screenshots/01-linux-session-in-wsl.png`、`02-session-kept-after-reload.png`、`03-linux-workspace-picker.png`、`04-stop-then-start-session-kept.png`、`05-titlebar-inset-fix.png`

本轮指令与报告：

- `docs/workbench/instructions/2026-11-15-own-crafted-plugin-wsl-exec/INSTRUCTION.md`、`INSTRUCTION.zh.md`、`INSTRUCTION.i18n.yaml`
- `workbench-reports/2026-11-15-own-crafted-plugin-wsl-exec/WORK_REPORT.md`

索引与配对记录：

- `docs/workbench/instructions/README.md`、`README.zh.md`、`README.i18n.yaml`
- `workbench-reports/README.md`、`README.zh.md`、`README.i18n.yaml`

## 实现与设计偏差

插件源码按原样复制，未改动一行；归档时只做了三处适配：截图引用从源工作区的 `wsl-exec-plugin/docs/` 改为本目录的 `../screenshots/`；插件使用说明由 `README.md` 改名为 `USAGE.md`，避免与仓库 README 双语配对范围混淆；交付报告里的自查命令改为 `node Own-Crafted-Plugin\tools\verify-plugin.mjs`，并把探针脚本一并归档到 `tools/`。

本目录不是 pnpm workspace 包，不参与仓库构建；本轮不修改任何产品源码、桌面安装目录或 `app.asar`，没有设计偏差需要审批。

## 验证证据

| 证据编号 / 类别 | 环境 / 实际命令 | 结果、退出码及通过 / 失败 / 跳过数量 | 证据位置及保存范围 |
| --- | --- | --- | --- |
| V1 / 文档门禁 | Windows x64；Node `v24.16.0`、pnpm `11.28.5`；`pnpm run test:docs` | PASS；21 passed、0 failed、0 skipped，exit 0。首轮因指令双语侧 `WORKBENCH` 链接语言后缀不一致导致翻译配对 1 项失败，改为两侧同指 `WORKBENCH.md` 后全量通过 | 本机终端输出 |
| V2 / 插件语法检查 | `node --check` 检查 `Own-Crafted-Plugin/wsl-exec-plugin/index.js` 与 `client.js` | PASS；两文件均 exit 0 | 本机终端输出 |
| V3 / 内容一致性 | 对比归档文件与默认工作区源文件的 SHA-256 | PASS；8 个插件源文件（package.json、cordis.patch.yml、index.js、client.js、shell.html、icon.svg、locale/en.json、locale/zh.json）字节一致；`USAGE.md` 相对源 `README.md` 为预期适配（截图路径改写、补第五张证据） | 本机终端输出 |
| V4 / 真实设备/安装/升级 | 本轮未重新执行真实桌面操作 | NOT_RUN；沿用插件交付时的实测记录与五张截图（已归档在 `Own-Crafted-Plugin/screenshots/`） | `Own-Crafted-Plugin/reports/EVIDENCE.md` |

## 风险与遗留问题

- 本目录是静态交付存档，与已安装 profile 中的插件副本可能出现后续漂移；修改插件应以本目录为源重新安装。
- Linux 侧模型网关使用 WSL 网关 IP（本机为 `172.26.224.1`），WSL 重启后 IP 变化会导致模型连接失败；修复命令见交付报告。
- WSL1/WSL2 版本检测未实现，本机仅有 WSL2 实机环境。
- `index.js` 当前约 1032 行，后续可在保持测试的前提下收敛。
- 本轮未重跑真实桌面操作，V4 记为 NOT_RUN；已有截图与证据来自插件交付时的实测。

## 验收结论

PASS：插件源码、交付报告、实际效果说明、验证脚本与五张截图已归档到 `Own-Crafted-Plugin/`，本轮指令与报告、两个索引及双语配对全部落地；文档门禁与语法检查结果见上表。本轮不具备也不声称任何生产发布授权，真实桌面操作未在本轮重跑。
