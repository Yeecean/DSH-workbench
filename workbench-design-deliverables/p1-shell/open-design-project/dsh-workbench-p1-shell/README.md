# DSH Workbench P1 — Open Design 原生项目说明

## 项目信息

- **项目名称**：`DSH Workbench P1 — Desktop Shell 与右栏仲裁`
- **Project ID**：`dsh-workbench-p1-shell`
- **主入口文件**：`index.html`（自包含可编辑交互原型，覆盖方向 A 原生延续型、方向 B 轻度产品化型、同屏对比矩阵与 8 个核心验收状态）
- **Token 与主题规范资产**：`assets/tokens.css`、`assets/theme-schema.json`
- **分页可编辑画板**：`screens/01-home-context.html` 至 `screens/06-theme-import.html`
- **设计方向对比与待审批决策**：`DESIGN_COMPARISON.md`

## 如何在 Open Design 中打开与继续编辑

1. 启动本地 Open Design 桌面客户端。
2. 在项目列表中选择 **「DSH Workbench P1 — Desktop Shell 与右栏仲裁」**（ID：`dsh-workbench-p1-shell`）。
3. 打开 `index.html` 即可在画布中直接交互或编辑 HTML/CSS/Token；也可分别打开 `screens/` 下的独立状态画板。
4. 支持通过 URL 查询参数直接定位到特定评审状态：
   - `?preset=home-no-session&dir=native`：方向 A · Home + Context（无活动 Session）
   - `?preset=home-no-session&dir=product`：方向 B · Home + Context（无活动 Session）
   - `?preset=conv-session&dir=product`：Conversation + 原生 Session 右栏（Terminal + Files 分栏）
   - `?preset=conv-context&dir=product`：Conversation + Global Context（单轨切换、Session 逻辑状态保留）
   - `?preset=narrow-767&dir=product`：767px 窄窗口降级与抽屉/叠层呈现
   - `?preset=appearance&dir=product`：Appearance 外观设置与玻璃/实色回退对比
   - `?preset=theme-import&dir=product`：自定义主题导入预览、白名单校验与恢复流程

## 边界声明

本项目是 P1 阶段的设计与交互评审资产。所有数据、路径、会话与主题导入流程均为明确标识的设计示例，不修改生产代码、不替换 `root` 或原生 `rightbar`、不发起真实模型请求。
