# DESIGN_NOTES — WSL2 执行环境插件（v2，方案 B）

> 状态：**可行性已实测打通**，开始实现
> 日期：2026-11-15
> 依据文档：`C:\Users\Haoyang\Downloads\Download-Chorm\DSH_WSL2_NATIVE_EXECUTION_V1.md`
> 用户约束（优先级高于文档）：不改源码、不改 `app.asar`、做成插件、跑在当前这台机器上原有的官方 Desktop 上；插件放默认工作区。
> 历史：v1 曾推荐"双接缝插件（fs+subprocess 换成 WSL 版）"，被用户否决，改走方案 B（见 §1）。

---

## 1. 一句话方案

**在 WSL2（RockyLinux-9.8）里跑一个完整、原生的 Linux DSH Host；Windows 这边原有桌面版不动，由一个插件在它自己的 HTTP 服务上开一段"代理路径"，把 WSL 里那个 Host 的界面安全地挂进来。** 你在桌面里点一下"进入 Linux 环境"，看到的就是真正的 Linux 执行世界（Linux 路径、Linux 进程、Linux 文件系统）；再点一下回到 Windows。

这就是文档要求的"用 DSH 已有的连接/鉴权协议安全连接 Linux Host"，而不是自己造第二套 RPC / 会话 / 文件 / 终端。

---

## 2. 关键约束（决定了方案只能是这一个）

我读了这台机器上真正在跑的桌面版源码/包（不是猜），有三条硬限制：

1. **桌面窗口只允许停在 `dsh-app://` 里。** `apps/desktop/src/main.ts:369-377` 的 `will-navigate`：只要目标不是 `dsh-app:` 且不是同源 http，就 `preventDefault()` 并丢给系统浏览器。→ 不能把窗口直接导航到 `http://127.0.0.1:端口`。
2. **`<webview>` 被锁死。** `apps/desktop/src/browser-guests.ts:72-95`：只有主进程预发 lease 的侧边栏浏览框能 attach，其它 `will-attach-webview` 一律 `preventDefault()`。→ 不能随手拿 webview 嵌 WSL 界面。
3. **桌面版的 Host 子进程换不掉。** `apps/desktop/src/host-process.ts:210-222` 用打包资源里的 `dsh-desktop-host` 启动，`app.isPackaged` 为真时 `DSH_DESKTOP_*` 那些开发期环境变量全部失效。→ 不能让官方桌面"直接启动 WSL 里的 Host 当自己的 Host"。

结论：窗口必须留在 `dsh-app://`，而 `dsh-app://app/<任意路径>` 只要不是本地 dist 的几个白名单路径，都会被 `protocol.handle` **转发给桌面自己的 Host**（`apps/desktop/src/main.ts:800-813` + `apps/desktop/src/web-document.ts:97-113`）。**这就是我们的入口：插件在自家 Host 上注册一段路径，把请求接住。**

---

## 3. 已经实测打通的三件事（不是设想）

1. **WSL 里能跑真 DSH Host。**
   - Rocky Linux 9.8 内 node 已升到 **v24.22.1**（`dnf module switch-to nodejs:24`），pnpm 11.28.5（Linux 原生，优先于 `/mnt/c` 那个 Windows pnpm）。
   - `npm i -g @deepseek-ai/dsh@0.2.2-rc.2` 成功；`dsh --version` = `0.2.2-rc.2`；`node-pty` 和 `koffi` 原生二进制在该发行版里 `require` 正常（PTY 终端有戏）。
   - 命令：`wsl.exe -d RockyLinux-9.8 -u yeecean --exec bash -lc "cd $HOME && exec /usr/local/bin/dsh --profile web --no-open --host 127.0.0.1 --port 4610"`，输出 `dsh web: http://127.0.0.1:4610/?token=…`。
   - **WSL2 localhost 转发生效**：Windows 侧直接就能访问 `127.0.0.1:4610`。

2. **登录/鉴权握手能走通。** 拿 stdout 里那个带 token 的 URL 发一次 `fetch(url, { redirect:'manual' })`，拿回 **303 + `Set-Cookie: dsh-auth-…`**；之后带着这个 cookie 请求就是 **200**，不带就是 **401**。这就是 DSH 原生的 token→cookie 握手，插件只是照做，没有绕开任何鉴权。

3. **它的网页天然支持挂在任意路径前缀下。** Linux Host 返回的 `index.html` 里 `<base href="./">`，全文没有任何绝对地址（`/assets/...` 这种一处都没有），资源全是相对路径；连插件 bundle 也是 `plugins/??…` 形式。→ 只要代理时把前缀剥掉，页面完全不知道自己在子路径里。

4. **反向代理已经跑通并看到完整界面。** 我写了个一次性的验证代理（`.wsl-scratch/proxy-test.mjs`）：监听 4700，把 `/wsl/rocky/*` 转给 4610。第一版 403 —— 根因是 DSH 自己的 Host/Origin 围栏（`packages/client/connection/src/api-request-trust.ts:143-175`）：`sec-fetch-site: cross-site` 直接拒；带 `Origin` 时必须等于被监听的那个 authority。
   把 `Host`/`Origin`/`Referer` 统一改写成上游的 `127.0.0.1:4610`、注入 cookie、去掉 `accept-encoding` 之后：**浏览器里打开 `http://127.0.0.1:4700/wsl/rocky/` → 控制台 0 错误，完整的 Linux DSH 界面渲染出来（侧边栏、新建会话、全局面板都在）。** WebSocket `/api/remote.mux` 同样按这套改写就能连上。

---

## 4. 插件长什么样

一个 DSH bundle 包（普通 npm 包 + `cordis.patch.yml`），装在当前 profile 里，**Windows Host 进程内**运行：

```
wsl-exec-plugin/
  package.json         # @local/dsh-wsl-exec，dsh.bundle.patch 指向下面的 patch
  cordis.patch.yml     # 插入一行 wsl-exec 插件
  index.js             # Host 侧：WSL 监管 + 握手 + HTTP/WS 反向代理
  client.js            # 客户端 UI：入口按钮 / 环境状态（在桌面窗口里点）
  shell.html           # 包一层外壳：顶部一条"Linux 环境 · 返回 Windows"工具条 + 内嵌 iframe
  locale/{en,zh}.json  # 插件标题/描述/界面文案
  icon.svg
```

**Host 侧（index.js）**

- `ctx.webServer.register({ kind:'prefix', path:'/wsl-exec/<distro>/', resource })` —— 接住 `dsh-app://app/wsl-exec/<distro>/…` 被桌面转发过来的请求，剥前缀、改请求头、注入上游 cookie、转发给 `127.0.0.1:4610`，响应原样返回（`/plugins/` 强制 `no-store`，剥掉 `x-frame-options`/`content-security-policy`）。
- `ctx.webServer.registerUpgrade({ path:'/wsl-exec/<distro>/api/remote.mux', handler })` —— WebSocket 也走同一段前缀，裸 socket 双向 pipe。
- WSL 监管：按需 `wsl.exe` 拉起 Linux Host、解析 token URL、握手换 cookie、状态机 `idle/starting/running/stopping/failed`、停止时确保端口释放、已存在实例则复用（先探测是否真是 DSH Host）。
- 控制面：`GET …/__status`、`POST …/__control/start|stop`（只做"启停/查询"，不做任何跨环境文件同步）。

**为什么外壳页要套 iframe（而不是直接把 Linux 的 index.html 当顶层页）**

顶层页在 `dsh-app://app/…` 时，桌面 preload 会注入 `dshDesktopBoot`，`apps/web/src/main.ts:22-36` 会拿它去问桌面"我的 streamBaseUrl 是什么"，拿到的是 **Windows** Host 的 origin，还会注入 Windows 侧的插件清单 → 页面会一半连 Windows、一半连 Linux，必坏。
把 Linux 界面放进 iframe 后：iframe 里没有 preload，页面就是个普通的 http 页面（就是我在第 3 节验证过的那个场景，一模一样）；iframe 的源是 `http://127.0.0.1:<桌面Host端口>/wsl-exec/<distro>/`，于是它的 fetch 和 WebSocket 都是同源相对路径，天然对。`127.0.0.1` 属于"潜在可信源"，所以 secure context 的顶层页嵌它不会被混内容拦截。

---

## 5. 用户视角的操作流（也是最小演示）

1. 打开桌面版 → Windows 环境照旧（插件默认不动任何东西）。
2. 点侧边栏/设置里的「WSL 环境」→ 插件把 WSL 里的 Linux Host 拉起来（首次约几秒）→ 窗口切到 `dsh-app://app/wsl-exec/rocky/`。
3. 看到 Linux 环境的完整界面：新建会话、`bash` 工具跑的是 Linux 命令、文件读写是 `/home/yeecean`、终端是 WSL 里的 PTY。顶部工具条显示"Linux · RockyLinux-9.8 · 运行中"。
4. 按 F5 重载 → 仍然回到 Linux 环境，会话还在（会话本来就存在 Linux Host 进程里）。
5. 想回 Windows：工具条上点「返回 Windows」→ 回到 `dsh-app://app/`，Windows 环境原样（它的 Host 进程一直没动）。
6. 想关掉：点「停止 Linux 环境」→ 插件结束 wsl.exe、端口释放，状态变回 idle。

---

## 6. 风险与对策（明确写下，不埋）

| 风险 | 现在的判断 | 对策 |
|---|---|---|
| Linux Host 里 `node-pty` 能不能真起 PTY | 已 `require` 成功，未实测 spawn | 演示里真开一个终端验证；不行就降级为"无 PTY 终端"并明确告知 |
| iframe 方案在真实桌面里被特殊策略拦 | 理论 OK（loopback 可信），未在 Electron 里实测 | 装好后第一件事就是实测；被拦就退到"外部浏览器打开"这一备选（仍走 DSH 原生 token URL） |
| 桌面 Host 重启后代理前缀里的 cookie 失效 | 上游 cookie 存在插件内存，Linux Host 重启才变 | 插件自己重握手；`/__status` 暴露状态 |
| Linux Host 端口冲突 / 残留进程 | 4610 是固定端口 | 启动前探测，是 DSH 就复用，不是就换端口；停止时确认端口释放 |
| 安全 | 只绑 `127.0.0.1`，不新增监听面；不绕 sandbox/approval；token 只在进程内存 | 不写日志里不打 token；不做公网暴露 |
| 跨环境文件 | 方案 B 下文件/命令天然同源（都在 Linux Host 里） | 不需要同步逻辑 |
| 装插件会改动 profile | 用 `plugin_manager install_bundle` 走正规安装 | 安装/卸载都可回滚；不动 `app.asar` |

---

## 7. 明确不做（V1）

第二套 Agent Loop / Session / RPC / 文件 / Terminal；并行多环境；跨环境文件同步或会话迁移；路径静默转换；SSH；多发行版；新 IDE。

---

## 8. 交付物

- 可安装的插件包 `../wsl-exec-plugin/`（与本报告同级的插件目录），装进当前 profile 即可用。
- 本 DESIGN_NOTES.md（方案与实测证据）。
- 实机验证记录：进入 Linux → 跑一条 Linux 命令 + 读一个 Linux 文件 → 重载保持 → 停止 → 回 Windows。
- 用户文档：怎么装、怎么切、怎么退、出问题看哪里（`../wsl-exec-plugin/USAGE.md`、`WSL2_EXEC_ENV_REPORT.md`）。

---

## 9. 实测结果（已跑通，非推演）

安装：`plugin_manager install_bundle` → `application: applied`，bundle `@local/dsh-wsl-exec@1.0.0`，链到 workspace 目录（改代码即时生效，重载插件即生效）。

| 环节 | 结果 |
|---|---|
| 插件热加载进运行中的桌面 Host | ✅ 同一个 `DeepSeekRuntime.exe` 进程同时监听 `44864`（Host HTTP）与 `45991`（插件反代） |
| 启动 Linux Host | ✅ `state: idle → running`，1 次成功，耗时数秒 |
| 鉴权握手（token → cookie） | ✅ 303 + 1 条 Set-Cookie；实测竞争窗口 ~0.9s，插件按 250ms 轮询等端口就绪后重试 |
| Linux 首页 / 静态资源 | ✅ 200 / 41120 B；首个 asset 200（text/javascript） |
| 实时通道 `/api/remote.mux` | ✅ WebSocket **101**，subprotocol `dsh.v1` |
| Linux 里执行命令 + 读文件 | ✅ `uname -a` → `Linux ... 6.18.58.1-microsoft-standard-WSL2 x86_64 GNU/Linux`；`/etc/os-release` → Rocky Linux 9.8；读到只存在于 WSL 的文件；工作目录 `/home/yeecean/dsh-linux-demo` |
| 重载保持 | ✅ 外壳页「重载界面」刷新 iframe，会话与消息保留，实时通道自动重连 |
| 停止 / 再启动 | ✅ 「停止 Linux 环境」→ `running → idle`，两侧端口释放，且**不会被轮询自动重启**；按钮翻成「启动 Linux 环境」，再点 → `running`，之前的会话仍在（`../screenshots/04-stop-then-start-session-kept.png`） |
| 停止 | ✅ `running → idle`，Windows 与 WSL 两侧端口都释放 |
| 侧边栏入口 | ✅ 渲染层活体占位里有 `wsl-exec.environment`（`sidebar.footer.action`） |

证据截图：`../screenshots/01-linux-session-in-wsl.png`、`02-session-kept-after-reload.png`、`03-linux-workspace-picker.png`。

### 过程中修掉的三个真问题

1. **握手一次性判定**：`dsh` 打印 token URL 的时刻，WSL2 的 localhost 转发还没生效（实测晚 ~0.9s），立刻 fetch 必然 `ECONNREFUSED`。改为「先等 `GET http://127.0.0.1:<linuxPort>/` 可达（任何状态码都算），再握手，预算用满 `startTimeoutMs`」。
2. **失败留脏进程**：早期握手失败后 Linux Host 仍在跑并占着 4610。现在失败一律 `runStop()` 清场再置 `failed`；从 `failed` 重启会先清残留，`start` 幂等。
3. **停止按钮语义错**：外壳页原本在 `idle`/`failed` 时无条件自动 `POST start`，于是「停止 Linux 环境」点完状态回到 `idle`、轮询又把它拉起来，等于停止无效。改为：自动启动只发生在首次进入且当前为 `idle`；`idle` 下按钮翻成「启动 Linux 环境」由用户显式触发；`failed` 不再自动重试（避免死循环）。实测：停止后 8 秒（>5 秒轮询周期）仍保持「未启动」，再点启动 → 运行中且会话仍在。

### 遗留（V1 范围外，已记录）

- **WSL1/WSL2 版本检测未做**：插件按配置里的发行版名直接启动，没有先探 `uname -r` / `wsl -l -v` 去拒绝 WSL1；当前这台机器只有 WSL2 的 `RockyLinux-9.8`，所以实机不受影响。若要严格对齐文档的「不把 WSL1 误报 WSL2」，需在 `runStart()` 前加一次内核探测。
- Linux 侧模型网关地址用的是 WSL 网关 IP（`172.26.224.1:3425`，magpie 的 WSL 专用 key），WSL 重启换 IP 后需重指一次；V1.1 可由插件在启动时算好并注入。
- `index.js` 1032 行（目标 ~600），可在同一套测试下收敛。
