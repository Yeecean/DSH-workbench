# 原生 Desktop 设计审计

[English](DESIGN_AUDIT.md) | 中文

## 摘要

本审计区分源码观察和实际视觉检查。隔离的原生 Desktop 实例显示了首次启动欢迎页，已进行视觉检查。Conversation、Terminal、Files 和设置页面需要身份认证或 API Key，尚未进行视觉检查。

## 源码观察

原生布局在 AppFrame 下保留侧栏、带键主面板和 Session 右栏（[布局声明](../../../../packages/client/ui-layout/src/client/index.ts#L59)）。全局面板会隐藏 Session 右栏视图（[RightbarRoot](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx#L34)）；Workbench 提议的全局 Context 不是现有原生视图。

主题归属、实际 Token 名称、字体和设置见[主题系统](THEME_SYSTEM_SPEC.zh.md)与 [Token 映射](TOKEN_MAPPING.zh.md)。源码存在不等于明暗、高 DPI 或无障碍状态均已通过视觉验证。

[原生欢迎页截图](exports/native-welcome.png)展示了深色不透明表面、原生产品标识，以及登录和 API Key 入口。它不能证明工作界面的视觉效果，也不能证明其对比度满足无障碍要求。

## 后续视觉检查

在实际 Windows Desktop 中检查明暗外观，包括 Conversation、Session 右栏、Terminal、Files、设置和窄窗口。保存截图，比较可读性、密度、焦点与原生控件，再批准最终视觉方向。使用隔离测试 Home，并在启动器准备之前检查固定开发项目路径，详见 [Desktop Profile 报告](../../DESKTOP_PROFILE_FEASIBILITY.zh.md)。

## 开发备注

本次审计没有发起模型请求，也没有修改生产界面。
