# P1 Workbench 设计系统

[English](DESIGN_SYSTEM.md) | 中文

## 摘要

本提议围绕原生 DSH 主题归属、共享控件和语义角色组织 Workbench 外观。具体值、组件表现和最终视觉方向需要设计评审与 Windows 验证。

## 目录

- [原生基础](#native-foundation)
- [语义角色](#semantic-roles)
- [排版与密度](#typography-and-density)
- [控件与无障碍](#controls-and-accessibility)
- [验证](#validation)
- [开发备注](#dev-note)

-----

<a id="native-foundation"></a>
## 原生基础

原生主题提供浅色、深色和跟随系统偏好，以及分别面向文本、代码和终端的字体设置（[theme-settings.ts:6–63](../../../../packages/client/ui-theme/src/theme-settings.ts)）。基础样式定义文本与代码的回退字体栈和圆角值（[base.css:7–31](../../../../packages/client/ui-theme/src/styles/base.css)）。原生 General Settings Slot 已接收外观和字体设置行（[ui-theme index.ts:630–653](../../../../packages/client/ui-theme/src/client/index.ts)）。

适用时复用这些归属者和现有共享基础组件。产品专属外观、颜色控件和文件导入属于提议，不能据此声称 Workbench 设置页面已经存在。[主题系统](THEME_SYSTEM_SPEC.zh.md)和 [Token 映射](TOKEN_MAPPING.zh.md)区分现有值与拟议角色。

-----

<a id="semantic-roles"></a>
## 语义角色

| 角色 | 拟议用途 |
|---|---|
| 表面与内容 | 适用时使用原生语义别名区分基底、抬升、浮动、主要和次要内容。 |
| 交互与反馈 | 将操作、焦点、成功、警告和错误含义与用户选择的强调色区分。 |
| 形状与空间 | 复用已有圆角角色；检查现有值后再建立有名称的窗口、分组、行和控件间距。 |
| 材质 | 将模糊、透明度、玻璃边界和不透明回退定义为材质角色，而不是各组件单独实现的效果。 |

每个新增角色需要名称、归属者、明暗模式值和可读的回退值。不通过主题输入开放未经审查的任意 CSS。[材质指南](MATERIAL_GUIDELINES.zh.md)规定玻璃的使用位置及实际渲染背景的评估方式。

-----

<a id="typography-and-density"></a>
## 排版与密度

为标题、正文、辅助说明和元信息建立克制的层级。Home 和 Context 可以使用较宽的分组间距，Conversation、Terminal、Files 和技术列表保持实用的行密度。相同角色保持视觉一致，不为每个组件单独指定字号或间距。

在高 DPI 和用户字号下检查中英文混排、数字、代码符号、字体回退和 Terminal 等宽对齐。现有内容字号不是通用 UI 缩放控制（[theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)）；更广泛的 Workbench 缩放需要单独设计和验证。

-----

<a id="controls-and-accessibility"></a>
## 控件与无障碍

优先使用共享 Button、Menu、Modal、Tooltip 和 Toast 控件，并保留其记录的键盘和焦点行为（[ui-primitives 清单:45–71](../../../../packages/client/ui-primitives/README.zh.md)）。导航标签、危险操作确认、加载、空、错误和禁用状态不能只依赖颜色或模糊表达含义。

在实际明暗表面以及代表性玻璃背景上测量普通文字、大文字、图标、边界和焦点指示。保持键盘顺序和可见焦点，尊重受支持的减少动态和透明效果偏好，并提供不透明回退。对比度目标和平台评审见[材质指南](MATERIAL_GUIDELINES.zh.md)。

-----

<a id="validation"></a>
## 验证

在相同的 Home、Conversation、Context、Session 栏、窄窗口、外观设置和导入状态上比较两种拟议视觉方向。评审 Windows Desktop 真实参考、字体回退、不透明回退、缩放、窗口调整和组件保留情况；设计稿不能证明运行时行为。

-----

<a id="dev-note"></a>
## 开发备注

本提议尚未批准，不建立平行 Theme Runtime，也不改变原生功能归属。
