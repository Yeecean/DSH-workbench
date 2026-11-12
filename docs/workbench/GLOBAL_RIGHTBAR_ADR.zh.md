# ADR：全局 Agent Context 右栏

[English](GLOBAL_RIGHTBAR_ADR.md) | 中文

## 摘要

**状态：提议中；等待用户批准和 Windows Desktop 原型验证。** 本决策记录建议增加由 AppFrame 管理的根作用域全局右栏，并与原生 Session 右栏共享一个经过仲裁的右侧轨道。该提议需要客户端布局扩展，现有 Slot 本身不能实现它。

## 目录

- [问题与约束](#problem-and-constraints)
- [现有行为](#existing-behavior)
- [方案与推荐](#options-and-recommendation)
- [Slot API 草案](#proposed-slot-api)
- [仲裁与生命周期](#arbitration-and-lifecycle)
- [布局与无障碍](#geometry-and-accessibility)
- [Profile 隔离](#profile-isolation)
- [验证与待决事项](#validation-and-open-decisions)
- [开发备注](#dev-note)

-----

<a id="problem-and-constraints"></a>
## 问题与约束

Workbench 需要在 Home 和其他全局页面显示 Agent Context 面板，同时保留原生 Conversation、Session 右栏、Terminal 和 Files。方案保留 AppFrame 及原有 `root` 和 `rightbar` 占位者，不将 `shell.overlay` 用作右列，也不引入第二套 Runtime、Session Store 或 RPC 系统。

本文仅提出架构方案和原型计划。本文所述拟议 Slot、仲裁 API、Profile、插件和运行结果均尚未实现或验证。

-----

<a id="existing-behavior"></a>
## 现有行为

AppFrame 在 [ui-layout index.ts:192–201](../../packages/client/ui-layout/src/client/index.ts) 声明根作用域的 `sidebar`、带键的 `main`、`rightbar`、`shell.bottom`、`shell.overlay` 和 `shell.leading`。[AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx) 使用选中的全局面板键或 `conversation` 选择主区域；[layout service.ts:27–36](../../packages/client/ui-layout/src/client/service.ts) 选择全局面板时不改变当前 Session。

原生右栏在选中全局面板时保留已挂载的 Session 视图，但将其设为隐藏，见 [RightbarRoot.tsx:17–25, 29–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)。其 `rightbar.session` 和面板标签均为 Session 作用域，见 [ui-sidebar-right index.ts:232–247](../../packages/client/ui-sidebar-right/src/client/index.ts)；Terminal 和 Files 向这些现有位置贡献内容，详见 [能力矩阵](NATIVE_CAPABILITY_MATRIX.zh.md)。

`shell.bottom` 占据全宽行，`shell.overlay` 是浮层，`shell.leading` 用于有限的窗口控制，见 [ui-layout index.ts:91–121](../../packages/client/ui-layout/src/client/index.ts)。它们都不声明第二个由布局管理的右栏。AppFrame 目前只在 [AppFrame.tsx:191–195, 288–296](../../packages/client/ui-layout/src/client/AppFrame.tsx) 预留一个右侧轨道；[stores.ts:24–51](../../packages/client/ui-layout/src/client/stores.ts) 的 `rightbarShown`、`rightbarTrack`、`rightbarFullscreen` 和宽度表示该轨道。

原生右栏在 [ui-sidebar-right index.ts:221–223](../../packages/client/ui-sidebar-right/src/client/index.ts) 通过 `openRightbar` 和 `closeRightbar` 报告呈现状态，目前没有多占位者仲裁器。活动且展开的非全屏 Session 收到 `canShow=false` 时，右栏会折叠；清理时还会报告隐藏（[SidebarRight.tsx:397–413, 424–449](../../packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx)）。仅隐藏 DOM 不会改变活动标志，而为了让出轨道传入 `canShow=false` 可能折叠 Session 状态。[registry.ts:28–44](../../packages/client/ui-renderer/src/client/registry.ts) 说明替换 Root 会丢失 AppFrame 的子声明。

-----

<a id="options-and-recommendation"></a>
## 方案与推荐

| 方案 | 优点 | 成本与限制 |
|---|---|---|
| A：仅在 Conversation 中显示 Context | 复用原生 Session 界面，无须增加布局 Slot。 | Home 和其他全局页面没有 Context，需要调整既定需求。 |
| B：独立全局 Slot 加布局仲裁 | 使各页面可访问 Context，同时保留原生 Session 占位者及其标签。 | 需要范围受限的 AppFrame／客户端布局扩展、所有权规则、布局工作和回归测试。 |
| C：在原生 Session 右栏内扩展 Context | 复用原生 Session 标签及其生命周期。 | Session 右栏在全局页面隐藏且依赖 Session，无法单独提供全局 Home Context。 |

**建议审核方案 B**：使用一个物理右侧轨道，并在两个保留的占位者之间明确切换。这样不会同时用两列挤压中间区域；代价是 Context 与 Session 右栏同一时刻只能显示一个。若要求并排显示，则需要不同的布局设计和批准。

该扩展修改原生**客户端布局归属者**，并可能需要在 `ui-sidebar-right` 作最小适配，以区分 Session 逻辑状态和呈现资格；它不替换原生 `root` 或 `rightbar`，也不修改 Runtime。不能声称仅凭插件即可实现：当前布局归属者尚未声明、渲染或仲裁拟议的全局 Slot。这两处客户端修改仍是待批准提议。

-----

<a id="proposed-slot-api"></a>
## Slot API 草案

下列名称和字段是设计草案，不是已有导出或可执行配置。最终名称和类型需要根据实际 Slot 契约进行实现评审。

| 草案元素 | 拟议所有权和契约 |
|---|---|
| `shell.rightbar.global` | 由 AppFrame 归属者声明和渲染的新 `single` 根作用域子 Slot。Workbench 客户端插件贡献一个 Context 组件；不隐含 Session 绑定。 |
| 归属者提供的属性 | 有效宽度、视口宽度、该 Slot 是否选中以及可用轨道能否显示它；属性只传递呈现事实，不暴露可变 `ctx`。 |
| 布局仲裁器 | 布局归属者跟踪贡献是否可用、选中的界面和有效轨道，并按来源及注册代次隔离报告。Session 占位者继续拥有自身的逻辑展开和模式状态。 |
| 全局操作 | 受限操作打开、关闭或选择 Context 并请求首选宽度；布局归属者验证所有权并计算有效呈现。 |
| 注册 | 插件通过 `ctx.slots.inject` 等待声明，再通过 `ctx.slots.register` 注册；声明和插件 fiber 分别拥有清理生命周期，见 [registry.ts:194–209, 229–270](../../packages/client/ui-renderer/src/client/registry.ts)。 |

这个 single Slot 只有一个生效贡献。现有 Slot 注册表选择数值最小的优先级，并拒绝同一单元的相同优先级重复注册（[ui-slots index.ts:1266–1294](../../packages/client/ui-slots/src/index.ts)）。P1 应使用一个已知贡献，并将意外冲突视为可见的配置错误，而不是依赖未指定的加载顺序。

-----

<a id="arbitration-and-lifecycle"></a>
## 仲裁与生命周期

| 情况 | 拟议结果 |
|---|---|
| Home 或其他全局页面 | Context 已注册且启用时，在右轨道显示它；保留隐藏的原生 Session 子树及其状态。Context 关闭或不可用时释放轨道。 |
| Conversation 请求原生右栏 | Session 右栏初始优先；保留 Context 状态，允许用户明确切换到 Context。暂停呈现时保留 Session 的逻辑展开状态、标签、首选宽度和焦点目标；切回时恢复符合条件的呈现，不重建 Session。 |
| 两个界面同时请求轨道 | 同一时刻只有一个界面拥有可见轨道和拖动手柄。用户的明确选择持续到导航或该选择不可用；不混合两个归属者的呈现报告。 |
| 原生全屏与页面导航 | Conversation 活动时原生全屏优先。允许导航至 Home 或其他全局页面：暂停原生全屏呈现并显示符合条件的 Context。返回 Conversation 后，恢复仍有效的显式全屏模式，或根据当前视口重新计算自动全屏；空间不足时不得静默破坏 Session 逻辑状态。 |
| 插件卸载或声明消失 | 移除 Context 注册和监听器，中止待处理回调及拖动，清除其选择和轨道占用，并显示符合条件的原生 Session 界面。旧的清理器不得清除新注册。 |
| Renderer 重载 | 重新建立注册，并根据可用占位者协调当前页面；不假设内存中的宽度、选择或 Context 内容会保留。只恢复经过明确持久化设计和测试的数据。 |

原生右栏目前根据视图与面板两个订阅同步屏幕上的 Session，并在释放时注销二者（[ui-sidebar-right index.ts:168–180](../../packages/client/ui-sidebar-right/src/client/index.ts)）。其活动标志来自选中页面和 Session，而不是拟议仲裁器的选择（[RightbarRoot.tsx:17–24, 34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)）。原型必须分别表示逻辑展开和呈现资格，提供基于真实几何空间的 `canShow`，不能为暂停界面而伪造该值；还需定义不折叠或卸载保留 Session 的暂停路径。除布局扩展外，这可能需要对原生右栏作最小适配。

仲裁器必须按来源和注册代次隔离报告与清理：延迟的过渡回调、旧卸载或旧清理器只能释放自己仍有效的占用，绝不能清除更新的选择。新代码须释放自己拥有的订阅、ResizeObserver、排队回调和指针捕获。标准 Slot 清理器会级联移除声明的子注册（[ui-slots index.ts:1190–1215](../../packages/client/ui-slots/src/index.ts)）；额外呈现状态仍需显式清理。

选中的全局页面注销时，现有 Store 会回退到 Conversation（[stores.ts:94–101](../../packages/client/ui-layout/src/client/stores.ts)）。拟议仲裁器必须在同一状态转换中根据新页面和当前注册重新计算所有权；否则过期的 Context 占用可能留下空轨道或隐藏 Session 控制。

-----

<a id="geometry-and-accessibility"></a>
## 布局与无障碍

现有 `computeColumns` 在普通右轨道存在时保护 400 px 的中间区域，将右栏限制为至少 300 px、至多视口的 70%，空间不足时移除右侧轨道（[columns.ts:10–31, 44–63](../../packages/client/ui-layout/src/client/columns.ts)）。AppFrame 使用 `ResizeObserver` 测量，并在清理时取消排队的动画帧（[AppFrame.tsx:150–167](../../packages/client/ui-layout/src/client/AppFrame.tsx)）。

原型应复用同一列宽求解和拖动语义，为 Context 与 Session 分别保留内存中的首选宽度。只有选中的界面驱动轨道宽度和拖动手柄；拖动开始时捕获实际渲染宽度（[AppFrame.tsx:202–205, 252–259](../../packages/client/ui-layout/src/client/AppFrame.tsx)）。窄窗口让步不得覆盖任一首选宽度；如果求解器移除右侧轨道，Context 需要可访问的重新打开控件和经过测试的窄屏呈现，才能视为满足需求。

隐藏界面必须退出指针交互、Tab 焦点顺序和无障碍遍历，同时保留恢复原生 Session 所需的内容。切换或卸载焦点所在界面时，焦点必须移到可见且有名称的控件。需测试 Windows 标题栏安全间距、抽屉切换、全屏进出、拖动时调整窗口，以及现有 Terminal 和 Files 交互；当前抽屉已将相邻区域设为 inert（[AppFrame.tsx:312–323](../../packages/client/ui-layout/src/client/AppFrame.tsx)）。

-----

<a id="profile-isolation"></a>
## Profile 隔离

提议使用独立 Workbench Bundle 和客户端入口，仅在 Workbench 组合中启用，并保留普通原生 Desktop 组合作为回退目标。Desktop 当前在 [paths.ts:17–20](../../apps/desktop/src/paths.ts) 解析 `profiles/desktop`，Desktop Host 在 [desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts) 向运行器传入 `desktop`。独立命名的 Desktop Profile 及其隔离尚未得到演示。

原型验证必须先确认受支持的隔离启动方式以及独立的配置和数据所有权，使用临时测试 Home，而不修改用户正常的 Desktop Profile。单独设计获批准前不要修改原生 Desktop 启动流程；如需要修改启动载体，应记录为待解决依赖。

-----

<a id="validation-and-open-decisions"></a>
## 验证与待决事项

Windows Native Desktop 验收必须覆盖 Home、Conversation、Context 切换、Terminal 和 Files、原生 Session 和 Approval、窗口调整与拖动、窄窗口、Renderer 重载、插件卸载与重新注册，以及回退到原生组合。打开 Terminal 和 Files 后切到 Context、调整窗口再切回：检查 Session 身份、标签、逻辑展开状态、首选宽度和符合条件的焦点目标得以保留；还需在空间足够和不足的宽度验证显式全屏及自动全屏导航规则。还要覆盖双重请求、延迟回调、卸载时取消、焦点与重复挂载／卸载，检查没有过期轨道或处理器。这些是未来原型的必需检查，不是本次设计审查的测试结果。

需要批准方案 B 的范围受限客户端布局扩展及必要的最小 `ui-sidebar-right` 适配、单轨道仲裁、随页面暂停全屏、各界面独立的临时宽度和 Home 默认行为。还需决定 Context 是否必须与 Session 工具同时可见：若必须同时可见，单轨道提议不满足需求。Desktop Profile 隔离、原生 UI 兼容性、实际清理及 Windows 行为均须等待原型运行后验证。

-----

<a id="dev-note"></a>
## 开发备注

源码证据对应固定基线。拟议 API 和行为不代表已经实现的接口承诺。
