# 工作报告｜2026-11-14 文档治理

- Status: CONDITIONAL（文档结构与链接可静态核查，未执行本地构建/测试）
- Baseline branch: `workbench-p1-work-code-ux-spec`
- Baseline commit: `f1dfebed4d6d1a4dfc8fc7085cb36b73a1d8b7f4`
- Execution branch: `docs/workbench-documentation-governance-20261114`
- Related instruction: 本轮由用户对话直接授权，未预先生成独立指令文件；不补造历史记录。
- Related architecture: [WORKBENCH_ARCHITECTURE.zh.md](../../docs/workbench/WORKBENCH_ARCHITECTURE.zh.md)
- Commit SHA: PENDING（本文件与实现同提交；提交后在下一提交或 PR 记录中关联）

## 修改内容

1. 新增中英文 Workbench 专属 README，保持上游 README 的正文与独立身份。
2. 新增文档治理和权威性说明，明确原始架构优先、指令—提交—验证—验收追踪链。
3. 新增指令目录、工作报告目录索引及可复制模板。
4. 增加 [P8-S1 发布链路安全整改详细执行指令](../../docs/workbench/instructions/2026-11-14-p8-s1-signing-isolation/INSTRUCTION.md) 并更新指令索引；仅编写指令，**没有执行 S1 代码、真实签名或发布**。
5. 保留早期 P0/P1 文档、已有 `DEVELOPMENT_ROADMAP` 和原有安装器/更新器报告，不伪造历史指令或验收结果。

## 验证

- 已读取原仓库树、上游根 README、Workbench 旧版文档及现存工作报告，避免覆盖。
- 本次仅新增 Markdown 与上游 README 的导航链接；未运行本地 pnpm、lint、桌面测试或 Windows 设备验收。
- 待检查项：GitHub PR diff、Markdown 互链与仓库现有文档/i18n 规则。

## 已知风险和范围

- 原有 `docs/workbench/README.zh.md` 仍记录第一阶段基线；通过新的入口和治理说明消除误读，不篡改历史状态。
- 现有历史执行指令并非全部在仓内；需要以后基于原始资料逐轮归档。
- 不涉及运行时代码、签名工作流、正式发布权限；本报告不构成发布批准。
