# P1 组件映射

[English](COMPONENT_MAPPING.md) | 中文

## 摘要

本映射区分现有原生 UI 归属者与拟议的 Workbench 贡献。原生源码入口只能确认代码归属，不能证明未来原型已经集成成功。

## 目录

- [现有归属者与拟议用法](#existing-owners)
- [复用规则](#reuse-rules)
- [开发备注](#dev-note)

-----

<a id="existing-owners"></a>
## 现有归属者与拟议用法

| 界面 | 原生源码 | 拟议 Workbench 用法 |
|---|---|---|
| 框架与导航 | [AppFrame Slot 声明:192–201](../../../../packages/client/ui-layout/src/client/index.ts)、[Sidebar 位置:89–116](../../../../packages/client/ui-sidebar/src/client/index.ts) | 保留框架和侧栏，通过受支持的内部位置贡献品牌与导航。 |
| Home | [主面板选择:45–50](../../../../packages/client/ui-layout/src/client/AppFrame.tsx)、[Plugins 示例:129–173](../../../../packages/client/ui-plugin-manager/src/client/index.ts) | 批准后增加带键的主面板和导航入口；Home 尚未实现。 |
| Session 与审批 | [Conversation 主面板:586](../../../../packages/client/ui-conversation/src/client/apply.ts)、[审批输入区:97–107](../../../../packages/client/ui-approval/src/client/index.ts) | 保留现有 Conversation 输入链和审批 UI，并在原型中验证真实行为。 |
| Terminal 与 Files | [Terminal 贡献:73–95](../../../../packages/client/ui-sidebar-terminal/src/client/index.ts)、[Files 贡献:174](../../../../packages/client/ui-sidebar-files/src/client/index.ts) | 保留原生 Session 右栏入口和服务，不建立平行产品实现。 |
| 全局 Context | [Session 右栏可见条件:34–37](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx) | 拟议全局 Slot 和布局仲裁尚未实现，[ADR](../../GLOBAL_RIGHTBAR_ADR.zh.md)仍待批准。 |
| Appearance | [原生外观与字体设置行:630–653](../../../../packages/client/ui-theme/src/client/index.ts) | 适用时复用现有控件；Workbench 专属外观设计和新增颜色控件尚未实现。 |
| 主题文件导入 | [原生主题注册:344–396](../../../../packages/client/ui-theme/src/client/index.ts) | 纯数据导入、预览、校验和恢复流程属于提议，现有注册并非文件导入 API。 |
| 菜单与对话框 | [共享基础组件清单:45–71](../../../../packages/client/ui-primitives/README.zh.md)、[Workspace 浮层注册:395–403](../../../../packages/client/ui-workspace/src/client/index.ts) | 兼容时复用共享基础组件和原生浮层注册；不使用浮层充当右栏列。 |

-----

<a id="reuse-rules"></a>
## 复用规则

功能插件不能在运行时导入或重导出其他功能插件；行为通过注入服务传递，UI 通过授权 Slot 组合（[客户端规则:40](../../../../packages/client/AGENTS.md)）。共享控件应归属 `ui-primitives` 等合适的静态所有者，贡献使用等待声明的 Slot 生命周期（[客户端规则:152](../../../../packages/client/AGENTS.md)）。

替换 `root` 或整个 Session `rightbar` 会丢失原生子 Slot 归属，超出 P1 范围。材质、排版或颜色调整不意味着可以跨功能插件导入组件；提议复用前应检查实际公开控件或 Slot。

-----

<a id="dev-note"></a>
## 开发备注

本映射不声称 Workbench 产品 UI、全局右栏扩展或文件导入流程已经实现或测试。
