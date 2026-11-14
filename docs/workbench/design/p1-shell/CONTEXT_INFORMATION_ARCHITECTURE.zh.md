# P1 Context 信息架构

[English](CONTEXT_INFORMATION_ARCHITECTURE.md) | 中文

## 摘要

本提议按来源和作用域组织 Context，使 Home 在没有活动 Session 时仍有用。下列字段名称仅是候选，不代表对应 API、权限或实时数据源已经存在。

## 目录

- [作用域与展示优先级](#scope-and-priority)
- [候选分组](#candidate-groups)
- [Session 状态](#session-states)
- [可用性与准入](#availability-and-admission)
- [设计与验证边界](#design-and-verification-limits)
- [开发备注](#dev-note)

-----

<a id="scope-and-priority"></a>
## 作用域与展示优先级

Home 建议以执行环境和 Workspace 为中心：先显示有真实来源的全局执行环境和当前 Workspace，再显示当前 Agent 或模型配置及资源概况。Conversation 内优先展示明确标注的 Session 局部信息，随后显示分别标注的全局和 Agent 分组。此顺序是设计建议，不是数据覆盖规则。

每项事实都需要明确归属和作用域：全局执行环境或 Workspace、Agent 配置，或特定 Session。Session 局部值只代表该 Session；全局值不能静默覆盖它，切换选择时必须替换或清除过期的 Session 局部内容。Workspace、Agent 或数据源缺失时应真实展示，不能自行合成。

当前 `main` 可以切换全局面板而不改变当前 Session（[layout service.ts:27–36](../../../../packages/client/ui-layout/src/client/service.ts)）；原生 Session 右栏在 Conversation 之外隐藏 Session 视图（[RightbarRoot.tsx:17–25, 34–37](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx)）。这些事实解释了作用域分离，但不能证明拟议全局 Context 面板已有 API。

-----

<a id="candidate-groups"></a>
## 候选分组

| 分组与作用域 | 候选内容 | 展示与验证边界 |
|---|---|---|
| 执行环境；全局 | 执行环境身份和连接状态，例如 Windows Native。 | 只有核实提供者和时效后才能显示真实值或实时状态；WSL 在证明接通前保持未来选项。 |
| Workspace；全局或所选 Workspace | 当前 Workspace 或项目身份及工作目录。 | 必须有真实 Host/API 来源及其授权；路径可见不代表可以无限制访问。 |
| Agent；当前配置 | 非敏感 Agent 身份和配置摘要。 | 标注归属者和来源；不得展示凭据、API Key、Token 或私有认证数据。 |
| 模型；当前配置或实际属于 Session 时标注 Session | 非敏感 Provider 和模型名称。 | 展示当前状态前确认真实来源与作用域；不推断认证详情。 |
| 资源；明确标注作用域 | 分别展示 Skills、MCP、Tools 和 Plugins 等类别。 | 区分已安装、当前可用和 Session/Agent 已准入；不能从插件库存推断工具调用权限。 |
| Session；仅所选 Session | 具有已验证来源的非敏感局部信息。 | 仅在活动 Session 存在时显示并标识该 Session；切换时清除或替换字段。 |

P1 仅从数据来源、作用域、权限和刷新行为均已核实的字段开始。更丰富的活动、资源搜索及分组详情需要单独的数据契约，可以安排在 P2 或之后；不能用虚构的计数、Token 消耗、任务总数或活动填充 P1 设计。

-----

<a id="session-states"></a>
## Session 状态

| 状态 | 拟议 Context 呈现 |
|---|---|
| 没有活动 Session | 存在真实来源时保留全局执行环境、Workspace 和 Agent 分组。Session 局部内容显示清晰空状态或不显示；数据源缺失应有独立的不可用状态。 |
| 存在活动 Session | 标识所选 Session，并将其局部分组与全局 Workspace 和 Agent 配置分开。切换 Session 时先清除过期局部值，再显示新近核实的数据。 |
| 没有活动 Workspace 或 Agent | 对相应分组展示真实空状态或不可用状态；不能推断本地目录访问权限或虚构 Agent。 |

没有 Session 局部字段时页面仍须有用。视觉原型中的示例值必须标为示例数据，不能代替运行时证据。

-----

<a id="availability-and-admission"></a>
## 可用性与准入

`已安装`表示出现在明确的库存中；`可用`表示负责的提供者当前报告资源可用；`已准入`表示明确的 Agent 或 Session 被允许使用该资源。这些是拟议展示标签，不是可以互换的事实，也不代表现有 API 已提供同名字段。未知、加载中、不可用和错误必须与空集合或操作被拒绝分开。

不能仅因 Plugin 已安装，就称 Agent 可以调用它。展示徽标或操作前先确认每个信号的权威来源、时效和作用域；没有可靠来源时省略字段或标为不可用，不能猜测。

-----

<a id="design-and-verification-limits"></a>
## 设计与验证边界

设计无 Session 和有 Session 两种状态，以及 Workspace 缺失、加载中、不可用和错误状态。内容增长时采用渐进分组或折叠；搜索在作用域和数据契约有充分理由前属于后续选项。视觉比较不能暗示分组、数据刷新或导航已经实现。

验证每个拟议 P1 字段的数据归属和权限、Session 切换与过期数据清理、键盘访问、窄窗口及独立右栏生命周期。按照[交互规范](INTERACTION_SPEC.zh.md)和[右栏 ADR](../../GLOBAL_RIGHTBAR_ADR.zh.md)保留原生 Session、Terminal、Files 和单轨仲裁。

-----

<a id="dev-note"></a>
## 开发备注

本文是待评审设计，不声称已经绑定 Context 数据、实现授权状态或完成运行时验证。
