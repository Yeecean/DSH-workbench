# 产品 UX 与信息架构规范

## 产品心智
DSH Workbench 是以 Agent 工作成果为中心的 Desktop。用户选择工作空间、描述目标，必要时监督、授权和审查 Agent 工作。一级工作空间固定为 Work / Code，不设置 Home，也不设置 Chat / Cowork 两个并列入口。

| 概念 | 用户理解 | 设计边界 |
|---|---|---|
| Work / Code | 当前工作环境 | 一级切换，不销毁后台 Session |
| Project | 长期工作上下文 | 文件、指令、相关会话；持久化契约待审计 |
| Repository | Code 的 Git 仓库 | 代码工作根对象 |
| Session | 持续 Agent 工作过程 | 原生 DSH Session 身份和历史为权威 |
| Task | 用户交代的目标 | Work 呈现概念，映射原生 Session / Job / Event |
| Activity | Agent 具体动作 | 默认只显示重要里程碑，低层日志折叠 |
| Artifact | 可交付结果 | 预览、打开或下载取决于 API |
| Pane | Code 工具视图 | 布局对象，不等同 Session |
| Worktree | 隔离工作副本 | Host 能力确认后才可呈现 |

## 全局 Shell
- Window Toolbar：Work / Code 切换、当前上下文、少量全局操作。
- Primary Sidebar：当前空间的导航与 Project / Repository / Session。
- Main Canvas：Work 时间线或 Code Pane Workspace。
- Optional Right Inspector：Task Inspector / Session Inspector / 原生 Session 工具，同一时刻只有一条物理右轨道。
- Overlay：Popover、Command Menu、Dialog、Toast。

## Sidebar
Work：New Task、Projects、Recent、Scheduled（仅服务存在时）。
Code：New Session、Repositories、Active Sessions、Recent Sessions、Archived。
侧栏最多两层层级。不要常驻暴露 Runtime、Provider、MCP、Skills、Tool Registry、Token 和内部 ID。Session 行只显示可读名称、最近活动和轻量状态。

## Work / Code 区别
Work 以任务、执行过程和成果为中心；Code 以 Repository、Session、Changes 和工具 Pane 为中心。两者共享模型、Provider、权限、插件、MCP、Skills、主题、字体与快捷键。模式不同不构成安全边界，权限由 Host 决定。

## 导航与披露
切换空间不关闭后台 Session；返回时恢复最近有效 Project / Session。Inspector 关闭不代表任务关闭。窗口空间不足时隐藏面板必须提供重新打开入口。工具调用、完整计划、Runtime 诊断、Worktree 路径等次要信息按需展开，不在首屏平铺。

## 现有仓库映射
AppFrame 当前为 sidebar / main / rightbar 三列；原生右栏有 Session 范围状态，Terminal / Files 贡献其标签与 Pane。全局 Inspector 需要经批准的布局扩展和单轨仲裁。ui-theme 已支持 light/dark/system 及 text、code、terminal 字体角色，应优先复用。新数据模型和 API 均需审计。
