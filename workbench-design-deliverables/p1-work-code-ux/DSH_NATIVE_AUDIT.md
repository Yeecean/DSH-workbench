# DSH Native Capability Audit (`p1-work-code-ux` Stage 2 Baseline)

> [!NOTE]
> Audited directly against `E:\GH projects\DSH workbench\packages\` prior to extending the Stage Gate 1 prototype into the full **Work / Code / Shared** Workbench. No production code was modified. Every status below reflects verified source files as of `2026-11-13`.

---

## 1. Layout Shell & Single Right-Rail Architecture

| Capability | Verification Status | Evidence in `packages/` | Prototype Alignment Rule |
| :--- | :--- | :--- | :--- |
| 3-Column Frame (`sidebar \| center \| rightbar`) | **Verified Native** | `packages/client/ui-layout/src/client/AppFrame.tsx`, `columns.ts` (`CENTER_MIN = 400`, `SIDEBAR_MIN = 264`, `SIDEBAR_MAX = 420`, `SIDEBAR_DEFAULT = 280`, `SIDEBAR_COLLAPSED = 56`, `SIDEBAR_DRAWER_BREAKPOINT = 768`, `SIDEBAR_AUTO_COLLAPSE = 1024`, `RIGHTBAR_MIN = 300`, `RIGHTBAR_MAX_RATIO = 0.7`, `RIGHTBAR_DEFAULT_RATIO = 0.45`) | Never introduce a second physical right column. Right rail yields (`rightbar = 0`) when `viewport - sidebar - CENTER_MIN < RIGHTBAR_MIN`. |
| Single Right-Rail Dockkit Arbitration & Per-Session Tabs | **Verified Native** | `packages/client/ui-sidebar-right/src/client/service.ts`, `tab-domain.ts`, `tab-inventory.ts` | Files, Terminal, Browser, Document Preview, Changes Review, Plan, Schedule Task, and Subagent Chat all open as tabs/panes inside the single right column via `ui-dockkit`, retaining state when switching sessions. |
| Right-Pane Split (`canSplit`) | **Verified Native** | `packages/client/ui-sidebar-right/src/client/service.ts` imports `canSplit` from `@deepseek-ai/dsh-client-ui-dockkit` | `C3 Build` / `C6 Debug` right-pane split dividers work inside the single right rail when room permits; closing/collapsing panes preserves the underlying session. |

---

## 2. Work Space Capabilities (`W1–W4`, `Task Inspector`)

| Capability | Verification Status | Evidence in `packages/` | Prototype Alignment Rule |
| :--- | :--- | :--- | :--- |
| Structured Approval Cards & Warning Semantics | **Verified Native** | `packages/client/ui-approval/src/client/ApprovalCard.tsx`, `ApprovalWarning.tsx` (request-keyed reset, IME-safe `Enter`/`Escape`, `allowOnce`/`allowAlways`/`reject`, persistent inline card) | `W3` uses inline contextual Approval Cards (neutral vs warning) that stay anchored in their session when switching away—never blocking the whole app with a re-popping modal. |
| Structured Clarification Questions & Plan Review | **Verified Native** | `packages/client/ui-user-questions/src/client/{QuestionComposer.tsx,PlanReviewPanel.tsx,QuestionReplyView.tsx}` | Supported in `W3` (`waiting_for_question`) and Plan review workflows with preserved reply drafts. |
| Plan Artifacts & Right-Rail Plan Preview | **Verified Native** | `packages/client/ui-plan/src/client/{PlanCard.tsx,PlanPreview.tsx}` | Rendered inside Work turns and opened inside the single right rail (`Task Inspector -> Plan`). |
| Deliverables & Turn Changed Files | **Verified Native** | `packages/client/ui-deliverables/src/client/{Deliverables.tsx,PresentedFileCard.tsx,ChangedFiles.tsx}` | `W4 Completed` foregrounds top deliverables/artifact previews and native open/reveal controls before collapsing verbose tool logs. |
| Scheduled Tasks Management | **Verified Native** | `packages/client/ui-schedule/src/client/{definition.ts,TaskManagerPage.tsx,TaskDetail.tsx,ScheduleCreateCard.tsx}` | Scheduled sidebar view & inspector detail are natively supported as Work right-rail / panel concepts. |
| Subagent Execution & Lineage Inspection | **Verified Native** | `packages/client/ui-subagent/src/client/sidebar-chat/index.tsx` | Subagents run as child Sessions viewable in the right rail (`ReadOnlyComposer` + lineage header). Interactive subtask management beyond current read-only sidebar chat is marked clearly if extended. |
| Background Jobs List | **Verified Native** | `packages/client/ui-jobs/src/client/JobListAction.tsx` | Surface active/background processes without fabricating deterministic percentage progress bars. |

---

## 3. Code Space Capabilities (`C1–C6`) & Explicit Concept Boundaries

| Capability | Verification Status | Evidence in `packages/` | Prototype Alignment Rule |
| :--- | :--- | :--- | :--- |
| Files Tree, Terminal, Document Preview | **Verified Native** | `packages/client/ui-sidebar-files`, `packages/client/ui-sidebar-terminal`, `packages/client/ui-sidebar-documentpreview` | Directly represented in Code Space `Files`, `Terminal`, and `Preview` right-rail panes. |
| Unified & Side-by-Side Per-Turn Diff Review | **Verified Native (Read-Only Snapshot)** | `packages/client/ui-deliverables/src/client/{ReviewTab.tsx,FileDiff.tsx}` (`hunkRows`, `splitRows`, Shiki highlight, wrap/nowrap toggle), backed by `packages/deliverables/workspace-changes/src/{types.ts,git.ts,capture.ts}` | `C4 Review` faithfully models `Unified` and `Side-by-side` diff + wrap toggle + non-color `+`/`-` indicators using native per-turn snapshot comparison. |
| **Diff Hunk Apply / Stage / Discard Write-Back** | **Not Native — Pending Git Mutation Audit** | Checked `ui-deliverables/src` & `workspace-changes/src`: `ReviewTab` provides read-only inspection + open file (`locales.ts` lines 45–65); no `applyHunk` / `stageHunk` / `revertHunk` API exists | UI shows explicit badge (`只读对比 · 单块写入/暂存待 Git 变更接口审计`) on Review Hunk controls rather than pretending partial staging mutates the repo. |
| **Git Worktree Creation & Switching** | **Experimental Agent Tool Only (No Frontend Picker UI)** | `packages/experimental/worktree/src/index.ts` (`WorktreeService`), `packages/experimental/tool-worktree/src/index.ts` (`create_worktree` tool) | `C5 Parallel Sessions` models multi-session isolation under one repository. Worktree isolation badge is labeled `实验能力 · 当前由 Agent 工具 create_worktree 创建，前端一键切换待审计`. |
| **In-Workbench Browser Preview** | **Viewer Native (`webview` / `iframe`), Dev Server Orchestration Pending Audit** | `packages/client/ui-sidebar-browser/src/client/{definition.tsx,browser/IframeImpl.ts,electron/ElectronWebViewImpl.ts}` | `C6 Debug` models `Browser Preview + Terminal` in the single right rail, clearly stating Electron `<webview>` / `<iframe>` requires user/Terminal-started URL (no silent auto dev-server launcher claimed). |
| **Code Workspace Presets (`Focus / Build / Review / Debug`)** | **Frontend Layout Orchestration (Built on `ui-layout` + `ui-sidebar-right`)** | New UX layer (`CODE_UX_SPEC.zh.md`); `ui-sidebar-right` owns layout persistence | Implemented as layout presets over the same Session—never destroys running session, draft input, or tool state. |
| **Cursor-Style File Restore Checkpoints** | **Not Native (Only Compaction Checkpoints Exist)** | `rg -w checkpoint` shows only `compact-checkpoint` in `packages/compaction/compaction-basic/src/summarizer.ts` | Do NOT fake one-click file snapshot rewind as live; if referenced as future concept, label `待文件系统快照接口审计`. |

---

## 4. Shared Appearance & Theme Capabilities (`S1`)

| Capability | Verification Status | Evidence in `packages/` | Prototype Alignment Rule |
| :--- | :--- | :--- | :--- |
| Theme Preference (`light \| dark \| system`) | **Verified Native** | `packages/client/ui-theme/src/theme-settings.ts` (`THEME_PREFERENCES = ['light', 'dark', 'system']`) | Synced directly across `index.html` and `S1` Appearance sheet. |
| Per-Role Fonts (`text \| code \| terminal` family & px size) | **Verified Native** | `packages/client/ui-theme/src/theme-settings.ts` (`FONT_ROLES`, `--dsh-content-font-size`, `--dsh-code-font-size`, `--dsh-terminal-font-size`, `textFontFamily`, `codeFontFamily`, `terminalFontFamily`) | Preserved with live controls & Reset defaults; prototype adds `>= 13px` UX floor guard note for UI legibility. |
| **Accent Swatch, Reduced Transparency, Reduced Motion, JSON Theme Import** | **Stage 2 Prototype Extensions (Requires `ui-theme` Config Schema Extension)** | Not present in `packages/client/ui-theme/src/` | Fully interactive in the prototype (`css` variables + JSON token import preview) with explicit notice: **仅原型预览，未写入 DSH 正式设置存储 (`ui-theme`)**. |
