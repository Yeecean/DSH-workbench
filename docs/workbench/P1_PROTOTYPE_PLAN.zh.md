# P1 最小原型计划

[English](P1_PROTOTYPE_PLAN.md) | 中文

## 摘要

本提议计划定义最小 Windows Native Desktop 原型，以便在原生 Conversation、Terminal 与 Files 旁验证 Workbench Home 和全局 Agent Context。本文用于设计评审；其中的实现和验收检查均尚未执行。

## 目录

- [批准与前置条件](#approval-and-prerequisites)
- [源码约束](#source-constraints)
- [实施顺序](#implementation-sequence)
- [Windows 验收矩阵](#windows-acceptance-matrix)
- [失败与恢复](#failure-and-recovery)
- [开发备注](#dev-note)

-----

<a id="approval-and-prerequisites"></a>
## 批准与前置条件

原型实施前需要决定所提布局扩展和 Desktop Profile 隔离方案。仅靠 Workbench 插件无法通过当前声明的 Slot 增加由布局管理的全局右列；现有 Session 右栏在全局面板中隐藏。保留其独立状态还可能需要最小的 `ui-sidebar-right` 适配；评审必须批准任何原生 UI-layout 和右栏修改范围。不修改 Runtime、Session Store、Terminal、Files 或传输实现。

计划保留现有 `root` 和 `rightbar` 占位者，不将 `shell.overlay` 用作列。它不增加 WSL Bridge、第二套 Agent Runtime、Session Store 或 RPC。[右栏 ADR](GLOBAL_RIGHTBAR_ADR.zh.md) 负责描述拟议仲裁规则，[Desktop Profile 可行性报告](DESKTOP_PROFILE_FEASIBILITY.zh.md) 负责尚未解决的 Desktop 启动与隔离选择。

-----

<a id="source-constraints"></a>
## 源码约束

- Frame 在 [AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx) 根据活动面板或 `conversation` 选择 `main` 键；原生 Session 右栏在全局面板活动时隐藏内容，见 [RightbarRoot.tsx:34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)。
- Frame 在 [AppFrame.tsx:140–195](../../packages/client/ui-layout/src/client/AppFrame.tsx) 测量视口并选择响应式布局；宽度计算和偏好由 [columns.ts:45](../../packages/client/ui-layout/src/client/columns.ts) 与 [stores.ts:13–47](../../packages/client/ui-layout/src/client/stores.ts) 负责。
- 原生右栏位置在 `canShow` 为 false 时会折叠已展开的非全屏 Session 右栏，活动位置清理时也会报告关闭，见 [SidebarRight.tsx:385–449](../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx)。窄视口自动全屏行为由第 397–405 行计算；仲裁不能把隐藏但保留的位置误当成用户折叠，也不能让旧清理关闭全局界面。
- Terminal 与 Files 在 [ui-sidebar-terminal index.ts:95](../../packages/client/ui-sidebar-terminal/src/client/index.ts) 和 [ui-sidebar-files index.ts:174](../../packages/client/ui-sidebar-files/src/client/index.ts) 贡献 Session 右栏标签页。源码存在不等于原型测试通过。
- Desktop 在 [paths.ts:17–20](../../apps/desktop/src/paths.ts) 解析 `profiles/desktop`，其 Host 在 [desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts) 提供 `desktop` 名称。不能据此假定 Desktop 可以选择单独命名的 Profile。

-----

<a id="implementation-sequence"></a>
## 实施顺序

下列事项均为以上述决定为前提的后续工作。实施者需要记录准确输入、结果、错误与源码提交，不能把本计划当作已完成的测试报告。

1. 在 Windows 上建立一次性测试环境，使用独立 Harness Home、`DSH_AGENTS_HOME`、受支持时使用独立 Electron User Data 位置，并准备隔离测试 Workspace。开发启动器会删除并重建固定项目目录，操作前必须检查；使用真实数据前先确认共享数据目录和凭据。
2. 设计经批准的最小原生 UI-layout 扩展，使其声明和渲染单独的全局右侧 Slot、参与现有宽度计算与控制生命周期，并保留现有 Session `rightbar` 注册及其子位置。评估保留原生位置状态是否还需要最小 `ui-sidebar-right` 适配，并获得其确切范围的批准。修改 UI 代码前，评审 ADR 中明确的仲裁、响应式、拖动与卸载规则。
3. 使用受支持的 Cordis 注册生命周期增加独立 Workbench Bundle、Profile 组合与 Client Entry。结合 Profile 可行性工作确定实际 Desktop 加载路径；如果 Desktop 必须修改启动器才能加载所提组合，暂停并单独报告这一限制。
4. 增加带键的 Home 主面板及其导航入口，并将静态 Agent Context 作为已批准全局 Slot 的占位者。保持 Conversation 及其现有 Workspace、Files、Terminal 注册可用；原型不实现实时 Agent 活动或新的 Session 管理系统。
5. 只增加覆盖扩展和产品入口所需的生命周期、布局与集成检查。使用隔离组合构建并启动真实 Windows Native Desktop，记录准确的 Profile 和已加载插件身份，并在代表性窗口宽度下截取 Home 与 Conversation 界面。
6. 执行以下验收矩阵，逐项记录通过、失败或受阻，并在批准范围内修复缺陷。如果修复需要修改 Runtime、Session、Terminal、Files 或 Desktop 启动器，暂停并请求单独决定。

-----

<a id="windows-acceptance-matrix"></a>
## Windows 验收矩阵

以下是计划中的检查，并非观察结果。使用隔离的 Workbench 组合与单独的原生基线，在 Windows Native Desktop 上执行；每项记录相关截图、日志和源码提交。

| 检查 | 操作 | 验收证据 |
|---|---|---|
| 启动与隔离 | 从隔离测试 Home 启动两种组合；检查解析后的 Profile、Bundle、Client Entry、Runtime 路径和所有共享 User Data 位置。 | Workbench Home 和 Context 出现在预期组合中；原生基线加载原始界面，并在使用真实数据前确认共享位置。 |
| Home 与导航 | 使用实际侧栏控件依次选择 Home、Conversation 和 Home。 | 每次选择均到达对应主面板；Home 有全局 Context 列，Conversation 保留原生内容。 |
| Session 工具 | 在 Conversation 中打开一次性 Session、Terminal 和 Files；执行无害的 Shell 命令并打开测试文件。 | 切换到 Home 后返回同一 Session，原生 Terminal 与 Files 仍可用；没有引入替代服务。 |
| 仲裁与保留 | 打开原生右栏标签页，在 Home 与 Conversation 间切换，然后关闭并重新打开全局 Context。 | 每种状态仅由批准的右侧界面占用轨道；原生标签状态和全局偏好遵循 ADR，列不重叠且焦点不会落在隐藏目标上。 |
| 隐藏的 Session 位置与窗口缩放 | 在展开的 Session 右栏打开 Terminal 和 Files，选择 Home 及其 Context，调整窗口大小，再返回 Conversation。验证切换期间 `canShow` 变为 false 和旧位置清理的情况。 | 除非用户主动更改，原生逻辑展开状态、标签身份、焦点行为与保存宽度均得以保留；旧位置不能关闭或调整当前全局界面。 |
| 全屏与窄视口 | 将原生 Conversation 右栏手动设为全屏，导航至 Home 并显示 Context，再返回；跨越窄屏自动全屏阈值后重复。 | Home Context 仍可用，返回后根据批准规则恢复有效的原生状态，自动全屏不会静默覆盖手动模式或展开偏好。 |
| 调整大小与折叠 | 拖动右侧分隔线；将窗口调整至宽、受支持最小值和窄屏宽度；折叠并重新打开相应面板。 | 宽度处于批准的计算范围，控件仍可访问，响应式让步不会破坏保存的用户偏好。 |
| Renderer 重载 | 打开一次性 Session 与 Terminal 标签页后重载 Renderer，再切换两个页面。 | 应用通过原生 Host 行为重新连接，每个贡献只注册一次，只恢复批准设计承诺的状态；Session 身份不变。 |
| 卸载与重新加载 | 通过受支持的插件生命周期卸载 Workbench Client Entry，再分别在选中 Home 和 Conversation 时重新加载。 | Workbench Slot 条目、监听器及其拥有的状态各清理一次；不留下空轨道或失效控件，原生 Conversation、Terminal 和 Files 仍可用。 |
| 原生回退 | 退出 Workbench，在不加载 Workbench Bundle 的隔离原生基线中启动。 | 原始 Desktop 界面和原生 Session 工具可用，不包含 Workbench 注册或配置更改。 |

-----

<a id="failure-and-recovery"></a>
## 失败与恢复

在隔离环境中验证 Workbench Client Entry 缺失或加载失败、全局 Slot 提供者缺失、重复注册被拒绝，以及 Host 启动失败。每种情况必须产生可观察错误或已记录的回退；不能遗留监听器、幽灵右侧轨道、静默遮蔽原生 UI 或修改原生测试 Profile。移除故障后重复加载与卸载，并重试启动。

只有同一源码提交上的 Windows 矩阵和聚焦检查均通过，才可验收原型。原生工具缺失、Desktop Profile 路径不受支持、清理不完整或响应式状态未验证，均须明确记录为阻塞，不能标记为通过。

-----

<a id="dev-note"></a>
## 开发备注

本文是拟议实施与验证计划。本次未实现原型代码，也未为本计划启动 Windows Desktop 或执行验收测试。
