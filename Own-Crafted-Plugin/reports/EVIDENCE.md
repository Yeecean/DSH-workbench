# WSL2 执行环境插件 — 实际效果与验证证据

本文件汇总交付时的实测结果，截图均归档在 `../screenshots/`。证据采集环境：Windows x64，官方桌面版 `E:\dshDesktop`，WSL 发行版 `RockyLinux-9.8`（WSL2，内核 `6.18.58.1-microsoft-standard-WSL2`），Linux 侧 DSH `0.2.2-rc.2`。

## 链路检查

| 检查项 | 实际方式 | 结果 |
| --- | --- | --- |
| 插件状态 | `GET http://127.0.0.1:44864/wsl-exec/__status` | 200，`state=running`，`origin=http://127.0.0.1:45991` |
| 启动控制 | `POST /wsl-exec/RockyLinux-9.8/__control/start` | 200，状态 `running` |
| 外壳页 | `GET /wsl-exec/RockyLinux-9.8/__shell` | 200，`text/html`，6659 字节 |
| Linux 首页 | `GET http://127.0.0.1:45991/` | 200，`text/html`，41120 字节，含 `<base href="./">` 与 `__DSH_BOOT__` |
| 静态资源 | 取首页第一个 `plugins/...` 资源 | 200，`text/javascript`，约 1.09 MB |
| 实时通道 | `WebSocket ws://127.0.0.1:45991/api/remote.mux` | 101，子协议 `dsh.v1` |
| 停止 | `POST /wsl-exec/RockyLinux-9.8/__control/stop` | 状态回 `idle`，Windows 与 WSL 两侧端口释放 |

## Linux 侧真实执行

在 Linux 界面新建会话，要求 Agent 执行 `pwd`、`uname -a`、`cat /etc/os-release` 并读取 `/home/yeecean/dsh-linux-demo/hello-linux.txt`，实际返回：

```
Linux Yeecean-Y7000P 6.18.58.1-microsoft-standard-WSL2 ... x86_64 GNU/Linux
NAME="Rocky Linux" VERSION="9.8 (Blue Onyx)"
我现在运行在 WSL2 里的 Rocky Linux 9.8 操作系统中，工作目录的绝对路径是 /home/yeecean/dsh-linux-demo
```

## 交互与界面

- 重载：点「重载界面」后 iframe 重新加载，原会话与消息保留。
- 停止/启动：点「停止 Linux 环境」后保持停止（超过一个轮询周期未自动重启），按钮变为「启动 Linux 环境」；重新启动后原会话仍在。
- 侧边栏入口：`sidebar.footer.action` 的运行时占位列表包含 `wsl-exec.environment`。
- 标题栏：外壳页在 `data-windows-titlebar` 下自动下移 40px，工具条不与最小化/最大化/关闭按钮重叠。

## 截图

| 截图 | 展示内容 |
| --- | --- |
| [`01-linux-session-in-wsl.png`](../screenshots/01-linux-session-in-wsl.png) | Linux 会话里执行命令、读取 WSL 文件 |
| [`02-session-kept-after-reload.png`](../screenshots/02-session-kept-after-reload.png) | 重载界面后会话与消息保留 |
| [`03-linux-workspace-picker.png`](../screenshots/03-linux-workspace-picker.png) | Linux 侧工作区选择 |
| [`04-stop-then-start-session-kept.png`](../screenshots/04-stop-then-start-session-kept.png) | 停止后再启动，会话仍在 |
| [`05-titlebar-inset-fix.png`](../screenshots/05-titlebar-inset-fix.png) | 标题栏避让后的工具条 |

说明：以上证据在插件交付时于本机采集；本目录归档的是同一批实测结果的报告与截图，本轮未重新执行真实桌面操作。
