# Open Design Agent 任务书：DSH Workbench P1

[English](OPEN_DESIGN_AGENT_BRIEF.md) | 中文

## 任务

使用已启动的 Open Design 环境，为 DSH Workbench 创建可编辑的 Windows Desktop 设计。用户的 V2 指令文件是详细需求依据；本文是执行交接。只完成设计与评审资料，保留已有文件和项目；没有用户另行指示时，不修改生产代码、不提交、不推送。

## 先阅读

阅读[设计索引](README.zh.md)、[原生审计](DESIGN_AUDIT.zh.md)、[视觉方向](VISUAL_DIRECTION.zh.md)、[主题和 Token 映射](THEME_SYSTEM_SPEC.zh.md)、[交互规范](INTERACTION_SPEC.zh.md)、[响应式规范](RESPONSIVE_SPEC.zh.md)、[Context 信息架构](CONTEXT_INFORMATION_ARCHITECTURE.zh.md)与[全局右栏 ADR](../../GLOBAL_RIGHTBAR_ADR.zh.md)。完整要求见 `C:/Users/Haoyang/Downloads/Download-Chorm/DSH-workbench_P1开发指导指令_V2.md`，尤其是第 6–13 节和附录 A–B。[本地 HTML 探索稿](source/index.html)仅供参考，它不是 Open Design 原生项目，也不是已批准产品。

## 设计范围

创建两套可比较方向：A 延续原生 DSH 视觉语言；B 增加克制的 Workbench 特征。两套均展示相同状态：无活动 Session 的 Home 与全局 Context、Conversation 与原生 Session 工具、Conversation 与 Context、窄窗口降级、Appearance Settings，以及主题导入的预览、失败、取消、应用与恢复。明确标识示例数据和未实现控件；不要复制其他产品界面，也不要暗示官方背书。

展示一条物理右轨道及明确的 Context／Session 切换。设计保留 Session 标签、Pane、展开意图、宽度偏好和可恢复焦点；展示关闭／重开、窄窗口、全屏导航及插件不可用回退。全局 Workspace、执行和 Agent 信息与 Session 局部信息必须分开；不要把候选字段画成已连接 API，也不要将已安装工具等同于 Session 已准入工具。

仅在有助于层级时使用克制玻璃材质，并提供不透明对比和回退。Conversation 文字、Terminal、Files、日志和密集设置保持稳定可读的表面。覆盖明暗模式、对比度与焦点、Windows 缩放、减少透明与动态效果、界面和等宽字体、字号、强调色和重置。主题文件是拟议的版本化数据，需校验与回滚；不得把执行脚本或任意 CSS 作为功能演示。

## 必须交付

保存可编辑的 Open Design 原生项目、准确位置和打开方式，并在现有设计工作区或用户批准的其他位置保存各核心状态的独立导出。不得覆盖已有资产。覆盖 1440 × 900、1280 × 800、1024 px、768 px 和 767 px 参考布局，并记录实际检查过的尺寸。在设计索引中链接原生项目和导出；如果工具无法提供原生项目或导出，报告准确阻碍，不要用截图冒充可编辑源文件。

从兼容性、识别度、密度、阅读舒适度、对比度、无障碍、性能、主题兼容性和实现成本比较 A/B，并提出推荐而不视为已批准。报告 Context 中尚未知晓的数据契约、需要用户批准的视觉决策，以及已观察的原生页面、设计模拟和未执行的 Windows 验收之间的区别。

## 边界

不得替换 `root` 或原生 `rightbar`、用 `shell.overlay` 冒充永久布局列、增加第二套 Runtime、Session Store 或 RPC，也不得开始实现。拟议布局扩展、必要的原生右栏最小适配、单轨策略、隔离 Desktop Profile、最终视觉方向和 P1 范围仍须用户批准。

不得使用真实凭据、Session、用户 Workspace 数据或破坏性的 Desktop 准备操作。原生视觉参考需要认证或无法确认隔离时，应报告限制。交付设计供评审后暂停。

## 开发备注

本交接将 Open Design 操作交给用户指定的 Agent，并不声称所需 Open Design 项目已经存在。
