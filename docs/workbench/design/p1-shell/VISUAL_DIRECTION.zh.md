# P1 Desktop 视觉方向

[English](VISUAL_DIRECTION.md) | 中文

## 摘要

Workbench 希望形成精致、通透、克制且层次清晰的 Desktop 界面，同时保留长时间技术工作所需的信息密度。本文定义两种待比较方向；二者均未批准或实现。

## 目录

- [共同原则](#shared-principles)
- [待比较方向](#directions-to-compare)
- [比较要求](#required-comparison)
- [决策与证据](#decision-and-evidence)
- [开发备注](#dev-note)

-----

<a id="shared-principles"></a>
## 共同原则

适用时复用原生 DSH 组件、语义主题 Token 和交互。Workbench 可以在壳层、Home、Context 和导航中建立产品识别，不为追求视觉统一而重绘原生 Conversation、Terminal 或 Files。

用间距区分内容分组和阅读层级，而不是放大所有表面。Home 和 Context 可以更舒展；Terminal、文件列表、日志和技术状态仍保持实用密度。文字、图标、边界、焦点、选中、禁用和错误状态在明暗模式及用户字号下都必须清晰可辨。

受控毛玻璃是可选材质，而非所有表面的统一处理。适用位置、不透明回退、对比度、性能和无障碍要求见[材质指南](MATERIAL_GUIDELINES.zh.md)。

-----

<a id="directions-to-compare"></a>
## 待比较方向

| 方向 | 设计意图 | 预期取舍 |
|---|---|---|
| A：原生延续型 | 保留原生 DSH 布局、配色和组件，仅在少量浮层或窗口层使用玻璃，并改善排版与间距。 | 视觉迁移和集成成本较低；Workbench 的产品识别较弱。 |
| B：轻度产品化型 | 保留原生基础，通过受控半透明材质、细腻边界和明确的空间节奏区分 Workbench 壳层、Home、Context 与全局导航。 | 产品识别更清晰；Token 映射、性能和兼容性需要更仔细评审。 |

优先探索 B，但必须在同等页面上比较两个方向。最终方向需要用户评审；本文中的视觉偏好不授权修改生产 UI。

-----

<a id="required-comparison"></a>
## 比较要求

每个方向都需要相同的可编辑设计状态：Home 与全局 Context；Conversation 与原生 Session 栏；Conversation 与全局 Context；窄窗口右栏行为；Appearance Settings；以及主题导入的预览、失败、取消和恢复。至少展示同一表面在玻璃开启和不透明回退时的对比。

比较原生兼容性、产品识别、信息密度、阅读舒适度、空间层次、对比度、GPU 与窗口合成成本、自定义主题一致性及实现工作量。覆盖明暗外观、键盘焦点、缩放字号和中英文混排。现有单轨右栏方案仍须按[右栏 ADR](../../GLOBAL_RIGHTBAR_ADR.zh.md)单独批准。

-----

<a id="decision-and-evidence"></a>
## 决策与证据

取得同等范围的可编辑原型和 Windows Desktop 真实参考后，再由设计评审选择方向。记录每份设计的来源和版本、代表性背景上的对比度、不透明与减少透明效果表现及未解决取舍；不能把静态设计描述为已交付能力。

设计必须包含外观控制和主题导入入口，其行为和交付阶段由[原型计划](../../P1_PROTOTYPE_PLAN.zh.md)和[路线图](../../DEVELOPMENT_ROADMAP.zh.md)规定。设计入口不等于实现文件导入或设置持久化。

-----

<a id="dev-note"></a>
## 开发备注

用户尚未批准视觉方向。本提议不复制其他产品界面，也不授权生产 UI 实现。
