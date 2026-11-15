# 自研插件交付：WSL2 执行环境

[English](README.md) | 中文

本目录归档自研插件 `@local/dsh-wsl-exec`：把 WSL2（RockyLinux-9.8）里的 Linux 原生 DSH Host 挂进 Windows 官方桌面，桌面源码与 `app.asar` 均未改动。

## 目录内容

| 路径 | 内容 |
| --- | --- |
| `wsl-exec-plugin/` | 可安装插件源码，含 Host 入口、客户端入口、外壳页、配置与使用说明 |
| `reports/WSL2_EXEC_ENV_REPORT.md` | 交付报告：能做什么、实测证据、已知两个坑、未做清单 |
| `reports/DESIGN_NOTES.md` | 方案设计与实测记录，含桌面限制的源码依据 |
| `reports/EVIDENCE.md` | 实际效果与验证证据汇总 |
| `screenshots/` | 五张实机截图 |

## 快速安装

```powershell
plugin_manager action=install_bundle target=<PLUGIN_DIR>
```

安装后侧边栏出现「WSL 环境」入口。插件默认使用 `RockyLinux-9.8`、Linux 端口 `4610`、反代端口 `45991`，可在 `wsl-exec-plugin/cordis.patch.yml` 的 `config` 中修改。

## 实测结果

- Linux 侧真实 Agent 轮次：`uname -a` 返回 `6.18.58.1-microsoft-standard-WSL2`，`/etc/os-release` 为 Rocky Linux 9.8。
- 代理链路：首页 200（41120 字节）、首个静态资源 200（约 1.09 MB）、`/api/remote.mux` WebSocket 101。
- 交互：重载保留会话；停止后保持停止，再启动会话仍在。
- 证据截图见 `screenshots/`。

## 边界

- 本目录是交付存档，不是 pnpm workspace 包，不参与仓库构建与发布。
- 插件运行时要求 WSL 内已安装 `@deepseek-ai/dsh`（本机为 0.2.2-rc.2）与 Node >= 24.9。
- 详细限制与遗留问题见 `reports/WSL2_EXEC_ENV_REPORT.md`。
