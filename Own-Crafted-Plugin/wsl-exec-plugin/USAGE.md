# @local/dsh-wsl-exec

把 **WSL2 里的一套 Linux 原生 DSH Host** 挂到 Windows 官方桌面（`E:\dshDesktop`，未改一行源码、未动 app.asar）里使用的插件。

装好之后：侧边栏多一个「WSL 环境」按钮 → 点开就是一台真正跑在 RockyLinux-9.8 里的 DSH 界面，工作区、终端、文件读写、Agent 会话全部在 Linux 里执行；工具条上的「返回 Windows」回到原来的 Windows 界面。

工具条用法：

- 中间那颗按钮是**开关**——运行中显示「停止 Linux 环境」，停掉后变成「启动 Linux 环境」；点停止后环境**保持停止**，不会被自动重启（重新拉起来后，之前的会话还在）。
- 「重载界面」只重载内嵌的 Linux 界面，会话与消息保留（实时通道自动重连）。
- 「返回 Windows」回到 Windows 环境；Linux 那套 Host 继续在跑，随时再进来。

## 为什么是这套结构

桌面版有三条硬限制（源码 `apps/desktop/src/`，只读勘察得出，未修改）：

1. `main.ts:369-377` — 渲染窗口**不允许**被导航到任何 http(s) 地址（只会被丢给系统浏览器），只能待在 `dsh-app://` 或同源 http。
2. `browser-guests.ts:72-95` — `<webview>` 只放行主进程预发 lease 的内置浏览器帧，插件无法用它嵌第三方页面。
3. `host-process.ts:210-222` — 打包模式下 Host 子进程路径来自 `process.resourcesPath`，环境变量覆盖全部失效，插件换不掉桌面自己的 Host 进程。

所以插件不抢 Host 进程，而是在**自家 Host 进程内**做两件事：

```
桌面窗口 (dsh-app://app/wsl-exec/<distro>/__shell)
  └─ 外壳页 shell.html：顶部工具条 + 一个 iframe
       └─ iframe → http://127.0.0.1:45991/          ← 插件自己的反代端口
            └─ 反代 → http://127.0.0.1:4610/        ← WSL2 里的 Linux DSH Host
                 └─ wsl.exe -d RockyLinux-9.8 → dsh --profile web --host 127.0.0.1 --port 4610
```

为什么 Linux GUI 不挂在 `ctx.webServer` 的路由下：桌面主进程会取消 Origin 不是 `dsh-app://app` 的、发往 Host 端口的 WebSocket（源码 `main.ts:846` 附近的升级过滤），而 Linux GUI 的实时通道是 `/api/remote.mux`。给它一个**独立 authority**（另一个 loopback 端口）就绕开了这条限制，同时插件在反代里把 `host/origin/referer/sec-fetch-site` 重写成 Linux Host 认可的 authority，并注入握手拿到的 cookie —— 这一步是 Linux Host 自己 `api-request-trust.ts` 的 same-authority 校验所必需的。

`ctx.webServer` 只承载四个小端点（见下表），它们不带桌面 cookie 也能访问，所以外壳页本身不会被鉴权拦住。

## 安装

```powershell
# 在 DSH 里（或让 Agent 代劳）
plugin_manager action=install_bundle target=<本目录的绝对路径>
```

安装即为当前 profile 的 bundle（`dsh.bundle.patch` → `cordis.patch.yml`）。装完不需要重启桌面，Host 侧热加载；渲染层若无侧边栏按钮，重载一次窗口（Ctrl+R）。

## 配置

`cordis.patch.yml`：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `distro` | `RockyLinux-9.8` | WSL 发行版名（`wsl -l -v` 里的名字） |
| `user` | `yeecean` | 在发行版里以谁运行 |
| `profile` | `web` | Linux 侧 `dsh --profile <name>`，对应 `~/.dsh/profiles/<name>` |
| `dshCommand` | `/usr/local/bin/dsh` | Linux 里 dsh 的绝对路径 |
| `linuxPort` | `4610` | Linux Host 监听端口（仅 loopback） |
| `proxyPort` | `45991` | 插件反代端口（Windows 侧 loopback） |
| `mount` | `/wsl-exec` | 桌面 Host 上的挂载前缀 |
| `autoStart` | `false` | 装好后是否自动拉起 Linux Host |

## 端点

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `<mount>/__status` | `{environments:[{distro,state,error,origin,entry}]}` |
| GET | `<mount>/<distro>/__status` | 单环境快照 |
| GET | `<mount>/<distro>/__shell` | 外壳页（`shell.html`） |
| POST | `<mount>/<distro>/__control/start` | 幂等启动（含握手、等端口就绪） |
| POST | `<mount>/<distro>/__control/stop` | 幂等停止（杀进程 + 清端口） |
| * | `http://127.0.0.1:<proxyPort>/` | Linux GUI 本体（HTTP + WebSocket 全代理） |

状态机：`idle → starting → running → stopping → idle`，失败进 `failed` 并带分阶段原因（端口未就绪 / 303 未返回 / 无 Set-Cookie / 请求没发出去，附 `cause.code`）。

## 排障

- **`failed`：已经有一个 DSH Host 在运行** — 4610 被别的进程占着，且那不是本插件拉起的。它的 launch token 只属于启动它的进程，无法复用。先 `pkill -f -- '[-]-port 4610'`（或停掉那个进程）再点启动。
- **外壳页白屏** — 打开 `http://127.0.0.1:<Host 端口><mount>/<distro>/__status` 看 `state`；再直接访问 `http://127.0.0.1:45991/` 看 Linux GUI 本身是否正常，以区分「反代问题」还是「Linux Host 问题」。
- **Linux 侧没模型可用** — Linux Host 用自己的 profile（`~/.dsh/profiles/web/cordis.patch.yml`），跟 Windows 侧配置互不相通，要在那边单独配 provider。

## 已知限制（V1）

- 单活动环境：一次只监管一个发行版，没有并行多环境。
- 界面是「外壳 + iframe」，不是把整个窗口换掉——这是上面三条桌面限制下的唯一通路。
- 不做跨环境文件同步、会话迁移、路径静默转换。

## 证据

`../screenshots/` 下五张实机截图：Linux 会话在 WSL2 里执行命令并读文件（`01`）、点「重载界面」后会话保留（`02`）、Linux 工作区选择器（`03`）、点「停止 Linux 环境」再「启动 Linux 环境」后会话仍在（`04`）、标题栏避让修复效果（`05`）。
