# DSH Workbench P1 — 隔离的设计交付物归档

[English](README.md) | 中文

本目录保存 DSH Workbench P1 Open Design 交付物的一份自包含、不污染仓库的副本，使其随 Git 一起保存，同时不修改、不混入产品包（`packages/*`、`apps/*`）、构建与测试脚本（`scripts/*`）或待定的工作区草案（`docs/workbench/*`）。

## 目录内容

- `open-design-project/dsh-workbench-p1-shell/` —— 可编辑 Open Design 项目的完整导出（`index.html`、`screens/01-home-context.html` 至 `screens/06-theme-import.html`、`assets/tokens.css`、`assets/theme-schema.json`、`README.md`、`DESIGN_COMPARISON.md`、artifact 清单，以及 10 张高分辨率 `exports/od-*.png` 截图）。
  - Open Design 本地工作区目录：`C:/Users/Haoyang/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/dsh-workbench-p1-shell`
- `workspace-design-index/` —— 更新后的双语设计索引快照（`README.md` 与 `README.zh.md`），记录 Open Design 项目位置、打开方式与导出的画面。
- `scripts/export-od-screens.mjs` —— Playwright/Edge 无头导出与参考视口几何校验脚本（`1440×900`、`1280×800`、`1024px`、`768px`、`767px`），用于生成 `exports/od-*.png`。

## 范围与评审状态

- 覆盖的设计方向：方向 A（原生延续型）与方向 B（轻度产品化型）同屏对比。
- 覆盖的核心状态：`Home + Context`（无活动 Session）、`Conversation + Session`（不透明原生 Terminal/Files）、`Conversation + Context`（单轨切换并保留 Session 逻辑状态）、窄窗口（`767px`）、`Appearance Settings`（受控外壳玻璃与实色回退），以及版本化 JSON `Theme Import`（预览、不安全 CSS/URL 拒绝、取消、应用、回滚）。
- 未修改生产代码、Runtime、`ui-layout`、`ui-sidebar-right` 与 Desktop 启动流程。用户设计审批待定（`D1`、`D1-A`、`D1-B`、`D2`、`D3`、`D4`）。
