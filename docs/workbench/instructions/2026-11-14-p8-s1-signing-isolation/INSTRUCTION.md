# P8-S1 · Windows 发布链路安全整改执行指令

> Status: **Ready for implementation / 未执行**  
> Date: 2026-11-14  
> Scope: P8 发布安全整改 S1（代码、静态检查、模拟验收）；**不包含 S2 硬件签名联调或真实发布**。  
> Target repo: Yeecean/DSH-workbench  
> Baseline: `workbench-p1-work-code-ux-spec`（编写时 HEAD `f1dfebed4d6d1a4dfc8fc7085cb36b73a1d8b7f4`；执行前重新核对远端 HEAD）  
> Documentation PR: [#1](https://github.com/Yeecean/DSH-workbench/pull/1)（本指令所在 PR；先确认已合并，或从该 PR 分支继承文档，不要丢失归档）  
> Follow-up report: `workbench-reports/2026-11-14-p8-s1-signing-isolation/WORK_REPORT.md`（**执行时创建**，路径日期可按实际执行日期调整，并同步索引）。

## 0. 给执行 Agent 的直接任务

请在当前 **DSH Workbench 原创架构**之内完成 P8-S1：消除未审查源码与 Windows 硬件签名环境的潜在交叉，将 Windows Packaging 改为 **默认 unsigned、前置可信授权策略、普通构建与签名权限隔离、产物完整性/来源追踪、发布端严格拒绝不合格制品**。同时解决相关 CI 测试的确定性问题。

本轮**允许实现代码与测试，但不允许实际调用硬件签名、触碰 EV Token/PIN、生产 COS、宿主机既有安装、真实 OTA 或发布权限配置**。在真正的物理签名隔离、GitHub 受保护来源/Environment 审批和无 CLI PIN 实现尚未具备前，**任何 signed 执行路径必须 fail closed（拒绝执行）**；只可通过模拟对象/假制品验证未来签名流程的逻辑。不得以“Workflow YAML 中写了 environment”就宣称签名隔离已经生效。

本任务是上次审查确定的**发布阻断项修复**，不是重新设计 Agent Runtime、UI 或 P7 WSL。不要因为参考 Open Cowork、Claude、Codex 等外部产品而替换项目架构。

### 关联的设计/事实依据

- [原创架构](../../WORKBENCH_ARCHITECTURE.zh.md)、[P0–P8 路线](../../DEVELOPMENT_ROADMAP.zh.md)、[文档规范](../DOCUMENTATION_GUIDE.zh.md)。
- [上一轮签名/安装器/更新器报告](../../../workbench-reports/2026-11-14-round2-signing-installer-updater/WORK_REPORT.md)，重点 `2.1–2.5`；**其中方案为设计建议，不等于已实施**。
- 现状（编写时核实）：`.github/workflows/windows-package.yml` 的 `signing` 默认 `signed`，`package` 使用 `dsh-win-package-trial` 自托管 Runner，`test` 对任意仓内开发分支开放；`apps/desktop/scripts/windows-sign.cmd` 仍把 Token PIN 写入 SignTool 命令参数；`apps/desktop/scripts/desktop-release-store.ts` 采用 `schemaVersion: 1` 且仅记录 SHA-512；`scripts/windows-package-workflow.spec.ts` 有依赖旧 workflow 形状的断言及曾经的 PowerShell 超时。**以上是代码基线事实，不是本轮结果。**

## 1. 作业边界和禁止事项（必须先检查）

1. `git fetch` 后确认目标开发分支、工作区状态、当前 SHA。基于真实开发分支新建 `feature/p8-s1-windows-release-security`；不要从过时的 `main` 开始；不要覆盖、清理或重置用户现有未跟踪文件。
2. 快速阅读现有 `AGENTS.md`、`docs/architecture.md`、`docs/workbench/` 内相关设计及构建/签名脚本。列一份**实际调用链**：`windows-package.yml` → 环境与打包适配 → 产物存储 → `desktop-publish.yml` / 上传校验；记录每个节点可访问的 Runner、凭据、制品和代码来源。
3. 若发现方案要求修改 Agent Loop、Session、Host/Client RPC、Renderer 安全边界，立即停止该部分并提交 ADR 供审核。本轮默认**不得修改这些契约**。
4. **绝对禁止**：实际 PIN、证书私钥、EV Token 操作；生产或测试 COS 写入；创建仓内 `apps/desktop/.env.windows`；安装/卸载正式客户端；运行真实签名工作流；接触、复用或清理用户既有机器级缓存、安装目录、凭据目录；关闭已有安全检查以“让测试通过”。
5. 禁止直接 push/merge 到 `master` 或开发主线；所有代码放在功能分支和待审 PR。提交报告时附上具体 SHA 和验证数据。

## 2. 先实施来源与授权策略（S1-A）

建议抽离可单测的纯函数/脚本，例如 `apps/desktop/scripts/windows-package-policy.mjs`，供工作流前置校验与本地辅助校验共享，避免在 YAML、`prepare-windows-ci.mjs` 和 Release Store 中出现不同规则。

### 2.1 拒绝优先的组合矩阵

| 来源 | test + unsigned | test + signed | production + unsigned | production + signed |
| --- | --- | --- | --- | --- |
| 任意开发分支 | **允许仅无凭据构建** | **拒绝** | **拒绝** | **拒绝** |
| 可信、受保护的 master | **允许仅无凭据构建** | 仅在 S2 门禁全部就绪后才可能放行；S1 **拒绝** | 建议拒绝 | 仅在 S2 门禁全部就绪后才可能放行；S1 **拒绝** |
| 明确允许的受保护发布 tag | 按既有版本规则允许无凭据构建 | S1 **拒绝** | 拒绝 | S1 **拒绝** |
| SHA、PR ref、非白名单 tag、外部仓库或不明确来源 | **拒绝** | **拒绝** | **拒绝** | **拒绝** |

**关键约束：**“字符串等于 master”并不证明该分支受保护；用户可选择的 `source_ref`、`preset`、`signing` 也不等于可信授权。必须结合 GitHub 受保护 refs/规则集、授权者身份、审批环境与不可篡改的 commit 身份设计 S2 的放行条件。**仓库此前未验证 master 的保护规则已开启**；如未配置则记录为管理端阻塞项，不能悄悄假定配置存在。S1 应采用更严格的“一律拒绝 signed”而不是以不充分检查临时放行。

### 2.2 Workflow 前置门禁

- `.github/workflows/windows-package.yml` 将签名输入默认改为 `unsigned`，文案明确 unsigned 仅调试、不具备发布资格。
- 加入**不依赖 Windows 自托管机器、不得访问签名/COS 凭据**的 `preflight-policy` Job；先校验用户输入、ref 格式、仓库、来源身份、tag/版本关联及权限，再允许任何构建 Job 被调度。
- 不能先启动具有 Token 权限的 Runner、`pnpm install` 或执行未经验证的源码后才进行策略检查。
- 禁止使用不受信任的 PR/源码分支来执行签名策略脚本；策略代码应来自经审查的可信工作流版本。警惕工作流执行 ref 和源码 `source_ref` 是两种独立信任主体；不能仅凭 `github.workflow_sha` 字段存在就把某份脚本视为可信。
- 检查 `prepare-windows-ci.mjs`、`desktop-release-store.ts`、`retain-desktop-ci.ts` 及相关发布前置脚本的**重复校验**：signed 元数据和 unsigned 制品不得被参数伪装、重新标记或绕过前置拦截。
- 对失败路径给出明确但不泄密的报错，必须在任何有凭据的 Job 前终止。

## 3. 分离构建和签名权限域（S1-B）

把现有 `package` “同机执行任意源码安装依赖 + 签名”的组合拆分为**无密钥构建**与**隔离签名接口**，并保留现有 packaging 环境选择、版本、通道、测试 Release ID、归档语义：

1. **Builder**：只运行允许的 unsigned 编译/NSIS 打包，使用不带 EV Token、PIN、COS 写凭据的账户/Runner。不得把 `dsh-win-package-trial` 自动当作“无密钥”机器；先核实其权限和缓存边界。若无可信无密钥 Windows Runner，可完成离线脚本和模拟验证，并将运行状态标记 `BLOCKED`。
2. **Signer（S1 只实现可审查接口/Job 骨架）**：独立的专用 Runner 标签、工作区、账户和缓存；不得检出可选 `source_ref`，不得运行其 `pnpm install`、postinstall 或任意脚本。**本轮不调度真实 Signer Job，signed 路径必须显式拒绝。** 以后 S2 才能在审批和硬件凭据保护就绪时开放。
3. **制品交接**：Builder 输出不可变 unsigned 制品及 manifest；签名前先重算字节摘要、大小、来源 commit；不得把上传的 manifest 自报“已签名”作为授权依据。禁止可覆盖的 artifact 名称造成跨 run、attempt 或来源混淆。
4. **受控脚本**：Signer 的未来脚本必须来自经过验证的受保护来源和固定 SHA。用于执行的策略/脚本、制品字节与来源证明要绑定同一获批发布意图。不能将用户可改动的 workflow/helper 混同于可信代码。
5. 保持 unsigned 产物可用于**严格隔离**的测试，但不得有任何到 `desktop-publish.yml` / 正式 update feed 的可达路径。

请在 PR 中附上新的 Mermaid 数据/信任边界图，并逐条说明运行账户、Runner labels、机器隔离、缓存 ACL、签名配置目录的关系。没有实际环境证据时一律写“设计/待部署”，不写“已隔离”。

## 4. 不在 S1 触碰 PIN：禁用不安全签名路径

已知 `apps/desktop/scripts/windows-sign.cmd` 当前通过 `/kc` 参数包含 PIN 原文。**不要为赶进度在 S1 试运行它**，也不要以日志掩码、环境变量清空或隐藏 shell 回显声称已修复进程命令行泄漏。

- 在安全策略与测试中静态验证：任何 S1 可达 Job 均不能触发 `windows-sign.cmd` 或其他真实签名入口。
- 记录该脚本为**遗留风险，S2 专项整改**。如本轮需要修改该文件，修改也必须严格保持 signed fail-closed，并新增 argv/环境/日志无明文 PIN 的反回归测试；不能提交“未经硬件验证即可用于生产”的替代实现。
- S2 才评审 Native Signer / CSP 会话方式及硬件验证；必须另外取得明确授权，并检查 Windows 进程创建审计、证书指纹、Authenticode 状态和时间戳行为。

## 5. 制品 Manifest v2 与发布硬阻断（S1-C）

处理 `apps/desktop/scripts/desktop-release-store.ts`、`desktop-upload-plan.ts` 及直接/间接消费者。优先一次实现共享的可测试完整性验证，避免每条路径各写一套哈希逻辑。

### 5.1 数据契约

- 新写入的受控 Release Store 记录采用明确版本化的 `schemaVersion: 2`。每个文件记录 `name`、`size`、`sha256`（64 位小写 hex）及当前 `sha512`（Base64），来源记录与构建/签名溯源记录应与文件摘要明确绑定。
- 来源至少包括 repository、受审查的 source ref、resolved commit SHA、workflow SHA、run ID/attempt、preset/channel/target/version、Builder 身份；未来签名还必须具有可信的 Signer、受控环境、证书指纹和签名时间。**不能靠用户可填字段把 unsigned 伪装成 signed。**
- v1 的处理需明确分流：对已有历史报告可读取/审计，但**不得在缺少 v2 溯源及签名资格时被自动升级为可发布资格**。如果仍需兼容历史部署，明确写出转换/迁移约束和测试，不静默重解释。
- 在签名/发布边界重新读取并核验 SHA-256、SHA-512、size、目标文件、来源与身份；先验证后签名/发布，任意不匹配立即中断。
- `desktop-upload-plan.ts` 的更新元数据 SHA-512 校验应**保留**；额外对照可信 Release Store 清单中的 SHA-256/size，而不是要求修改第三方更新协议为只有 SHA-256。
- 需要校验真实签名的路径，在 S1 只能测**可信模拟校验器**和拒绝路径；S2 再验证 Windows Authenticode 实机证据。明确生产发布需要双哈希 + Authenticode + 预期证书指纹与完整来源链。

### 5.2 发布门禁

- 复核 `.github/workflows/desktop-publish.yml` 的 `route / prepare / publish / upload-website-installer` 及 `preflight-desktop-publish.mjs`、`publish-desktop-ci.ts`；保证在读取敏感发布凭据或上传前即能拒绝 unsigned、缺字段/错误 hash、错误来源、错误 run/attempt、伪造签名状态。
- 不要只检查“包名含 signed”或输入 `qualification=signed`；资格必须来自可信存储并经实际制品验证。
- `master` 当前保护配置未经确认，**禁止**把“仅允许 master 启动工作流”当成发布授权完整闭环。需在报告列出 GitHub 保护规则、环境 reviewer、Runner 实际权限和证书策略等需管理员完成的项目；不要自动改变仓库管理设置。

## 6. 测试与回归验收（S1-D）

### 6.1 必须增加/改造的测试

- `scripts/windows-package-workflow.spec.ts`：适配多 Job 结构，不保留旧 `jobs.package` / 默认 signed 的过时断言；测试所有组合矩阵、preflight 依赖顺序、无密钥 Runner 与 signer 分离、环境门禁、signed fail-closed、unsigned 无发布通路。
- `scripts/desktop-publish-workflow.spec.ts`：拒绝无合格 manifest 的制品和未经授权来源；保留现有 package run/attempt 及批准环境约束。
- `apps/desktop/tests/desktop-release-store.spec.ts`：v2 正常读写、v1 只读不具发布资格、同大小篡改、摘要误配、sourceRef/commit/workflow/attempt 错配、重复/路径穿越、部分拷贝失败、原子性。
- `apps/desktop/tests/desktop-upload-plan.spec.ts` 与相关发布测试：同时核对 SHA-256/SHA-512/size，拒绝缺失签名证明、缺失 hash、伪造签名状态和 unsigned 上传。
- `apps/desktop/tests/windows-sign.spec.ts`：本轮仅验证禁用路径与安全断言，不需要真实 Token；如果未修改签名脚本，测试应诚实体现遗留漏洞不被本轮误报为“已修”。
- 修复上一轮 `scripts/windows-package-workflow.spec.ts` 中 Windows `pwsh` 多次冷启动导致的 5000ms 级超时：优先减少进程启动次数、拆分确定性的纯逻辑测试与 OS 集成测试；**不得仅通过增大 timeout、跳过或删除安全断言处理**。

### 6.2 实际检查

在具备项目依赖的受控环境里执行（具体命令与工作区按项目现有脚本调整）：

~~~sh
git diff --check
pnpm exec vitest run scripts/windows-package-workflow.spec.ts scripts/desktop-publish-workflow.spec.ts
pnpm exec vitest run apps/desktop/tests/desktop-release-store.spec.ts apps/desktop/tests/desktop-upload-plan.spec.ts apps/desktop/tests/windows-sign.spec.ts
pnpm run typecheck
~~~

再执行实际受影响 package 的 Lint、构建与相关完整回归集。对 PowerShell 定向用例，需在 Windows 环境多次重跑并记录各次耗时/失败；非 Windows 下条件跳过不算通过。对所有签名相关真实流程明确写 `NOT_RUN — S2 / 未授权`。

**最低负例矩阵：**开发分支 + signed；master + signed（S1 仍拒绝）；production + unsigned；伪造 tag/ref；被篡改 installer；仅改 manifest 中 qualification；不匹配 run/attempt；缺失/错误双哈希；无审批环境/无专用签名机。每个负例的预期必须是“**拒绝、无凭据侧效应**”。

## 7. 提交节奏、交付和停止条件

建议按逻辑拆成 3–5 个提交（仅建议，按实际变更调整）：

1. `test/security`：来源授权矩阵 + fail-closed 签名策略测试。
2. `ci`：Preflight 与无密钥构建、隔离 Signer 骨架；保留原版本/通道/归档契约。
3. `security/release`：Manifest v2 + 完整性/来源校验 + 发布路径阻断。
4. `test`：跨平台/Windows 回归、解决 PowerShell 超时（仅当真正修复）。
5. `docs`：信任边界图、运维前置条件、工作报告及索引。

执行结束后必须**在仓库**创建同轮 `WORK_REPORT.md`，含：
- 基线、功能分支、PR URL、每个实际 commit 的完整 SHA（无法在自身 commit 内填写则标记 `PENDING` 并在下一提交/PR 更新）。
- 文件变更清单、每项安全风险的前后状态及未完成的 S2 事项。
- 每条测试命令、平台、实际 exit code、通过/失败/跳过计数；本机/CI 证据路径与保留期限，不得杜撰。
- GitHub Environment、分支保护、Runner OS 账户/Token ACL 等**真实配置是否已核实**，未核实写 `BLOCKED / NOT_VERIFIED`。
- 最终结论分为：**S1 代码整改状态**、**是否允许真实 signed**（默认 NO）、**是否允许发布**（默认 NO）。

更新 [指令索引](../README.md) 与 [报告索引](../../../../workbench-reports/README.md)（注意核对实际相对路径）；只把实际完成的事项标记为完成。提交并推送功能分支，创建待审 PR，**不要自行合并、签名、上传或触发发布**。

### 立即停止并报告的情况

出现以下任一情况，不得自行放宽规则：需要真实 Token/PIN、生产上传凭据、Runner 管理员权限、GitHub 管理权限才能验证；需运行未受信任代码于签名主机；用户环境存在会被安装器或清理脚本改动的已有数据；原生架构契约与 S1 设计冲突；无法建立可验证的签名来源。允许保留已完成的安全代码与测试，并如实标记阻塞项。

## 8. 本轮完成定义（Definition of Done）

- **代码验收**：符合上述矩阵，默认 unsigned；不可信源码无法触发含签名凭据的执行环境；S1 任何 signed 请求全部拒绝。
- **完整性验收**：v2 双哈希和来源校验覆盖保存、读取、上传前检查，旧版数据不获得虚假发布资格；负例全拒绝。
- **测试验收**：受影响 Lint/typecheck/测试均按实际平台复测并留存报告，失败和跳过单独列明；不靠降低断言满足通过。
- **交付验收**：独立 PR、完整 Commit/工作报告索引、风险清单和后续 S2 待授权条件齐全。
- **安全结论**：**S1 结束 ≠ 允许正式签名或正式发布**；只有后续 S2 与真实部署审批通过后才可变更 signed 门禁。
