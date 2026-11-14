# 已知问题

[English](KNOWN_ISSUES.md) | 中文

## 摘要

基线调查记录了一次 Desktop 退出检查超时、一次 Mandatory Update IPC Handler 缺失和两次 GUI 测试超时。原因、对 P1 的影响以及是否适合提交上游 Issue 均未确认。本文区分此前的观察与本次源码检查。

## 目录

- [Desktop 退出检查](#desktop-quit-inspection)
- [Mandatory Update IPC](#mandatory-update-ipc)
- [并发 GUI 测试](#concurrent-gui-tests)
- [延伸阅读](#further-exploration)
- [开发备注](#dev-note)

-----

<a id="desktop-quit-inspection"></a>
## Desktop 退出检查

**此前观察：**第二次 Desktop 启动时记录了 `desktop quit: task inspection unavailable` 超时；批处理被中断，且没有进程残留，详见[上游同步报告](UPSTREAM_SYNC_REPORT.zh.md#windows-desktop-evidence)。本次源码检查没有复现该现象。

**源码：**[host-process.ts](../../apps/desktop/src/host-process.ts#L59) 将检查期限设为两秒，[第 289 行](../../apps/desktop/src/host-process.ts#L289)发送 Host 控制请求。[quit-confirmation.ts](../../apps/desktop/src/quit-confirmation.ts#L68) 将检查失败视为未知状态并可能要求用户确认；[main.ts](../../apps/desktop/src/main.ts#L1524) 在继续正常退出前等待该决定。超时表明 Host 响应缺失或迟到，不能据此确定根因。

**状态：**是否属于上游缺陷、环境或生命周期原因、对 P1 的影响以及是否提交 Issue 均未确认。应在干净 Desktop 启动及第二次启动时复现，记录 Host 就绪和控制响应时间，并观察确认对话框与进程实际退出，再判断原因。

-----

<a id="mandatory-update-ipc"></a>
## Mandatory Update IPC

**此前观察：**后续一次 Desktop 启动记录了 `dsh-desktop:mandatory-status` Handler 缺失，详见[上游同步报告](UPSTREAM_SYNC_REPORT.zh.md#windows-desktop-evidence)。本次源码检查没有复现该现象。

**源码：**[preload-mandatory-overlay.ts](../../apps/desktop/src/preload-mandatory-overlay.ts#L69) 调用状态 Handler 并处理拒绝；其注释指出开发环境未配置策略是可能情形。[main.ts](../../apps/desktop/src/main.ts#L1553) 仅在存在配置时创建强制更新策略，[mandatory-update-window.ts](../../apps/desktop/src/mandatory-update-window.ts#L73) 在创建窗口控制器时注册 Handler。这些路径解释了一种可能的 Handler 缺失情形，不能确定此前日志的原因。

**状态：**是否属于上游缺陷或预期开发配置、对 P1 的影响以及是否提交 Issue 均未确认。应分别在有和无策略配置时复现，记录 Handler 注册和 Preload 时序，并检查更新覆盖层及策略行为后再判断。

-----

<a id="concurrent-gui-tests"></a>
## 并发 GUI 测试

**此前观察：**完整 GUI 运行中有两项在五秒后超时；两项定向重跑通过，详见[上游同步报告](UPSTREAM_SYNC_REPORT.zh.md#verification-results)。本次源码检查没有复现该结果。

**源码：**[binary-rpc.host.spec.ts](../../packages/client/connection/tests/binary-rpc.host.spec.ts#L24) 启动一个动态分配端口的 Loopback HTTP 服务。[review-tab.client.spec.tsx](../../packages/client/ui-deliverables/tests/review-tab.client.spec.tsx#L358) 渲染并操作 Review 界面。相同的超时现象不能证明两项具有共同原因。

**状态：**是否属于上游缺陷、资源竞争或生命周期原因、对 P1 的影响以及是否提交 Issue 均未确认。应重复全并发运行并记录精确失败项、Worker 数量、机器负载与失败堆栈，再与隔离运行结果比较，之后决定是否调整超时或提交 Issue。

-----

<a id="further-exploration"></a>
## 延伸阅读

- [上游同步报告](UPSTREAM_SYNC_REPORT.zh.md)包含此前的验证结果。
- [WSL2 可行性](WSL2_FEASIBILITY.zh.md)区分 Linux 环境观察和未验证事项。

-----

<a id="dev-note"></a>
## 开发备注

无。
