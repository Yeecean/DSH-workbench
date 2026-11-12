# DSH Workbench Work / Code UX 设计规范

状态：设计基线；Design-only，不代表生产功能已实现。基于分支 `workbench-p1-shell-prototype` 的提交 `1f877b7f15550ad60a327f59a942d60beeb9b990`。

## 已批准决策
- 一级工作空间只有 **Work** 与 **Code**，不再设置 Home。
- Work：通用 Agent 工作、研究、文件处理、分析、文档和成果交付。
- Code：Repository、Coding Session、多面板开发、Diff、Terminal 和调试。
- Work UX 参考 Claude Desktop 当前统一任务体验；Code UX 参考 Claude Code Desktop，并吸收 Codex 并行 Agent、Worktree 和 Diff Review 模式。
- 唯一当前 UI 主视觉：Apple macOS Design Language / Liquid Glass。
- 英文默认 JetBrains Mono；中文默认寒蝉半圆体；保留字体切换。
- Soft Editorial 只记录为未来参考，本阶段不实现、不混合。
- 旧 A/B 原型仅作历史归档，不作为视觉或组件基准。

## 文档地图
- [产品 UX 与信息架构](PRODUCT_UX_SPEC.zh.md)
- [Work 页面规范](WORK_UX_SPEC.zh.md)
- [Code 页面规范](CODE_UX_SPEC.zh.md)
- [组件设计规范](COMPONENT_DESIGN_SPEC.zh.md)
- [Apple 视觉系统规范](APPLE_VISUAL_SYSTEM_SPEC.zh.md)
- [Open Design Agent 任务书](OPEN_DESIGN_AGENT_BRIEF.zh.md)
- [研究来源](RESEARCH_REFERENCES.zh.md)

## 架构边界
复用原生 DSH Agent Runtime、Session、Model Provider、Tools、MCP、Skills、权限、Terminal、Files 与 Plugin 生命周期。Work / Code 是同一 Runtime 的两种产品呈现，不得创建两套 Runtime 或 Session 历史。右侧 Inspector / Session 工具沿用单轨道仲裁提议，不得私自创建第二条物理右栏。Browser、Worktree、Diff、Editor、Checkpoint、Scheduled Task、Artifact Preview 等能力必须先审计 API；原型示例数据不代表后端已接通。

## 原型顺序
先制作 Work Empty 与 Code Focus 两张基准画面，经用户审查后再扩展 Work Running / Waiting / Completed、Code Build / Review / Debug / Parallel Sessions，最后做 Appearance Settings 和响应式状态。本轮不修改生产代码、Runtime、Electron 启动器或正式设置系统。
