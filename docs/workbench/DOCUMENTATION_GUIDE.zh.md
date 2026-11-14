# Workbench 文档体系与追溯规范

> 适用范围：DSH Workbench 自研变更。保留上游 DSH 文档及其既有翻译、同步规则；本规范不要求重写上游文件。

## 1. 信息分层与权威性

| 层级 | 文件/目录 | 记录的内容 | 判定边界 |
| --- | --- | --- | --- |
| 产品入口 | [WORKBENCH.zh.md](../../WORKBENCH.zh.md) | 定位、边界、导航 | 不替代上游 README |
| 架构 | [WORKBENCH_ARCHITECTURE.zh.md](WORKBENCH_ARCHITECTURE.zh.md)、[EXTENSION_POINTS.zh.md](EXTENSION_POINTS.zh.md)、已批准 ADR | 原创设计原则、职责、接口、决策 | **设计权威**；研究参考不能覆盖 |
| 规划 | [DEVELOPMENT_ROADMAP.zh.md](DEVELOPMENT_ROADMAP.zh.md)、专项规格 | 计划、依赖、验收标准 | **目标**而非当前实现事实 |
| 指令 | [instructions/](instructions/README.md) | 每轮执行 Agent 输入、授权范围与约束 | 不得擅改架构 |
| 实现 | Git commit / diff | 实际提交代码 | **代码事实**，以明确 SHA 和分支复核 |
| 证据 | [workbench-reports/](../../workbench-reports/README.md) | 测试命令、结果、截图/日志路径、问题 | **验证事实**；不能用报告代替运行证据 |
| 验收 | 同轮报告中的验收结论或独立复核 | 通过、条件通过、阻塞、遗留风险 | 不把“测试通过”推断为“发布获准” |

**冲突处理**：实际实现以对应 SHA 源码为准；期望设计以已批准的架构/ADR 为准；两者不一致时记录偏差与决策，不默默以现状改写架构。

## 2. 固定目录与命名

```text
WORKBENCH.md / WORKBENCH.zh.md
docs/workbench/
  DOCUMENTATION_GUIDE.zh.md
  WORKBENCH_ARCHITECTURE*.md     # 保留现有主架构
  DEVELOPMENT_ROADMAP*.md        # 保留现有 P0–P8 路线
  instructions/
    README.md
    TEMPLATE.md
    YYYY-MM-DD-<slug>/INSTRUCTION.md
workbench-reports/
  README.md
  TEMPLATE.md
  YYYY-MM-DD-<slug>/WORK_REPORT.md
  YYYY-MM-DD-<slug>/VERIFICATION.md   # 可选，报告较长时拆分
  YYYY-MM-DD-<slug>/artifacts/        # 可选，轻量、脱敏证据
```

命名以 **执行轮次** 为单位，不使用 commit SHA 作为必须提前存在的目录名：在创建 commit 之前无法确定它自身的 SHA。一个轮次允许多个 commit，但报告必须逐个列出完整 SHA、变更范围与验证映射。允许报告先随实现提交，再在后续提交补齐最终 SHA；不得伪造、猜测或自引用提交 SHA。

## 3. 变更闭环（必须）

1. **规划/决策**：写清所依赖架构、里程碑和 ADR；如需更改原生边界，先提交单独 ADR 审批。
2. **执行前**：从 [指令模板](instructions/TEMPLATE.md) 建立独立 `INSTRUCTION.md`，约定范围、禁止事项、验收标准、回滚策略与授权条件。保存发给 Agent 的最终版本；有中途变更则追加修订记录。
3. **执行中**：控制每个 commit 的职责；提交信息说明变更意图；不要把未经验证的结论写成事实。
4. **提交后**：从 [工作报告模板](../../workbench-reports/TEMPLATE.md) 填写报告，关联指令路径、实际分支、每个 commit 的完整 SHA、文件变更、验证/失败、遗留问题和证据位置。
5. **复核**：明确记录 `PASS / CONDITIONAL / FAIL / NOT_RUN` 及理由。权限敏感、签名和正式发布需要额外安全门禁，不因合并报告即视为批准。
6. **更新索引**：新一轮文档同时加入 [指令索引](instructions/README.md) 和 [报告索引](../../workbench-reports/README.md)；关联实际 PR/commit，保持历史记录不被覆盖。

**最小要求**：每个功能性 commit 都应能经由轮次报告追踪到执行指令和验证情况；纯格式/文档维护 commit 可共用同轮报告，但仍需列出 SHA 或说明待回填。

## 4. 证据与安全约束

- 区分 **计划、代码修改、单元测试、集成测试、真实环境验收、未执行项**。
- 记录可复跑命令、运行环境、结果计数、失败/跳过原因及实际日志位置；未提交的本地证据标为“仅本机”，不得宣称仓库已保存。
- 不提交 Token、PIN、密钥、用户隐私、真实设备标识或敏感日志；大体积构建产物置于受控 CI Artifact/Release 并记录 SHA-256。
- 不因文档整理自动修改 Git 分支策略、上游 README 的原始内容、生产签名配置或发布开关。
- 优先以增量索引方式整理既有目录；旧报告保持原位，必要时做交叉链接，不虚构缺失的历史指令。

## 5. 文档状态与维护

建议文档头部写 `Status: Proposal / Approved / Implemented / Superseded`、`Owner`、`Updated`、`Related`。ADR 获批前为 Proposal；历史基线材料保留并清楚标注适用时间范围。项目现有多语言原生文档由其既有 i18n 流程管理；新中文治理文档未来需要英语版本时按仓库惯例补齐。
