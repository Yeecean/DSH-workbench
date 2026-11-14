# 主题系统规范

[English](THEME_SYSTEM_SPEC.md) | 中文

## 摘要

本设计提议让 Workbench 页面复用原生主题归属者。颜色控件和导入主题属于规划；其持久化与 Windows 行为尚未验证。

## 目录

- [原生能力](#native-capabilities)
- [拟议职责](#proposed-responsibilities)
- [交付与验收](#delivery-and-acceptance)
- [开发备注](#dev-note)

-----

<a id="native-capabilities"></a>
## 原生能力

Host 在 [ui-theme index.ts:37–62](../../../../packages/client/ui-theme/src/index.ts) 注册主题配置和启动注入；Client 在 [client index.ts:170–220](../../../../packages/client/ui-theme/src/client/index.ts) 管理 `ThemeRuntime`、变更事件和插件注册。内置选项为 `light`、`dark`、`system`（[theme-settings.ts:6–21](../../../../packages/client/ui-theme/src/theme-settings.ts)）。

现有设置分别提供文本、代码和终端的字体族与字号；文本字号影响 Conversation 内容，并非所有界面组件（[theme-settings.ts:24–63](../../../../packages/client/ui-theme/src/theme-settings.ts)）。General 设置通过 Slot 接收外观和字体控件（[client index.ts:630–650](../../../../packages/client/ui-theme/src/client/index.ts)）。

设置服务通过活动 Profile 的配置编辑器写入可编辑值（[settings index.ts:343–350, 378–391](../../../../packages/settings/settings/src/index.ts)）；旧 `settings.yaml` 只用于历史迁移，不是当前写入目标（[settings index.ts:238–257](../../../../packages/settings/settings/src/index.ts)）。Desktop 的 Host 使用 Web Client（[architecture.md](../../../architecture.zh.md)）；共用代码本身不能证明各平台行为完全一致。

布局呈现器把调色板属性、语义 Token 和字体变量投射到页面（[theme-presenter.ts:69–90](../../../../packages/client/ui-layout/src/client/theme-presenter.ts)）；Host 的启动注入覆盖插件加载前的时间段（[boot-theme.ts:47–62](../../../../packages/client/ui-theme/src/boot-theme.ts)）。主题注册和双模式 Token 覆盖层都带有清理函数（[client index.ts:344–396](../../../../packages/client/ui-theme/src/client/index.ts)）。`setTheme` 仅写入内置偏好 ID；通过此路径选择注册的自定义 ID 不会持久化（[client index.ts:252–265](../../../../packages/client/ui-theme/src/client/index.ts)）。

-----

<a id="proposed-responsibilities"></a>
## 拟议职责

Workbench 消费现有语义颜色、字体 Token 和基础组件；仅在现有角色不足时，提议新增有名称和文档的材质或间距别名。[Token 映射](TOKEN_MAPPING.zh.md)区分现有变量与拟议角色。

主题选择、字体和可选表面材质属于呈现设置，不得修改 Agent Runtime、Session 数据、Terminal 状态或插件业务状态。主题变更必须保留原生 Conversation、Terminal、Files 行为，不能仅为变色重新挂载它们。

外观应提供浅色、深色和跟随系统模式；拟议强调色和表面控件必须验证两种模式的对比度。字体列表需要验证中英文回退、代码字符、等宽终端单元对齐以及 DPI 和缩放。字体不可用时使用原生回退字体栈。

第三方主题注册属于受信任的插件代码，可包含图标替换；它不是安全的文件导入接口（[client index.ts:72–96](../../../../packages/client/ui-theme/src/client/index.ts)）。导入数据文件需要采用[主题导入](THEME_IMPORT_SPEC.zh.md)中的独立约束设计。

-----

<a id="delivery-and-acceptance"></a>
## 交付与验收

P1 设计覆盖明暗模式、克制毛玻璃、实色回退、基础外观控件和导入预览。P1 实现应复用原生字体与内置外观控件，并评估有限的强调色设置。完整版本化主题导入在安全可行时纳入 P1；否则明确安排在紧随 P1 的 P1.1，导出和多主题管理在 P2 及以后评估。

验收需要在 Windows Desktop 和 Web 检查启动与重载、设置写入失败、插件清理、对比度、缩放、原生面板保留、字体回退及 Session 不被意外重置。本提议尚未执行这些原型检查。

-----

<a id="dev-note"></a>
## 开发备注

本文记录源码核查和设计意图，不代表拟议的自定义能力已经实现。
