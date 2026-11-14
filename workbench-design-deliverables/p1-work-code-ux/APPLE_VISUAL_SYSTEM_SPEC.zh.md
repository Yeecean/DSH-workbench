# Apple 主视觉系统规范

## 唯一当前视觉方向
Apple macOS Design Language / Liquid Glass。Soft Editorial 只记录为后续参考，当前不进入页面、组件、Token 或样式。

## HIG 原则
优先研究 Designing for macOS、Materials、Sidebars、Split Views、Toolbars、Typography、Accessibility。内容优先；用户可调整和隐藏面板；支持全屏与快捷键；Sidebar 是导航而非卡片集合；Split View 有清晰层级；Liquid Glass 属于功能层，不铺满内容；内容层采用 Standard Materials；圆角遵循 Concentricity。

## 材质分层
**Liquid Glass 功能层**：Toolbar、Workspace Switcher、Sidebar、Popover、Menu、Command Menu、少量浮动 Inspector Header。背景内容可延伸到其后，透明度和模糊适配背景，使用边缘高光、细腻描边和柔和阴影。
**Standard Material 内容层**：Conversation、文档、Diff、Terminal、Files、编辑区域。保证稳定高对比。
**瞬时层**：Popover、菜单、确认面板，边界明确、可关闭。

## Windows / Electron
Apple 是视觉规范，不意味着 Windows 可直接调用 Apple 原生材质。窗口底层可审计 Mica / BrowserWindow 系统材质；应用内导航与浮层使用 CSS backdrop-filter、半透明色层、边缘和阴影；内容层保持可读。窗口级背景与 React 组件级材质不同，不能混为一谈。真实 Windows Desktop 中验证背景透射、模糊采样、滚动/Resize/全屏、性能和实色回退。仅有 blur CSS 不算完成。

## 形状
建立协调圆角尺度：Window 外层最大，Sidebar / Inspector 次之，内容容器再次，输入和控件与父容器同心嵌套。禁止 4–8px 小圆角成为主语言，禁止所有组件胶囊化，禁止直角后台卡片。

## 字体
默认英文 UI / 正文 / 标签全部 JetBrains Mono；中文 UI / 正文全部寒蝉半圆体；Code / Terminal JetBrains Mono。建议字体栈：
`font-family: "JetBrains Mono", "寒蝉半圆体", sans-serif;`
按字形回退：JetBrains Mono 渲染支持的拉丁字符，汉字由寒蝉半圆体渲染。Windows 上验证字体文件、字重、标点、中英文混排与缺字回退。保留原生 text / code / terminal 三种字体角色及字号设置。不得擅自将英文改为 Inter / Segoe UI。辅助文字不低于 13px，正文优先 14–16px；等宽英文长句通过行宽和排版解决。

## 色彩、空间、动效
Light / Dark 语义 Token。强调色克制。Work 更舒展，Code 更高效但分组清晰。Conversation 行宽舒适，Composer 与主内容对齐。Sidebar 与 Main Canvas 形成连续空间。动效轻量，不影响拖动和输入，尊重减少动态效果。

## 禁止
旧 A/B、后台卡片墙、满屏徽标、直角边框、全内容区玻璃、仅 Titlebar blur、默认方正系统中文字体、Soft Editorial 混合。

## 验收
Apple 风格明确；功能层玻璃真实可见；内容层可读；Concentricity 协调；英文 JetBrains Mono、中文寒蝉半圆体；字体切换有效；Light/Dark 与透明回退完整。
