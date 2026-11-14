# Desktop Profile 可行性

[English](DESKTOP_PROFILE_FEASIBILITY.md) | 中文

## 摘要

当前 Desktop 容器启动由 Electron 管理、名称为 `desktop` 的 Profile。独立 Harness Home 可以为 Workbench 实验提供该 Profile 的独立实例，但不能证明 Electron 可以选择其他名称的 Profile。下述 Windows 验证仅为计划；本次审查未启动或修改 Profile。

## 目录

- [Profile 选择](#profile-selection)
- [Bundle 组合](#bundle-composition)
- [隔离与风险](#isolation-and-risks)
- [Windows 最小验证计划](#minimum-windows-validation-plan)
- [需要决定](#decision-required)
- [开发备注](#dev-note)

-----

<a id="profile-selection"></a>
## Profile 选择

Electron 在选定 Harness Home 下解析 `profiles/desktop` 及其锁文件（[paths.ts:17](../../apps/desktop/src/paths.ts)）。主进程选择该目录并准备 Desktop 项目（[main.ts:381](../../apps/desktop/src/main.ts)）；Host 进程通过参数接收该目录（[host-process.ts:208](../../apps/desktop/src/host-process.ts)）。

Desktop Host 加载传入目录，并向共享启动器传递固定 Profile 名称 `desktop`（[desktop-host index.ts:19](../../apps/desktop-host/src/index.ts)）。普通 CLI 明确拒绝启动保留的 Desktop Profile（[args.ts:83](../../apps/cli/src/args.ts)）；命名 CLI Profile 是另一条启动路径，不能证明 Electron 存在选择机制。

CLI 支持选择自定义 Profile 和从已发布模板初始化（[args.ts:167](../../apps/cli/src/args.ts)）；模板初始化可能替换目标 Profile 目录及其已有内容（[profile-boot.ts:90](../../apps/cli/src/profile-boot.ts)）。未来实验只应使用全新的临时 Home。本次审查没有证据证明现有 Desktop 容器可直接选择其他名称的 Workbench Profile。

-----

<a id="bundle-composition"></a>
## Bundle 组合

Profile Manifest 按顺序列出 Bundle；每个 Bundle 声明一个或多个 Patch 文件，之后应用 Profile Patch 和启动器层（[profile.ts:1](../../packages/boot/app-boot/src/profile.ts)）。Home 级 Patch 的优先级高于 Profile 层（[profile-boot.ts:211](../../apps/cli/src/profile-boot.ts)）。Desktop Host 当前调用没有传入命令行 Patch 文件（[desktop-host index.ts:27](../../apps/desktop-host/src/index.ts)）。

Desktop 从 Web 模板初始化其专用 Profile（[project-manager.ts:28](../../apps/desktop/src/project-manager.ts)、[project-manager.ts:172](../../apps/desktop/src/project-manager.ts)）；该模板选择 Base 和 Web Bundle（[bundles.ts:14](../../packages/util/official-bundles/src/bundles.ts)）。Profile 加载可能跳过无法读取、不兼容或不支持的平台 Bundle 并报告原因（[profile.ts:700](../../packages/boot/app-boot/src/profile.ts)）；窗口能够运行本身不能证明 Workbench Bundle 已加载。

Desktop 安装的命令可以在 Desktop 完全关闭后管理已初始化的保留 Profile（[Desktop README:135](../../apps/desktop/README.zh.md)）；Plugins 页面也使用共享管理器（[Desktop README:172](../../apps/desktop/README.zh.md)）。在隔离开发 Profile 中交付并加载本地 Workbench Bundle 尚未验证，需要明确检查包解析。

-----

<a id="isolation-and-risks"></a>
## 隔离与风险

| 状态 | 源码观察 | 对原型的要求 |
|---|---|---|
| Profile 与 Bundle | `DSH_HOME` 选择 Harness 根目录（[home-paths index.ts:127](../../packages/util/home-paths/src/index.ts)）；Desktop 选择其中的 `profiles/desktop`（[paths.ts:17](../../apps/desktop/src/paths.ts)）。 | 每次运行使用全新的私有 Harness Home；其逻辑 Profile 名仍为 `desktop`。 |
| Session 与 Storage | Base Bundle 将 JSONL Session 和 JSON Storage 放在 Harness Home 下（[base patch:138](../../packages/bundle/base/cordis.patch.yml)、[base patch:179](../../packages/bundle/base/cordis.patch.yml)）。 | 不同 Home 的默认数据根目录不同；显式配置或外部插件可以覆盖，必须检查。 |
| 共享 Skills | `DSH_AGENTS_HOME` 独立于 `DSH_HOME`（[home-paths index.ts:139](../../packages/util/home-paths/src/index.ts)）；文件系统 Skill Provider 还会读取用户和项目位置（[skill-filesystem index.ts:257](../../packages/skill/skill-filesystem/src/index.ts)）。 | 使用全新的临时 Agents Home 和测试 Workspace；启动前检查解析的 Skill 路径及外部插件。 |
| 凭据 | 凭据提供者也可能读取继承的环境变量和启动目录的 `.env`（[credentials index.ts:1](../../packages/credentials/credentials-local/src/index.ts)）。 | 新 Harness Home 本身不能证明凭据隔离；启动前检查环境，不发送真实 Provider 请求。 |
| Electron 状态 | Desktop 从独立于 `DSH_HOME` 的 Electron `userData` 读取壳层设置（[settings-file.ts:70](../../apps/desktop/src/settings-file.ts)）。 | 浏览器存储、设置和缓存使用独立 Electron 数据目录，不能指向用户的正常数据。 |
| 进程归属 | Desktop 在 Profile 操作前获取单实例锁（[single-instance.ts:14](../../apps/desktop/src/single-instance.ts)）。 | 检查现有 Desktop 进程，不要假设两个容器可以同时运行；安全切换需单独验证。 |

开发启动器分别解析 `DSH_HOME` 和 `DSH_DESKTOP_USER_DATA_DIR`，并把后者传给 Electron（[dev.ts:59](../../apps/desktop/scripts/dev.ts)）。这只能证明存在开发环境隔离机制，不能证明同一环境变量控制已安装应用。启动器使用固定的构建项目目录（[dev.ts:115](../../apps/desktop/scripts/dev.ts)），准备过程会删除并重建该目录（[development-project.ts:147](../../apps/desktop/scripts/development-project.ts)）。临时 Home 不能隔离此操作：启动前必须检查并保留其中内容，也不能并发执行相冲突的准备过程。

-----

<a id="minimum-windows-validation-plan"></a>
## Windows 最小验证计划

1. 记录源码 Commit、构建产物身份、现有 Desktop 进程状态与实际路径。分配全新的临时 Harness Home、`DSH_AGENTS_HOME`、测试 Workspace 和独立 Electron 用户数据目录；检查 Skill 路径、继承的凭据变量和 `.env` 输入，不复制用户真实密钥。
2. 使用仓库支持的构建和打包机制准备批准后的 Workbench Bundle 与 Client 产物。检查隔离 Profile 的 Bundle 顺序、实际 Profile 与 Home Patch 以及解析诊断；跳过 Workbench 层视为失败。
3. 用隔离目录启动未修改的 Windows 开发版 Desktop，观察 Host 使用保留的 `desktop` Profile。确认 Workbench Client Entry 加载且原生 Conversation、Terminal、Files 可访问；仅运行 CLI 或浏览器不满足 Desktop 验收。
4. 验证 Home 与 Conversation 切换、窗口缩放、Renderer 重载、插件移除与注册清理。另用干净 Home 和 Electron 数据重启，检查原生 Desktop 组合；保留证据，清理前检查选定路径。
5. 如有需要，单独探测自定义名称 CLI Profile 的组合，并仅作为 CLI 证据报告。除非实际证明存在受支持的选择器或经批准的 Desktop 容器修改，否则不能宣称支持自定义名称的 Desktop Profile。

本次设计审查未执行以上步骤。Profile 安装、重载、与全部外部服务的隔离以及完整 Windows Desktop 验收路径，仍需在原型中实测。

-----

<a id="decision-required"></a>
## 需要决定

请批准 P1 是否可以先用专属 Harness Home 中的保留 `desktop` Profile 进行 Desktop 实验。如果产品要求 Electron 选择独立命名的 Desktop Profile，就必须扩展现有容器的选择能力，或建立并审查其他受支持的集成方式；本文不授权修改该容器。

-----

<a id="dev-note"></a>
## 开发备注

以上结论来自静态源码。本次审查没有运行原型 Bundle、自定义 Profile、Windows Desktop 或隔离测试。
