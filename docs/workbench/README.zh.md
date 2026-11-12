# DSH Workbench 第一阶段基线

[English](README.md) | 中文

## 摘要

本目录记录 DSH Workbench 的第一阶段基线：保留的 Fork、独立的上游工作区、以源码为依据的原生架构审计、已验证的 Windows Desktop 构建，以及待审核的扩展架构。Workbench 复用 DeepSeek Harness Runtime 及其 Host/Client 协议，通过 Cordis 插件、Bundle、Profile、Typert API 和客户端 UI Slot 增加产品行为。本阶段为架构评审建立证据；它不交付新的 Agent Loop、Session Store、RPC 层、Plugin Manager 或 WSL Bridge。

## 目录

- [阶段边界](#phase-boundaries)
- [文档地图](#document-map)
- [基线概览](#baseline-at-a-glance)
- [决策标签](#decision-labels)
- [证据状态](#evidence-status)
- [架构评审点](#architecture-review-point)
- [进一步探索](#further-exploration)
- [开发备注](#dev-note)

-----

<a id="phase-boundaries"></a>
## 阶段边界

第一阶段回答 Workbench 能否在不 Fork 核心契约的情况下建立在原生 DSH 架构之上。它保护原始 Fork，从官方 `master` 建立干净基线，审计源码归属，验证官方 Windows Desktop 启动路径，并提出分阶段产品架构供审核。

**已验证：**基线工作区能够启动 Electron Desktop、私有 Desktop Host 和标准 Web Client。类型检查、Lint、库构建、Desktop 构建，以及两个时序敏感 GUI 测试的定向重跑均通过。

**源码推断：**推荐设计保留 `AppFrame`、原生 Host/Client API 和未修改的 Runtime，再贡献 Workbench 客户端 Bundle 与聚焦的客户端插件。**尚未验证：**提议的 Workbench 页面、File Explorer、Editor、Approval Center、WSL Host Adapter 和插件 UX 尚未实现。

-----

<a id="document-map"></a>
## 文档地图

各页面有独立职责。先阅读原生架构审计与同步报告，再审核目标架构、扩展边界、平台限制和开发路线。

| 文档 | 用途 |
|---|---|
| [上游同步报告](UPSTREAM_SYNC_REPORT.zh.md) | Fork 身份、分支拓扑、固定基线、资料导出和构建证据 |
| [原生架构审计](NATIVE_ARCHITECTURE_AUDIT.zh.md) | 对 Cordis、Agent Runtime、Session、Typert、Desktop、UI 和 Windows 的源码审计 |
| [Workbench 架构](WORKBENCH_ARCHITECTURE.zh.md) | 目标组合、模块分类和 UI 方案 |
| [扩展点](EXTENSION_POINTS.zh.md) | 增加工具、模型、行为、Host/Client 插件、API 和 UI 的受支持方式 |
| [平台兼容性](PLATFORM_COMPATIBILITY.zh.md) | 已验证的 Windows 行为、WSL2 约束和未来执行环境设计 |
| [开发路线图](DEVELOPMENT_ROADMAP.zh.md) | 带依赖、源码范围、验收条件和风险的分阶段工作 |
| [AppFrame Slot 审计](APPFRAME_SLOT_AUDIT.zh.md) | P1 源码审查与全局页面右栏限制 |
| [原生能力矩阵](NATIVE_CAPABILITY_MATRIX.zh.md) | 原生服务、API、UI 归属与保留条件 |
| [WSL2 可行性](WSL2_FEASIBILITY.zh.md) | 已观察的 WSL 环境与尚未验证的 Host 路径 |
| [已知问题](KNOWN_ISSUES.zh.md) | Desktop 退出、IPC 与 GUI 超时问题的排查状态 |

-----

<a id="baseline-at-a-glance"></a>
## 基线概览

该工作区基于当前官方默认分支，并通过独立分支有意与旧 Fork 快照分开。它可从记录的 Commit 重现，且没有 Workbench 专属 Commit。

| 项目 | 记录值 |
|---|---|
| Fork | `https://github.com/Yeecean/DSH-workbench` |
| 上游 | `https://github.com/deepseek-ai/deepseek-harness` |
| 官方默认分支 | `master` |
| Fork 默认分支 | `main` |
| 基线分支 | `upstream-baseline-2026-11-12` |
| 基线 Commit | `e8f7 b93a 3449 64de 3dca 1ace 9e72 b6e4 d6de 87cb` |
| 包版本 | `0.2.2-rc.2` |
| Node / pnpm | `24.16.0` / `11.28.5` |

Commit 标识按四字符分组，以满足仓库引用策略；移除空格即可得到精确 SHA。较早的 `main` 与 `workbench` Fork 分支仍位于 `6649 1b05 e3f0 5ad3 5bcd d4f6 cd7e d260 41d9 e3db`（`0.2.2-rc.1`）。两个分支都没有 Fork 专属 Commit。官方 `master` 与本地基线比该快照领先 1,734 个 Commit。

-----

<a id="decision-labels"></a>
## 决策标签

提议架构为每个实质模块分类，使评审能够区分直接组合与产品开发。

| 标签 | 含义 |
|---|---|
| `REUSE` | 直接使用原生包和契约，不替换其实现 |
| `EXTEND` | 通过已记录的 Cordis、Typert、Bundle、Profile 或客户端 UI 扩展点增加行为 |
| `REPLACE` | 在既有服务或客户端契约背后提供不同实现 |
| `BUILD` | 创建没有原生归属的 Workbench 产品代码 |

提议的 Workbench 对 Runtime、Agent Loop、Session、Typert 传输、Remote 访问策略、Terminal 服务、文件系统服务和 Provider Adapter 使用 `REUSE`。它对工具、模型路由、生命周期观察、Desktop 组合、UI Slot、路由和本地化使用 `EXTEND`。它只为无法表达为 Slot 占位者的壳层产品策略或呈现保留 `REPLACE`。它为 Workbench 产品页面、执行环境选择器以及后续 WSL Adapter 使用 `BUILD`。

-----

<a id="evidence-status"></a>
## 证据状态

本集合中的操作陈述使用三种证据标签。同步报告中的命令已针对记录的 Worktree 执行；源码引用标识支持架构推断的实现。

| 状态 | 用途 |
|---|---|
| `已验证` | 已观察的命令、启动或文件系统结果能够支持陈述 |
| `源码推断` | 当前源码能够支持行为判断，但完整产品路径尚未执行 |
| `尚未验证` | 提议、环境缺口、外部依赖或未执行路径使结论仍不成立 |

当源码可用时，审计不把 README 声明当作充分证据。涉及生成的 Typert 方法、Desktop 打包或未测试 WSL 配置的陈述仍标记为推断或未验证。

-----

<a id="architecture-review-point"></a>
## 架构评审点

P1 按要求在 Slot 审查处暂停：现有 Session 右栏在独立全局页面隐藏，要求的 Home 右栏需要额外布局扩展或调整需求。详见 [AppFrame Slot 审计](APPFRAME_SLOT_AUDIT.zh.md)。

Windows Native 仍是首个验收平台；WSL 执行环境是后续单独验证的 Host 拓扑。P1 尚未交付 Workbench 壳层，也没有 Commit、Push 或 Release。

-----

<a id="further-exploration"></a>
## 进一步探索

阅读本索引后继续以下页面。顺序从仓库状态进入源码行为，再从目标组合进入平台和交付约束。

- [上游同步报告](UPSTREAM_SYNC_REPORT.zh.md)——确认保留的 Fork 和固定的源码基线。
- [原生架构审计](NATIVE_ARCHITECTURE_AUDIT.zh.md)——理解原生服务、协议、进程与扩展归属。
- [Workbench 架构](WORKBENCH_ARCHITECTURE.zh.md)——审核目标组合与 UI 选择。
- [扩展点](EXTENSION_POINTS.zh.md)——为每个功能选择最窄的受支持扩展。
- [平台兼容性](PLATFORM_COMPATIBILITY.zh.md)——将 Windows 验收与未来 WSL2 工作分开。
- [开发路线图](DEVELOPMENT_ROADMAP.zh.md)——审核提议顺序和验收条件。

-----

<a id="dev-note"></a>
## 开发备注

无。
