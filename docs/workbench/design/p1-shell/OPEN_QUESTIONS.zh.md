# P1 视觉设计待决事项

[English](OPEN_QUESTIONS.md) | 中文

## 摘要

这些决策需要用户评审视觉方案与架构证据后确定。原型图和计划中的行为不能证明产品能力已经实现。

## 目录

- [待决事项](#decisions)
- [所需证据](#evidence-required)
- [开发备注](#dev-note)

-----

<a id="decisions"></a>
## 待决事项

| 决策 | 当前建议和取舍 |
|---|---|
| 视觉方向 | 在相同页面上比较原生延续型 A 与轻度产品化型 B；优先探索 B，评审前不确定最终方向。 |
| Context 与 Session 栏 | [右栏 ADR](../../GLOBAL_RIGHTBAR_ADR.zh.md)提议仲裁单条轨道；需要决定切换是否可接受，还是必须采用可同时显示的其他布局。 |
| Desktop Profile | [Profile 报告](../../DESKTOP_PROFILE_FEASIBILITY.zh.md)提议在独立 Harness Home 使用保留的 `desktop` Profile；需要决定原型能否使用此方式，还是必须让 Electron 支持独立命名 Profile。 |
| 主题字段 | 评审[主题系统](THEME_SYSTEM_SPEC.zh.md)、兼容性和实际原型后，决定支持哪些强调色、表面色、字体、字号、材质和无障碍控件。 |
| 主题导入排期 | 导入必须最迟在 P1.1 交付；需要决定经审计的基础设施是否足以安全提前到 P1。导出和主题收藏可以在 P2 或之后评估。 |
| 原生视觉对比 | 评审一致的玻璃与不透明示例、明暗模式、对比度、密度、性能和 Windows Desktop 真实参考后，再决定最终材质表现。 |

-----

<a id="evidence-required"></a>
## 所需证据

评审两种方向的可编辑设计源及相同的 Home、Conversation、Context、Session 栏、窄窗口、外观设置和导入状态。评审需要真实 Windows 参考与记录的测量值；完成前不得把计划中的比较标为已验证。

主题导入需要版本化纯数据格式、白名单校验、预览与明确应用、取消、失败时不丢失当前主题，以及恢复默认或回退。[导入规范](THEME_IMPORT_SPEC.zh.md)描述拟议边界；设计图片不是可运行的导入器。

布局与 Desktop Profile 决策独立于视觉方向。生产实现超出本次设计评审范围，仍需取得[原型计划](../../P1_PROTOTYPE_PLAN.zh.md)中记录的批准。

-----

<a id="dev-note"></a>
## 开发备注

本清单中的建议即使优先探索，也不代表用户已经批准。
