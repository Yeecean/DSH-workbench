# DSH Workbench

[English](WORKBENCH.md) | 中文

> 本文档是 **DSH Workbench 产品入口**，不是上游 DeepSeek Harness 的 README。上游项目说明请阅读 [README.zh.md](README.zh.md)。

DSH Workbench 是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面 Agent 工作台，面向 **Work / Code** 两种工作模式。项目坚持 **原生能力优先、插件式组合、单一 Agent/Session Runtime**：Workbench 负责桌面壳层、交互和产品编排；底层 Agent、Session、Tools、MCP、Skills、Host/Client 等能力遵循 DSH 原生契约。

## 仓库导航

| 路径 | 职责 |
| --- | --- |
| `apps/desktop/` | Electron 桌面应用、打包与安装器 |
| `packages/client/ui-workbench/` | Workbench 专属客户端 UI |
| `packages/` | DSH 原生组件与插件体系；并非全部为 Workbench 独有 |
| `docs/workbench/` | Workbench 原创架构、设计和阶段规划 |
| `docs/workbench/instructions/` | 按执行轮次留存的 Agent 指令 |
| `workbench-reports/` | 按执行轮次留存的提交、验证和验收记录 |

## 文档阅读顺序

1. [Agent 执行规范](docs/workbench/AGENT_RULES.zh.md)：所有 Workbench 任务的必读资料、执行和交付要求。
2. [文档治理与总索引](docs/workbench/DOCUMENTATION_GUIDE.zh.md)：权威来源、目录规范、追踪链。
3. [Workbench 架构](docs/workbench/WORKBENCH_ARCHITECTURE.zh.md)：模块所有权和原生扩展边界。
4. [开发路线图](docs/workbench/DEVELOPMENT_ROADMAP.zh.md)：P0–P8 目标和退出标准。
5. [执行指令索引](docs/workbench/instructions/README.md) → [工作报告索引](workbench-reports/README.md)：实施与证据。
6. [已知问题](docs/workbench/KNOWN_ISSUES.zh.md)：问题上下文；实际状态以对应提交、测试和最新验收报告为准。

**状态说明：** 阶段规划、历史基线文档和提交事实是不同层次。某份旧文档的“尚未开始”或“已完成”不自动代表仓库当前状态；必须以对应分支的源码、提交和可复核测试为依据。

## 开发与安全边界

- 不创建平行 Agent Loop、Session Store、RPC Stack 或绕过 Host 的 Renderer Node 权限。
- 外部产品/项目仅作为研究和设计参考，不凌驾于本项目原创架构与正式设计决策。
- 构建和启动方式参照上游 [README.zh.md](README.zh.md) 和 [开发指南](docs/development.md)；桌面专属打包与发布资格以代码、配置和实测为准。
- 新增功能、修复及变更必须满足 [文档与可追溯规范](docs/workbench/DOCUMENTATION_GUIDE.zh.md)。
