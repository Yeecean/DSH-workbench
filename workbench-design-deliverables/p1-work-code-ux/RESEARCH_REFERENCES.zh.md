# 设计研究来源与模式提取

## Apple：视觉与桌面交互
- [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)：桌面空间、窗口调整/隐藏/全屏、快捷键、工具栏自定义。
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)：Liquid Glass 功能层、Standard Materials 内容层、导航悬浮和内容延伸。
- [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)：顶层导航、层级和紧凑模式。
- [Split Views](https://developer.apple.com/design/human-interface-guidelines/split-views)：Pane 层级、选中关系、拖放和多窗口宽度。
- [WWDC25: Build an AppKit app with the new design](https://developer.apple.com/videos/play/wwdc2025/310/)：Glass、Controls、Scroll Edge、Concentricity。Apple API 是设计参考，Windows 实现另行验证。

## Anthropic：Work
- [Claude Cowork](https://claude.com/product/cowork)：统一任务入口、过程可见可干预、多步骤任务和成果交付；DSH Work 使用单一 Composer。
- [Claude Projects in Cowork](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork)：Project 长期上下文、文件和指令；不是一次 Session。
- [Cowork on web / desktop / mobile](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile)：平台差异、本地文件和浏览器能力边界。

## Anthropic：Code
- [Claude Code Desktop](https://code.claude.com/docs/en/desktop)：Session、Diff Review、Pane 重排、Terminal、Files、View modes、Parallel Sessions、Worktree。提取独立 Session 历史、Pane 可调整、Terminal 绑定工作目录、Diff 与 Session 进度集成。

## OpenAI：并行 Agent
- [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)：Project 下 Thread、多 Agent 并行、Worktree 隔离、Diff Review、IDE/CLI/Desktop 历史共享。
- [Codex for (almost) everything](https://openai.com/index/codex-for-almost-everything/)：多文件、多 Terminal、PR Review、Remote Devbox、Browser、前端验证工作流。仅吸收模式，不引入 Codex 视觉。

## Cursor：恢复
- [Agent Checkpoints](https://docs.cursor.com/en/agent/chat/checkpoints)：Agent 修改快照、预览和恢复；与 Git 历史的区别。此为后续参考，不代表 DSH 已有服务。

## 结论
Apple HIG 负责主视觉；Claude Work 负责通用 Agent 任务 UX；Claude Code 负责编程工作台 UX；Codex 负责并行 Agent / Worktree / Diff Review 补充；Cursor 负责 Checkpoint 恢复参考。竞品资料不证明 DSH 具备相同 API。Browser、Worktree、Diff、Editor、Checkpoint、Scheduled Task、Artifact Preview、Subagent 等能力必须先审计。
