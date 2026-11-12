# 组件设计与交互规范

## Shell
Window Chrome、Workspace Switcher、Primary Sidebar、Main Canvas、Right Inspector、Overlay Host。Shell 只有 Work / Code 两个一级空间；Inspector 按需出现；不把页面切成后台卡片墙。

## Navigation
Workspace Switcher 仅 Work / Code，键盘可操作。Project / Repository Row 显示可读名称和轻量状态。Session Row 显示名称、最近活动和状态点；隐藏 Session ID、Job ID、绝对路径。低频操作放入上下文菜单。

## Conversation
Timeline 呈现用户消息、Agent 回答、重要 Activity、Approval 和成果。工具调用默认折叠为 Activity Row；展开后查看工具、参数摘要、结果和错误。Plan Summary 突出当前步骤，完成步骤折叠，不伪造百分比。Approval Card 说明动作、对象、原因和影响范围。Artifact Preview 按文件类型展示预览。

## Composer
Work / Code 共用基础 Composer，并通过上下文插槽变化。包含多行输入、附件、Project / Repository Context、真实可用工具、模型入口（若存在）和发送按钮。输入有最大高度；拖入文件有预览与移除；运行中后续指令必须明确排队/插入/中断语义；低频工具收纳菜单。

## Inspector
Work Task Inspector：Overview、Plan、Context、Activity、Deliverables。Code Session Inspector：Repository、Working Directory、真实可用 Branch / Worktree、Changed Files、Environment / Permissions。不得重复中央 Pane 已展示内容。关闭不改变任务或 Session。

## Code Panes
Pane Header：类型、标题、当前对象、菜单、关闭。Pane Tabs：同工具多个实例。Split Divider：最小宽高、拖动时不缓动。Diff Viewer：Unified / Side-by-side。Terminal：原生服务与 JetBrains Mono。Files：原生服务。Preview / Browser：Host 能力确认后启用。关闭 Pane 不关闭 Session。

## 状态矩阵
每个主要组件设计 Default、Hover、Focus、Selected、Disabled、Loading、Empty、Error、Warning、Dragging、Reduced Motion、Reduced Transparency。

## 组织原则
连续画布优先，不是每个信息项都做 Card；每个区域最多一个视觉主按钮；避免 10px 以下辅助文字；不堆彩色 Badge；隐藏 Pane 退出 Tab 顺序和无障碍树。先审计原生快捷键再定义新快捷键。

## 验收
职责不重复；Composer 复用；Activity 默认折叠；Inspector 按需；Pane 关闭不关闭 Session；Terminal / Files 复用；完整状态矩阵；键盘、拖动和窄屏有定义。
