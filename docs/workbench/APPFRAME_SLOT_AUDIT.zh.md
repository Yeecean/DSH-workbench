# AppFrame 与 Slot 审计

[English](APPFRAME_SLOT_AUDIT.md) | 中文

## 摘要

本源码审计确认原生布局的扩展点，以及它们对拟议 Workbench Shell 的限制。它不构成运行时保留性的证明：Workbench 插件、Profile 和卸载行为尚未实际验证。

## 目录

- [Frame 与 Root](#frame-and-root)
- [Slot 清单](#slot-inventory)
- [注册、排序与清理](#registration-ordering-and-cleanup)
- [原生依赖](#native-dependencies)
- [Workbench 限制](#workbench-limitations)
- [开发备注](#dev-note)

-----

<a id="frame-and-root"></a>
## Frame 与 Root

客户端壳层在 [app.tsx:21](../../packages/client/ui-renderer/src/client/app.tsx) 渲染 `root`；渲染器在 [registry.ts:28](../../packages/client/ui-renderer/src/client/registry.ts) 将它声明为 single Slot。布局插件在 [ui-layout index.ts:192–205](../../packages/client/ui-layout/src/client/index.ts) 注册 AppFrame，并声明其六个子 Slot。

AppFrame 在 [AppFrame.tsx:273–285, 288–340](../../packages/client/ui-layout/src/client/AppFrame.tsx) 管理响应式三列、抽屉、拖动手柄、底栏、浮层和 leading 位置。保留它即可保留该布局和已声明的子 Slot；替换 `root` 会移除原生 AppFrame 子树，替代者必须重新提供所需声明和行为，见 [registry.ts:28–44](../../packages/client/ui-renderer/src/client/registry.ts) 的说明。

-----

<a id="slot-inventory"></a>
## Slot 清单

布局插件在 [ui-layout index.ts:59–121, 192–201](../../packages/client/ui-layout/src/client/index.ts) 定义下列 Slot；AppFrame 在 [AppFrame.tsx:45–50, 273–285, 314–335](../../packages/client/ui-layout/src/client/AppFrame.tsx) 渲染它们。下一节的注册、排序和清理规则适用于每一项。

| Slot | 类型与渲染用途 | 替换、追加与上下文 |
|---|---|---|
| `root` | Single；渲染器通过它挂载整个客户端布局。 | 较高优先级的注册会遮蔽 AppFrame 及其声明；它不是追加位置。作用域为 root。 |
| `sidebar` | Single；AppFrame 渲染左栏及其折叠或抽屉状态。 | 注册可以遮蔽原生 Sidebar，不能在旁边追加。Frame 属性提供宽度、折叠状态和抽屉模式；原生 Sidebar 声明品牌、导航、工作区和设置的内部位置。 |
| `main` | Keyed；AppFrame 渲染当前面板的键，默认 `conversation`。 | 新键增加可选择的面板；较高优先级的注册遮蔽相同键。原生 Conversation 与其他页面各自独立注册。 |
| `rightbar` | Single；AppFrame 用视口和宽度属性渲染右栏。 | 注册可以遮蔽原生右 Sidebar，不能在旁边追加。原生内容声明 Session 作用域的子 Slot，包括 Files 和 Terminal 使用的面板位置。 |
| `shell.bottom` | Single；跨三列下方的全宽底栏。 | 注册可以遮蔽其他内容；它跨主面板切换保持挂载，且不接收 Session 绑定。 |
| `shell.overlay` | List；位于列滚动容器之外的全局浮层。 | 不同 ID 可以追加；较高优先级的注册可以遮蔽相同 ID。浮层本身允许点击穿透，条目自行启用指针交互。 |
| `shell.leading` | Single；在抽屉模式或 macOS 隐藏侧栏时显示窗口控制。 | 注册可以遮蔽原生控制，不能在旁边追加；AppFrame 仅在上述条件下挂载该位置。 |

原生 Sidebar 在 [ui-sidebar index.ts:88–116](../../packages/client/ui-sidebar/src/client/index.ts) 声明自己的子位置，在 [slots.ts:29–75](../../packages/client/ui-sidebar/src/client/contract/slots.ts) 描述其用途，并在 [SidebarRoot.tsx:348, 410–451, 461–467](../../packages/client/ui-sidebar/src/client/SidebarRoot.tsx) 渲染。插件可以贡献面板和导航入口而不替换 Sidebar；原生 Plugins 页面示例见 [ui-plugin-manager index.ts:129–173](../../packages/client/ui-plugin-manager/src/client/index.ts)。

-----

<a id="registration-ordering-and-cleanup"></a>
## 注册、排序与清理

客户端插件通过 `ctx.slots.inject(name, () => ctx.slots.register(...))` 注册；注入等待 Slot 声明，并将贡献绑定到声明生命周期和调用方的 Cordis fiber。声明消失或插件卸载时会清理活动注册；后续重新声明时可以再次安装。可迭代贡献按事务安装，并按相反顺序清理。见 [registry.ts:194–209, 229–270, 741–746](../../packages/client/ui-renderer/src/client/registry.ts)。

对于 `single`，整个 Slot 是一个单元；对于 `keyed`，每个键是一个单元；对于 `list`，每个 ID 是一个单元。数值较小的 `priority` 赢得对应单元，相同单元和优先级的重复注册会抛错。不同 list ID 可以追加，并按 `order` 升序渲染；同序条目保持稳定的登记顺序。见 [ui-slots index.ts:1266–1304, 1351–1358, 1415–1427](../../packages/client/ui-slots/src/index.ts) 和 [scoped-slots.tsx:1483–1498](../../packages/client/ui-renderer/src/client/scoped-slots.tsx)。

只有声明子 Slot 的内容拥有渲染该子 Slot 的权限，见 [scoped-slots.tsx:70–85](../../packages/client/ui-renderer/src/client/scoped-slots.tsx)。因此，遮蔽父级不会自动将原内容的子注册带入替代内容。

-----

<a id="native-dependencies"></a>
## 原生依赖

布局插件在 [ui-layout index.ts:153–154](../../packages/client/ui-layout/src/client/index.ts) 直接注入 slots、theme、locale 和 shortcuts；第 188–243 行提供布局状态并注册侧栏快捷键和主题呈现器。主导航通过布局状态选择面板，而非通用 URL 路由器：[AppFrame.tsx:45–50](../../packages/client/ui-layout/src/client/AppFrame.tsx) 选择键，[ui-sidebar index.ts:83](../../packages/client/ui-sidebar/src/client/index.ts) 调用 `selectPanel`。

原生 Conversation、Session、Approval、Workspace、Files 和 Terminal 界面依赖各自的客户端注册与后代 Slot；仅保留 AppFrame 并不能证明它们仍可运行。原生 Approval UI 在 [ui-approval index.ts:97–107](../../packages/client/ui-approval/src/client/index.ts) 注册到 Conversation composer 并监听远程请求；Files 和 Terminal 在 [ui-sidebar-files index.ts:174](../../packages/client/ui-sidebar-files/src/client/index.ts) 和 [ui-sidebar-terminal index.ts:73–95](../../packages/client/ui-sidebar-terminal/src/client/index.ts) 注册到原生右 Sidebar。

功能插件通过自身界面和浮层注册提供对话框和短暂反馈，例如 [ui-workspace index.ts:395](../../packages/client/ui-workspace/src/client/index.ts)。[ui-commands index.ts:51](../../packages/client/ui-commands/src/client/index.ts) 中确认的命令界面处理 Conversation 斜杠命令；本审计未确认存在通用 Command Palette。Workbench Profile 中的主题、语言、对话框、Toast、快捷键和原生能力行为均尚未验证。

-----

<a id="workbench-limitations"></a>
## Workbench 限制

原生右 Sidebar 仅在 `activePanelId` 为 `null` 时显示 Session 内容；全局主面板会隐藏这些视图，见 [RightbarRoot.tsx:17–25, 34–37](../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)。屏幕上的 Session 选择和面板声明也绑定 Session，见 [ui-sidebar-right index.ts:164–175, 232–247](../../packages/client/ui-sidebar-right/src/client/index.ts)。

因此，以非 Conversation 主面板键注册的独立 Home 不能通过原生右 Sidebar 的现有子 Slot 显示常驻 Agent Context。遮蔽整个 `rightbar` 也会隐藏原内容及其 Files 和 Terminal 位置。`shell.overlay` 是浮层，不是由布局管理的右列；将它用于右列需要自行处理尺寸、遮挡和原生侧栏协调，本审计尚未验证这种方式。

所要求的 Home 三列布局缺少一个由布局管理的全局右侧扩展位置，使其能够与原生 Session 右 Sidebar 共存或安全组合。上述源码证据确认了原生内容的限制，并未排除所有其他设计。按照任务要求，Shell 实现已在此限制处暂停。

Desktop Profile 选择是独立的待确认问题：[paths.ts:17–20](../../apps/desktop/src/paths.ts) 选择 `profiles/desktop`，[desktop-host index.ts:22–34](../../apps/desktop-host/src/index.ts) 加载 `projectDir` 并以 `desktop` 作为 Profile 名启动。本审计尚未验证 Desktop 是否支持直接选择单独命名的 Workbench Profile；这些观察不能证明不存在其他集成方式。

-----

<a id="dev-note"></a>
## 开发备注

上述结论来自源码检查。本次审计未执行 Workbench UI、插件卸载或原生能力保留测试。
