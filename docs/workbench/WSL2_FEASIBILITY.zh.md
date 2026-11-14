# WSL2 可行性

[English](WSL2_FEASIBILITY.md) | 中文

## 摘要

2026-11-12，已安装的 Rocky Linux WSL2 发行版能够向 Windows localhost 提供 HTTP 服务，但其 PATH 中没有找到 Linux Node 可执行文件。Linux DSH Host 和跨平台 Typert 连接尚未验证。HTTP 探测本身不能证明 DSH 认证、重连或文件系统兼容性。

## 目录

- [观察到的环境](#observed-environment)
- [网络与传输](#network-and-transport)
- [路径与权限](#paths-and-permissions)
- [待验证事项](#outstanding-checks)
- [延伸阅读](#further-exploration)
- [开发备注](#dev-note)

-----

<a id="observed-environment"></a>
## 观察到的环境

| 检查 | 结果 |
|---|---|
| 发行版 | `RockyLinux-9.8`，WSL 版本 2；探测前处于停止状态，为检查而启动。 |
| 内核 | `6.18.40.1-microsoft-standard-WSL2`，x86_64。 |
| Node | `command -v node` 未找到 Linux 可执行文件；挂载的 Windows PATH 可见 Windows `node.exe`。仓库在 [package.json](../../package.json#L8) 要求 Node `>=24.9.0`。 |
| 包管理器 | `pnpm` 指向 Windows npm 目录，尚未验证 Linux 安装。 |
| Linux Host | 未启动：PATH 中没有所需 Linux Node Runtime。Windows `node.exe` 不能证明 Linux Host 可运行。 |

-----

<a id="network-and-transport"></a>
## 网络与传输

绑定 WSL `127.0.0.1:43879` 的临时 Python HTTP 服务，在 WSL 内和 Windows `127.0.0.1:43879` 均返回 HTTP 200；探测后已停止该服务。这只验证了当时的一条 Loopback 转发路径，不能证明 WSL 退出或重启后的行为。

现有 Gateway 在 [stream-protocol.ts](../../packages/api/gateway/src/stream-protocol.ts#L7) 声明流路径 `/api/remote.mux`，客户端在 [client/index.ts](../../packages/api/gateway/src/client/index.ts#L157) 使用 Connection 服务打开 Socket。Host 在 [webserver/index.ts](../../packages/host/webserver/src/index.ts#L621) 绑定配置的地址。这些源码说明现有传输机制；实际 Windows 到 WSL 的 Typert 会话、认证、重连和恢复尚未实测。

-----

<a id="paths-and-permissions"></a>
## 路径与权限

WSL 进程可以列出 `/mnt/e/GH projects`；显示的目录权限为 `drwxrwxrwx`。该观察不能证明单个项目文件的读、写、执行、符号链接、大小写敏感性或 Windows ACL 行为。

Workspace 文件操作在 [workspace-files/index.ts](../../packages/api/workspace-files/src/index.ts#L452) 通过 Host 文件系统服务解析 Workspace 根目录和请求路径。[containment.ts](../../packages/fs/fs-sandbox/src/containment.ts#L61) 根据平台决定文件系统包含关系的大小写敏感性。因此 Linux Host 需要 Linux 可解析的路径和单独验证的权限；不能假定 Windows 路径指向同一资源。

-----

<a id="outstanding-checks"></a>
## 待验证事项

- 使用兼容的 Linux Node Runtime 启动 Linux DSH Host，并验证其受支持的 Profile；本次探测不安装或升级 WSL 系统组件。
- 使用配置的认证验证 Windows 到 WSL 的 Typert 请求与流，再验证 Host 或 WSL 退出和重启后的行为。
- 在两个文件系统上验证有代表性的 Workspace 路径、权限、大小写行为、符号链接和文件通知。
- 确认所选网络配置和代理设置在重启后如何影响转发；本次探测没有停止或重启发行版。

-----

<a id="further-exploration"></a>
## 延伸阅读

- [平台兼容性](PLATFORM_COMPATIBILITY.zh.md)描述 Windows 和 WSL 的执行模型。
- [上游同步报告](UPSTREAM_SYNC_REPORT.zh.md)记录 Windows 基线和观察到的 Desktop 限制。

-----

<a id="dev-note"></a>
## 开发备注

无。
