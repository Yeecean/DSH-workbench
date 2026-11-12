# Work 工作空间 UX 规范

## 目标
Work 是通用 Agent 工作环境。一个 Composer 同时承载普通对话和复杂任务，不要求用户先选 Chat / Cowork 模式。执行行为出现时自然展开 Activity、进度与成果。

## 布局
顶部：Workspace Switcher、Project 上下文、少量操作。左侧：New Task、Projects、Recent、Scheduled（服务存在才显示）。中央：Conversation Timeline、任务活动、澄清、最终结果。右侧：按需 Task Inspector。底部：统一 Composer。

## Empty
中央以 Composer 为焦点，显示简洁欢迎语和 2–4 个轻量任务提示。允许临时任务，不强迫先创建 Project。禁止 Runtime / Token / Model 指标卡片、Agent 清单、内部 ID、插件网格和复杂仪表盘。

Composer 包含多行输入、附件、当前 Project / Folder Context、工具入口（真实可用项）、模型入口（若产品暴露）和发送按钮。Enter 发送、Shift+Enter 换行按现有输入契约执行。拖入文件展示预览和移除动作。

## Running
时间线按顺序展示用户任务、Agent 理解摘要、重要里程碑、授权请求、关键文件操作、阶段产物和最终结果。工具调用默认折叠；展开才展示工具名、参数摘要、输出摘要和错误。没有可靠百分比时不得伪造进度。并行任务以紧凑分组展示，不堆叠大卡片。

## Waiting / Approval
说明请求对象、原因、影响范围与可选动作。映射原生 Approval / Question。待处理状态离开页面后仍保留，重新进入恢复原卡片，不重复弹窗。普通授权用中性样式，危险操作才用警告色。

## Completed
结果摘要和最重要 Artifact 预览优先；文件列表与可用打开/下载动作随后；执行过程默认折叠；保留可继续追问的 Composer。不要让用户翻阅大量日志才能找到结果。

## Error / Interrupted
区分 Agent、工具、权限、网络/Host、用户停止和部分完成。说明已保存成果、重试可能性、重新授权需求及未完成操作风险。错误放在相关 Activity 附近，不用通用红条覆盖整个界面。

## Task Inspector
Overview、Plan、Context、Activity、Deliverables。默认只显示最重要的少数信息，其余折叠。关闭 Inspector 不改变执行。与原生 Session 右栏遵循单轨仲裁。

## Project
Project 是长期工作上下文，不是 Session。显示名称、描述、相关文件、项目指令和最近 Work Sessions。归档 Project 不删除本地文件；删除 Project、删除目录和移除关联必须是不同动作。

## 验收
Empty 不是仪表盘；单一 Composer；Running 默认突出里程碑；无伪造百分比；Approval 明确影响范围；Completed 成果优先；Error 可理解且可恢复；Inspector 克制且可关闭；不显示未接通能力。
