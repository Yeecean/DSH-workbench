# Code 工作空间 UX 规范

## 目标与导航
Code 是 Agentic Software Engineering 工作台。左侧导航：New Session、Repositories、Active Sessions、Recent Sessions、Archived。Repository 关联多个独立 Code Session。Session 行显示可读名称、所属仓库、轻量状态和最近活动，不显示内部 ID 或路径堆叠。

## 新建 Session
从 Repository 发起时自动带入仓库上下文；全局 New Session 时先选择 Repository。确认工作目录 / 执行环境；Worktree 仅在 Host API 真实支持时提供；输入开发目标后创建 Session。Empty 页面只展示仓库摘要、Composer 和少量建议任务。

## Code Workspace
顶部 Session Toolbar 显示名称、Repository、真实可用的分支/隔离状态与 View 菜单。主工作区为 Chat Pane + 用户选择的工具 Pane。右侧只有一条轨道，显示原生 Session Tools 或 Session Inspector。Pane 关闭不关闭 Session。

## Pane 类型
| Pane | 职责 | 能力边界 |
|---|---|---|
| Chat | 对话、计划、执行摘要 | 复用原生 Session |
| Terminal | 当前 Session 工作目录命令 | 复用原生 Terminal |
| Files | 文件浏览 | 复用原生 Files |
| Diff / Changes | 变更列表与 Diff | 需审计 Git / Diff UI |
| Preview / Browser | 本地应用预览 | 需审计 Browser / Preview Host |
| Plan | 计划摘要 | 不创建第二套权威 Store |
| Tasks | 后台 Job / 子任务 | 映射真实 Job API |
| Subagents | 子 Agent 状态 | Runtime 暴露后才显示 |
| Session Details | 环境与权限摘要 | 映射原生数据 |

## 布局预设
- Focus：Chat 为主，其他 Pane 按需打开。
- Build：Chat + Terminal。
- Review：Changes + Diff，Chat 可作为辅助。
- Debug：Preview / Browser + Terminal，服务存在才启用。
- Custom：Pane 拖动重排、调整尺寸、关闭、重新打开和保存布局。

预设不是独立页面。切换预设不得丢失 Session、未提交变更或工具状态。Pane 系统不得替换原生 Runtime / Session。

## 多 Session
一个 Repository 可有多个独立 Session；每个拥有独立历史、执行状态和变更范围。切换 Session 不取消其他任务。并行状态只显示真实数据。Worktree 创建、切换、清理必须由 Host 侧受控服务完成；未确认前原型只能标记为概念。

## Diff Review
Changes 文件列表 + Diff Viewer，支持 Unified / Side-by-side。文件切换与 Diff 同步。行级评论、Hunk 接受/拒绝和应用回工作区须先审计。不能只用颜色表达变化。

## Terminal / Files
复用原生服务。Terminal 保持等宽字体、复制粘贴和快捷键；Files 复用现有文件访问策略。编辑器、多文件编辑和 Browser 均需独立能力审计。

## 右栏与窄屏
右轨道仅一个合法所有者；切换 Pane 不关闭 Session；切换 Session 时释放旧焦点与订阅。窄屏优先单 Pane，提供 View 菜单；用户宽度偏好不因响应式让步而被覆盖。

## 验收
Focus / Build / Review / Debug 是布局预设；Pane 可按规格操作；Terminal / Files 复用原生；未审计能力不伪装已实现；多 Session 不丢失状态；仅一条右轨道；键盘、焦点、窄窗口与全屏行为明确。
