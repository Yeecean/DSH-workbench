# WSL2 执行环境插件 — 交付报告

> 一句话：**你现在这台 Windows 桌面版 DSH 里，已经能用上跑在 WSL2（RockyLinux-9.8）里的原生 Linux DSH 了。** 没改源码、没动 app.asar、没动桌面安装文件；全部以插件形式加在你的默认工作区里。

## 一、现在能做什么

打开桌面版 DSH，看侧边栏最下面（设置旁边）多了一个**「WSL 环境」**按钮：

- 点它 → 整屏显示 Linux 侧界面，顶部一条工具条：`WSL 环境 · RockyLinux-9.8 · 运行中`，右边三个按钮：**重载界面 / 停止 Linux 环境（停掉后变「启动 Linux 环境」）/ 返回 Windows**。
- 里面的东西**真的在 Linux 里跑**：工作区路径是 `/home/yeecean/...`，Agent 执行命令是 Linux 命令，读文件读的是 Linux 文件系统。
- 「返回 Windows」回到原来的 Windows 界面，Windows 侧的会话、工作区、设置一概不受影响（插件只是在旁边加了一个入口，没有替桌面自己的 Host 干活）。
- 「停止 Linux 环境」把 WSL 里那套 Host 收掉，端口一起清干净。

## 二、实机跑过的证据（不是推测）

1. **Linux 里的 Agent 真执行了命令**：在 Linux 界面里新建会话，让它 `pwd`、`uname -a`、`cat /etc/os-release`、读一个只存在于 WSL 的文件，返回：

   ```
   Linux Yeecean-Y7000P 6.18.58.1-microsoft-standard-WSL2 ... x86_64 GNU/Linux
   NAME="Rocky Linux"  VERSION="9.8 (Blue Onyx)"
   我现在运行在 WSL2 里的 Rocky Linux 9.8 操作系统中，工作目录的绝对路径是 /home/yeecean/dsh-linux-demo
   ```

   截图：`../screenshots/01-linux-session-in-wsl.png`
2. **重载不丢会话**：点「重载界面」后界面刷新，会话和消息都还在（实时通道自动重连成功）。截图：`../screenshots/02-session-kept-after-reload.png`
3. **链路各环节单独验过**：启动 → 鉴权握手（token 换 cookie）→ Linux 首页 200（41120 字节）→ 静态资源 200（1.09 MB）→ 实时通道 `/api/remote.mux` **101 升级成功** → 停止后两侧端口归零。
4. **插件在运行中的桌面里热加载**：装完没重启桌面，同一个 Host 进程上就多出了 `45991` 反代端口，侧边栏按钮也注册进了渲染层（`sidebar.footer.action` 的活体占位里能查到 `wsl-exec.environment`）。

## 三、结构（人话版）

```
桌面窗口 ── dsh-app://app/wsl-exec/RockyLinux-9.8/__shell   ← 外壳页（工具条 + iframe）
              └─ iframe → 127.0.0.1:45991                   ← 插件自己的反代端口
                    └─ → 127.0.0.1:4610                    ← WSL2 里的 Linux DSH Host
                          └─ wsl.exe -d RockyLinux-9.8 → dsh --profile web
```

为什么绕这一圈（三条都是桌面版源码里的硬限制，读源码确认过、没改）：

1. 渲染窗口不许被导航到 http 地址（只丢给系统浏览器）→ 不能直接把窗口指过去；
2. `<webview>` 只放行内置浏览器帧 → 不能用 webview 嵌；
3. 打包模式下换不掉桌面自己的 Host 子进程 → 不能让桌面去连别处。

所以插件在**自家 Host 里**做反代，用 iframe 装 Linux 界面。另外 Linux 界面的实时通道必须从**独立端口**（45991）进——从桌面 Host 端口走会被桌面主进程以来源不符为由掐掉。反代里顺手把 `host/origin/referer` 改写、注入握手 cookie，这是 Linux Host 自己的同源校验要求的。

## 四、你可能会踩的两个坑（已处理，但要知道）

- **启动时 ~0.9 秒的竞争**：Linux 侧 `dsh` 打印带 token 的地址时，WSL2 的 localhost 转发还没生效，立刻去握手必然 `ECONNREFUSED`。现在插件先等端口可达（250ms 一次，预算 60s）再握手，实测 1–2 秒内通过。
- **Linux 侧要自己的模型配置**：Linux Host 用它自己的 profile（`/home/yeecean/.dsh/profiles/web/`），跟 Windows 侧互不相通。我已经给它配好了 magpie 网关（走 WSL 专用 key，见 `~/.dsh/.env`），但这个地址是 WSL 网关 IP（`172.26.224.1`），**WSL 重启后如果变了，模型会连不上**，改一行就好：

  ```bash
  wsl -d RockyLinux-9.8 -- bash -lc 'GW=$(ip route show default | awk "{print \$3}"); sed -i "s#baseURL: .*#baseURL: http://$GW:3425/v1#" ~/.dsh/profiles/web/cordis.patch.yml'
  ```

  下一步（V1.1）可以让插件在启动时自动算好并注入，就不用记这条命令了。

## 五、还没做的（按你文档里的 V1 范围）

- 并行多环境（V1 明确不做，只做单活动环境）；
- 跨环境文件同步 / 会话迁移 / 路径静默转换（同样在 V1 不做清单里）；
- 切换时把「哪个环境是当前」持久化到设置里（现在靠按钮进入/返回，不写全局状态）；
- 版本迭代：`index.js` 1032 行，可以压到 ~600 行，测试都在，需要的话我让子代理收敛。

## 六、怎么自查

桌面里点一下「WSL 环境」按钮即可。命令行也可自查：

```powershell
node Own-Crafted-Plugin\tools\verify-plugin.mjs http://127.0.0.1:44864 RockyLinux-9.8 --start
```

（端口 44864 是桌面 Host 当前端口，桌面重启后会变；从 `Get-NetTCPConnection` 或窗口地址里能看到。）
