---
description: "桌面端 Workbench 叠加组合包：在 dsh-web-app 之上挂载 Liquid Glass 界面、Work × Code 模式切换、全局任务检查器与离线字体。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-workbench

[English](README.md) | 中文

## 概述

`@deepseek-ai/dsh-workbench` 在不修改随 CLI 交付的 `web` profile 模板的前提下，将正式版 dsh Workbench 桌面体验（`@deepseek-ai/dsh-client-ui-workbench`）叠加到 `@deepseek-ai/dsh-web-app` 之上。Electron 桌面启动器默认在 `dsh-web-app` 之后挂载本组合包（设置环境变量 `DSH_WORKBENCH=0` 可干净回退）。本包为组合配置载体，而非供直接导入的库。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

桌面端在准备启动上下文时会自动把 `@deepseek-ai/dsh-workbench` 追加到内部 `dsh` profile 列表中。若需在其他基于 `web-app` 的自定义 profile 中手动叠加，请将其置于 `@deepseek-ai/dsh-web-app` 之后：

```json
{
  "name": "my-workbench-profile",
  "private": true,
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@deepseek-ai/dsh-workbench"
      ]
    }
  }
}
```

在 Electron 桌面环境中设置 `DSH_WORKBENCH=0`，即可回退到未叠加 Workbench 的原生 `web` 组合包列表（`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`）。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

`cordis.patch.yml` 在 `base + web-app` 组合之上追加一行插件声明（`id: ui-workbench`、`name: "@deepseek-ai/dsh-client-ui-workbench"`）。所有运行时界面、单右栏仲裁、离线字体激活与主题校验均归属 `@deepseek-ai/dsh-client-ui-workbench`；桌面启动器同时把本组合包加入外置插件管理隐藏名单（`HIDDEN_BUNDLES`），不影响用户自行安装的第三方插件。

| 文件 | 职责 |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | 插入 `@deepseek-ai/dsh-client-ui-workbench` 的叠加 patch |
| [`src/index.ts`](src/index.ts) | 组合包占位入口；不提供运行时 API |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-workbench](../../client/ui-workbench/README.zh.md)——本组合包挂载的 Client / Host 插件。
- [dsh-web-app](../web-app/README.zh.md)——底层先加载的浏览器表层组合包。
- [桌面端应用](../../../apps/desktop/README.zh.md)——负责组装内置 `dsh` profile 的 Electron 桌面启动器。

-----

<a id="model-experience"></a>
## 模型体验

通过每条插入行所属的包间接产生影响，由各包负责其行的模型可见行为。

#### KV Cache 影响

组合包本身不添加任何请求前缀；每条插入行所属的包负责各自的缓存影响。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **必须排在 `@deepseek-ai/dsh-web-app` 之后加载** — 缺少 `dsh-web-app` 时缺少必需的浏览器界面服务（`ui-layout`、`ui-theme`、`ui-conversation`、`ui-settings`）。
- **默认桌面挂载仅通过 `DSH_WORKBENCH=0` 关闭** — 应用内的第三方插件禁用操作会保留本内置叠加包。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
