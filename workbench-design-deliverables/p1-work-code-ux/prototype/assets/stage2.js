/* DSH Workbench Stage 2 — Full Work / Code / Shared Interaction Controller
 * Supports both standalone screens/*.html review boards and the unified index.html shell.
 */

(() => {
  const workbenchWindow = document.getElementById("workbench-window");
  if (!workbenchWindow) return;

  const isUnifiedShell = workbenchWindow.dataset.stage2 === "true";

  // -------------------------------------------------------
  // 1. State Preservation Store (Per-Session Drafts & State)
  // -------------------------------------------------------
  const sessionStore = {
    workState: "w1",
    codeState: "c2",
    activeWorkSession: "w-triage",
    activeCodeSession: "c-replay",
    activeDiffFile: "session-guard.ts",
    diffViewMode: "unified", // "unified" | "split"
    diffWrap: false,
    drafts: new Map(), // sessionKey -> string
    workQueue: [],
    approvalsResolved: new Map(), // approvalKey -> "approved" | "always" | "rejected"
    questionAnswer: "",
  };

  function toast(msg) {
    window.DSHWorkbench?.showToast(msg);
  }

  function announce(msg) {
    window.DSHWorkbench?.announce(msg);
  }

  // -------------------------------------------------------
  // 2. Intra-Pane Draggable Split Divider (No easing on drag)
  // -------------------------------------------------------
  document.querySelectorAll(".pane-split-divider").forEach((divider) => {
    const container = divider.closest(".split-pane-container, .right-pane-split");
    if (!container) return;

    let dragging = false;
    let containerRect = null;

    const updateRatio = (pct) => {
      const clamped = Math.max(24, Math.min(76, Math.round(pct)));
      container.style.setProperty("--rightbar-split-ratio", `${clamped}%`);
      divider.setAttribute("aria-valuenow", String(clamped));
    };

    divider.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      containerRect = container.getBoundingClientRect();
      container.classList.add("is-dragging");
      divider.setPointerCapture(e.pointerId);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    });

    divider.addEventListener("pointermove", (e) => {
      if (!dragging || !containerRect || containerRect.height <= 0) return;
      const relY = e.clientY - containerRect.top;
      updateRatio((relY / containerRect.height) * 100);
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      container.classList.remove("is-dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    divider.addEventListener("pointerup", endDrag);
    divider.addEventListener("pointercancel", endDrag);

    divider.addEventListener("keydown", (e) => {
      const current = Number(divider.getAttribute("aria-valuenow")) || 48;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        updateRatio(current - 4);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateRatio(current + 4);
      }
    });
  });

  // -------------------------------------------------------
  // 3. Approval Cards, Questions & Interrupted/Error Recovery
  // -------------------------------------------------------
  document.addEventListener("click", (e) => {
    const toastBtn = e.target.closest("[data-toast-msg]");
    if (toastBtn) {
      toast(toastBtn.dataset.toastMsg);
      return;
    }

    const approvalBtn = e.target.closest("[data-approval-decision]");
    if (approvalBtn) {
      const card = approvalBtn.closest("[data-approval-key]");
      if (!card) return;
      const key = card.dataset.approvalKey;
      const decision = approvalBtn.dataset.approvalDecision;
      sessionStore.approvalsResolved.set(key, decision);

      card.classList.add("is-resolved");
      card.classList.remove("is-warning");
      const strip = card.querySelector("[data-approval-strip-text]");
      const receipt = card.querySelector("[data-approval-receipt]");
      const actions = card.querySelector(".approval-actions");

      const copyMap = {
        once: "已允许本次执行 · 已恢复任务主链路",
        always: "已在本会话中信任此操作 · 后续免重复确认",
        reject: "已拒绝该高风险调用 · 等待替代方案说明",
      };
      if (strip) {
        strip.textContent =
          decision === "reject" ? "已拒绝并中止当前工具调用" : "审批已通过 · 继续执行中";
      }
      if (receipt) {
        receipt.textContent = copyMap[decision] || "已记录决策";
        receipt.hidden = false;
      }
      if (actions) actions.hidden = true;

      // Update sidebar badge indicator for background awareness
      document.querySelectorAll(`[data-session-approval-badge="${key}"]`).forEach((b) => {
        b.textContent = decision === "reject" ? "已拒绝" : "运行中";
        b.className = `nav-status-pill ${decision === "reject" ? "is-interrupted" : "is-running"}`;
      });

      announce(copyMap[decision] || "已更新审批状态");
      toast(copyMap[decision] || "已更新审批状态");
      return;
    }

    const optBtn = e.target.closest("[data-question-option]");
    if (optBtn) {
      const group = optBtn.closest(".question-options");
      group?.querySelectorAll("[data-question-option]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === optBtn));
      });
      sessionStore.questionAnswer = optBtn.dataset.questionOption;
      return;
    }

    const submitQuestion = e.target.closest("[data-submit-question]");
    if (submitQuestion) {
      const card = submitQuestion.closest(".question-card");
      const chosen = sessionStore.questionAnswer || "保留 18px/10px 同心圆角比例";
      const resultEl = card?.querySelector("[data-question-receipt]");
      if (resultEl) {
        resultEl.textContent = `已确认策略：「${chosen}」，任务继续生成交付产物。`;
        resultEl.hidden = false;
      }
      toast(`已回复澄清问题：${chosen}`);
      return;
    }

    const recoverBtn = e.target.closest("[data-recovery-action]");
    if (recoverBtn) {
      const action = recoverBtn.dataset.recoveryAction;
      const card = recoverBtn.closest(".recovery-card");
      const badge = card?.querySelector(".status-chip");
      if (action === "resume") {
        if (badge) {
          badge.className = "status-chip is-running";
          badge.textContent = "已恢复 · 从断点步骤 3 继续";
        }
        toast("已从上一次成功断点恢复执行（不重写历史步骤）");
      } else if (action === "reauth") {
        if (badge) {
          badge.className = "status-chip is-waiting";
          badge.textContent = "等待重新授予文件系统写权限";
        }
        toast("权限检查未伪造绕过，已引导至重新确认");
      } else if (action === "inspect-log") {
        window.DSHWorkbench?.openRightInspector("terminal");
        toast("已打开右侧 Terminal 查看原始堆栈日志");
      }
    }
  });

  // -------------------------------------------------------
  // 4. C4 Review: File Switcher & Unified / Split / Wrap Diff
  // -------------------------------------------------------
  const DIFF_FIXTURES = {
    "session-guard.ts": {
      path: "src/auth/session-guard.ts",
      hunkHeader: "@@ -42,7 +42,10 @@ export function verifyReplayWindow(token: SessionToken)",
      lines: [
        { type: "ctx", oldNo: 42, newNo: 42, code: "export function verifyReplayWindow(token: SessionToken, now = Date.now()): boolean {" },
        { type: "ctx", oldNo: 43, newNo: 43, code: "  if (!token.nonce || !token.issuedAt) return false;" },
        { type: "del", oldNo: 44, newNo: null, code: "  const maxSkewMs = 300_000;" },
        { type: "add", oldNo: null, newNo: 44, code: "  const maxSkewMs = Math.min(token.ttlMs ?? 120_000, 180_000);" },
        { type: "add", oldNo: null, newNo: 45, code: "  if (seenNonces.has(token.nonce)) return false;" },
        { type: "add", oldNo: null, newNo: 46, code: "  seenNonces.add(token.nonce);" },
        { type: "ctx", oldNo: 45, newNo: 47, code: "  return Math.abs(now - token.issuedAt) <= maxSkewMs;" },
        { type: "ctx", oldNo: 46, newNo: 48, code: "}" },
      ],
    },
    "layout-columns.ts": {
      path: "packages/client/ui-layout/src/client/columns.ts",
      hunkHeader: "@@ -55,5 +55,7 @@ export function computeColumns(viewport, sidebar, rightbar)",
      lines: [
        { type: "ctx", oldNo: 55, newNo: 55, code: "const s = sidebar === 0 ? collapsedWidth : clampWidth(sidebar, SIDEBAR_MIN, SIDEBAR_MAX);" },
        { type: "ctx", oldNo: 56, newNo: 56, code: "const available = viewport - s - CENTER_MIN;" },
        { type: "del", oldNo: 57, newNo: null, code: "const r = rightbar === 0 || available < RIGHTBAR_MIN ? 0 : rightbar;" },
        { type: "add", oldNo: null, newNo: 57, code: "const maxAllowed = Math.min(available, Math.round(viewport * RIGHTBAR_MAX_RATIO));" },
        { type: "add", oldNo: null, newNo: 58, code: "const r = rightbar === 0 || available < RIGHTBAR_MIN ? 0 : clampWidth(rightbar, RIGHTBAR_MIN, maxAllowed);" },
        { type: "ctx", oldNo: 58, newNo: 59, code: "return { sidebar: s, center: Math.max(0, viewport - s - r), rightbar: r };" },
      ],
    },
    "guard.spec.ts": {
      path: "tests/auth/guard.spec.ts",
      hunkHeader: "@@ -18,3 +18,7 @@ describe('verifyReplayWindow')",
      lines: [
        { type: "ctx", oldNo: 18, newNo: 18, code: "it('rejects duplicated nonce within TTL window', () => {" },
        { type: "add", oldNo: null, newNo: 19, code: "  const token = createSignedToken({ nonce: 'n-981', ttlMs: 60_000 });" },
        { type: "add", oldNo: null, newNo: 20, code: "  expect(verifyReplayWindow(token)).toBe(true);" },
        { type: "add", oldNo: null, newNo: 21, code: "  expect(verifyReplayWindow(token)).toBe(false);" },
        { type: "ctx", oldNo: 19, newNo: 22, code: "});" },
      ],
    },
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderDiffViewer(root) {
    const surface = root.querySelector("[data-diff-surface]");
    if (!surface) return;
    const fixture = DIFF_FIXTURES[sessionStore.activeDiffFile] || DIFF_FIXTURES["session-guard.ts"];
    surface.classList.toggle("is-wrap", sessionStore.diffWrap);

    let bodyHtml = `<div class="diff-hunk-head">
      <span>${escapeHtml(fixture.path)} · ${escapeHtml(fixture.hunkHeader)}</span>
      <span class="audit-tag">只读快照 · 单块写入待 Git 变更接口审计</span>
    </div>`;

    if (sessionStore.diffViewMode === "unified") {
      bodyHtml += fixture.lines
        .map((ln) => {
          const rowCls = ln.type === "add" ? "is-add" : ln.type === "del" ? "is-del" : "";
          const sig = ln.type === "add" ? "+" : ln.type === "del" ? "-" : " ";
          return `<div class="diff-unified-row ${rowCls}">
            <span class="diff-ln">${ln.oldNo ?? ""}</span>
            <span class="diff-ln">${ln.newNo ?? ""}</span>
            <span class="diff-sig" aria-label="${ln.type}">${sig}</span>
            <span class="diff-code-cell">${escapeHtml(ln.code)}</span>
          </div>`;
        })
        .join("");
    } else {
      // Pair deleted & added lines side-by-side cleanly per FileDiff.tsx splitRows
      const rows = [];
      let dels = [];
      let adds = [];
      const flush = () => {
        const max = Math.max(dels.length, adds.length);
        for (let i = 0; i < max; i += 1) {
          rows.push({ left: dels[i] || null, right: adds[i] || null });
        }
        dels = [];
        adds = [];
      };
      for (const ln of fixture.lines) {
        if (ln.type === "del") dels.push(ln);
        else if (ln.type === "add") adds.push(ln);
        else {
          flush();
          rows.push({ left: ln, right: ln });
        }
      }
      flush();

      bodyHtml += rows
        .map((r) => {
          const leftCls = r.left?.type === "del" ? "is-del" : "";
          const rightCls = r.right?.type === "add" ? "is-add" : "";
          const leftSig = r.left ? (r.left.type === "del" ? "-" : " ") : "";
          const rightSig = r.right ? (r.right.type === "add" ? "+" : " ") : "";
          return `<div class="diff-split-row">
            <div class="diff-split-half ${leftCls}">
              <span class="diff-ln">${r.left?.oldNo ?? ""}</span>
              <span class="diff-sig">${leftSig}</span>
              <span class="diff-code-cell">${escapeHtml(r.left?.code ?? "")}</span>
            </div>
            <div class="diff-split-half ${rightCls}">
              <span class="diff-ln">${r.right?.newNo ?? ""}</span>
              <span class="diff-sig">${rightSig}</span>
              <span class="diff-code-cell">${escapeHtml(r.right?.code ?? "")}</span>
            </div>
          </div>`;
        })
        .join("");
    }

    surface.innerHTML = bodyHtml;
  }

  document.querySelectorAll("[data-diff-viewer-root]").forEach((root) => {
    renderDiffViewer(root);
  });

  document.addEventListener("click", (e) => {
    const fileBtn = e.target.closest("[data-diff-file]");
    if (fileBtn) {
      sessionStore.activeDiffFile = fileBtn.dataset.diffFile;
      document.querySelectorAll("[data-diff-file]").forEach((b) => {
        const match = b.dataset.diffFile === sessionStore.activeDiffFile;
        b.classList.toggle("is-active", match);
        b.setAttribute("aria-current", match ? "true" : "false");
      });
      document.querySelectorAll("[data-diff-viewer-root]").forEach(renderDiffViewer);
      return;
    }

    const modeBtn = e.target.closest("[data-diff-mode]");
    if (modeBtn) {
      sessionStore.diffViewMode = modeBtn.dataset.diffMode;
      document.querySelectorAll("[data-diff-mode]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.diffMode === sessionStore.diffViewMode));
      });
      document.querySelectorAll("[data-diff-viewer-root]").forEach(renderDiffViewer);
      return;
    }

    const wrapBtn = e.target.closest("[data-diff-wrap-toggle]");
    if (wrapBtn) {
      sessionStore.diffWrap = !sessionStore.diffWrap;
      wrapBtn.setAttribute("aria-pressed", String(sessionStore.diffWrap));
      document.querySelectorAll("[data-diff-viewer-root]").forEach(renderDiffViewer);
    }
  });

  // -------------------------------------------------------
  // 5. S1 Modal Dialog (<dialog closedby="any">) + Theme Import
  // -------------------------------------------------------
  const appearanceDialog = document.getElementById("appearance-dialog");

  if (appearanceDialog) {
    // Fallback for engines without <dialog closedby="any">
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const outside = (e, dlg) => {
        const r = dlg.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOut = false;
      appearanceDialog.addEventListener("pointerdown", (e) => {
        pressedOut = outside(e, appearanceDialog);
      });
      appearanceDialog.addEventListener("pointerup", (e) => {
        if (pressedOut && outside(e, appearanceDialog)) appearanceDialog.close();
      });
    }

    appearanceDialog.addEventListener("close", () => {
      // Clear returnValue per dialog guidance so stale choices never leak
      appearanceDialog.returnValue = "";
    });
  }

  document.addEventListener("click", (e) => {
    const openDlgBtn = e.target.closest("[data-open-settings-dialog]");
    if (openDlgBtn && appearanceDialog && typeof appearanceDialog.showModal === "function") {
      const tab = openDlgBtn.dataset.openSettingsDialog || "appearance";
      selectSettingsCategory(appearanceDialog, tab);
      // Close originating glass popover cleanly before modal top-layer promotion
      openDlgBtn.closest("[popover]")?.hidePopover?.();
      appearanceDialog.showModal();
      return;
    }

    const navBtn = e.target.closest("[data-settings-tab]");
    if (navBtn) {
      const container = navBtn.closest("dialog, .settings-standalone-card");
      if (container) selectSettingsCategory(container, navBtn.dataset.settingsTab);
    }
  });

  function selectSettingsCategory(container, tabName) {
    container.querySelectorAll("[data-settings-tab]").forEach((btn) => {
      btn.setAttribute("aria-selected", String(btn.dataset.settingsTab === tabName));
    });
    container.querySelectorAll("[data-settings-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.settingsPanel !== tabName;
    });
  }

  // Theme JSON Import Preview (Safe allowlist of CSS tokens, never touches host files)
  const ALLOWED_THEME_TOKENS = [
    "--accent-light",
    "--accent-dark",
    "--desktop-bg-light",
    "--desktop-bg-dark",
    "--window-bg-light",
    "--window-bg-dark",
    "--surface-content-light",
    "--surface-content-dark",
  ];

  const SAMPLE_THEME_PACKS = {
    graphiteDusk: {
      name: "Apple Graphite Dusk (预览主题)",
      tokens: {
        "--accent-light": "#3b5bdb",
        "--accent-dark": "#91a7ff",
        "--desktop-bg-light": "#d6dce6",
        "--desktop-bg-dark": "#090b10",
      },
    },
    warmPaper: {
      name: "Warm Daylight Studio (预览主题)",
      tokens: {
        "--accent-light": "#0f766e",
        "--accent-dark": "#4fd1c5",
        "--desktop-bg-light": "#e6e1d6",
        "--desktop-bg-dark": "#11100e",
      },
    },
  };

  function applyThemeImportJson(rawText, feedbackEl) {
    try {
      const parsed = JSON.parse(rawText);
      const tokenSource = parsed.tokens && typeof parsed.tokens === "object" ? parsed.tokens : parsed;
      const applied = [];
      for (const [k, v] of Object.entries(tokenSource)) {
        if (ALLOWED_THEME_TOKENS.includes(k) && typeof v === "string" && /^#[0-9a-fA-F]{3,8}$|^rgba?\(/.test(v.trim())) {
          document.documentElement.style.setProperty(k, v.trim());
          applied.push(k);
        }
      }
      if (!applied.length) {
        if (feedbackEl) feedbackEl.textContent = "未识别到安全白名单色值 Token（支持 --accent-light / --desktop-bg-light 等）";
        return;
      }
      const msg = `已预览 ${applied.length} 个主题 Token（仅当前页效果，未写入正式 ui-theme 配置）`;
      if (feedbackEl) feedbackEl.textContent = msg;
      announce(msg);
      toast(msg);
    } catch {
      if (feedbackEl) feedbackEl.textContent = "JSON 解析失败，请检查括号或引号格式";
    }
  }

  document.addEventListener("click", (e) => {
    const sampleBtn = e.target.closest("[data-theme-sample]");
    if (sampleBtn) {
      const pack = SAMPLE_THEME_PACKS[sampleBtn.dataset.themeSample];
      const scope = sampleBtn.closest("[data-theme-import-root]") || document;
      const textarea = scope.querySelector("[data-theme-json-input]");
      const feedback = scope.querySelector("[data-theme-import-feedback]");
      if (pack && textarea) {
        textarea.value = JSON.stringify(pack, null, 2);
        applyThemeImportJson(textarea.value, feedback);
      }
      return;
    }

    const applyBtn = e.target.closest("[data-apply-theme-json]");
    if (applyBtn) {
      const scope = applyBtn.closest("[data-theme-import-root]") || document;
      const textarea = scope.querySelector("[data-theme-json-input]");
      const feedback = scope.querySelector("[data-theme-import-feedback]");
      if (textarea) applyThemeImportJson(textarea.value, feedback);
      return;
    }

    const resetTokensBtn = e.target.closest("[data-reset-theme-json]");
    if (resetTokensBtn) {
      ALLOWED_THEME_TOKENS.forEach((k) => document.documentElement.style.removeProperty(k));
      const scope = resetTokensBtn.closest("[data-theme-import-root]") || document;
      const feedback = scope.querySelector("[data-theme-import-feedback]");
      if (feedback) feedback.textContent = "已清除导入预览变量，恢复系统默认令牌";
      toast("已恢复默认 Apple 材质令牌");
    }
  });

  document.addEventListener("change", (e) => {
    const fileInput = e.target.closest("[data-theme-file-input]");
    if (!fileInput || !fileInput.files?.length) return;
    const file = fileInput.files[0];
    const scope = fileInput.closest("[data-theme-import-root]") || document;
    const textarea = scope.querySelector("[data-theme-json-input]");
    const feedback = scope.querySelector("[data-theme-import-feedback]");
    const reader = new FileReader();
    reader.onload = () => {
      if (textarea) textarea.value = String(reader.result || "");
      applyThemeImportJson(String(reader.result || ""), feedback);
    };
    reader.readAsText(file);
  });

  // -------------------------------------------------------
  // 6. C1 Repository Select Interactions
  // -------------------------------------------------------
  document.addEventListener("click", (e) => {
    const repoBtn = e.target.closest("[data-repo-option]");
    if (repoBtn) {
      const repoName = repoBtn.dataset.repoOption;
      document.querySelectorAll("[data-repo-option]").forEach((b) => {
        const match = b.dataset.repoOption === repoName;
        b.classList.toggle("is-selected", match);
        b.setAttribute("aria-current", match ? "true" : "false");
      });
      const bc = document.getElementById("toolbar-breadcrumb-label");
      if (bc && (workbenchWindow.dataset.workspace === "code")) {
        bc.textContent = `${repoName} / 选择或新建会话`;
      }
      toast(`已绑定工作区仓库：${repoName}`);
    }
  });

  // -------------------------------------------------------
  // 7. Unified Interactive Shell Orchestration (index.html)
  // -------------------------------------------------------
  if (!isUnifiedShell) return;

  const rightInspector = document.getElementById("right-inspector");
  const centerScroll = document.getElementById("center-scroll");
  const breadcrumb = document.getElementById("toolbar-breadcrumb-label");
  const layoutLabel = document.getElementById("layout-preset-label");

  const WORK_VIEW_META = {
    w1: {
      crumb: "临时任务 · 未绑定项目",
      right: null,
      scrollTop: 0,
      placeholder: "输入你的任务目标，按 Enter 发送（Shift+Enter 换行），或拖入文件开始执行...",
    },
    w2: {
      crumb: "Q4 设计体系交付审计 · 运行中 (W2)",
      right: "overview",
      scrollTop: 0,
      placeholder: "任务执行中：输入补充约束将自动加入队列或温和插入下一里程碑...",
    },
    w3: {
      crumb: "多地区定价迁移脚本 · 待审批 (W3 / Error Recovery)",
      right: "plan",
      scrollTop: 0,
      placeholder: "待审批挂起中：完成上方确认卡，或发送说明调整执行计划...",
    },
    w4: {
      crumb: "UI 架构规范审计报告 · 已完成交付 (W4)",
      right: "deliverables",
      scrollTop: 0,
      placeholder: "继续基于本次交付产物追问、细化附录或开启下一步工作...",
    },
  };

  const CODE_VIEW_META = {
    c1: {
      crumb: "DSH workbench · 仓库入口与初始化 (C1)",
      preset: "Focus",
      right: null,
      wide: false,
      scrollTop: 0,
    },
    c2: {
      crumb: "DSH workbench · code-ux · S-102 (C2 Focus)",
      preset: "Focus",
      right: null,
      wide: false,
      scrollTop: 58,
    },
    c3: {
      crumb: "DSH workbench · code-ux · S-101 [运行中] (C3 Build)",
      preset: "Build",
      right: "build-split",
      wide: true,
      scrollTop: 0,
    },
    c4: {
      crumb: "DSH workbench · code-ux · S-103 改动审阅 (C4 Review)",
      preset: "Review",
      right: "changes",
      wide: true,
      scrollTop: 0,
    },
    c5: {
      crumb: "DSH workbench · code-ux · 同仓多会话切换 (C5 Parallel)",
      preset: "Build",
      right: "subagents",
      wide: true,
      scrollTop: 0,
    },
    c6: {
      crumb: "DSH workbench · code-ux · WebView 与终端调试 (C6 Debug)",
      preset: "Debug",
      right: "preview",
      wide: true,
      scrollTop: 0,
    },
  };

  function currentDraftKey() {
    return workbenchWindow.dataset.workspace === "work"
      ? `work:${sessionStore.workState}`
      : `code:${sessionStore.codeState}`;
  }

  function saveCurrentComposerDraft() {
    const area =
      document.querySelector(`[data-stage-panel]:not([hidden]) textarea`) ||
      document.querySelector(`[data-code-state-composer]:not([hidden]) textarea`);
    if (area) sessionStore.drafts.set(currentDraftKey(), area.value);
  }

  function syncRightTabsForWorkspace(space) {
    document.querySelectorAll("#right-inspector [data-tab-space]").forEach((btn) => {
      btn.hidden = btn.dataset.tabSpace !== space;
    });
  }

  function syncCodeDockedComposer(stateId) {
    const dock = document.getElementById("code-composer-dock");
    if (!dock) return;
    const isCode = workbenchWindow.dataset.workspace === "code";
    const showDock = isCode && stateId !== "c1";
    dock.hidden = !showDock;
    dock.querySelectorAll("[data-code-state-composer]").forEach((f) => {
      f.hidden = f.dataset.codeStateComposer !== stateId;
    });
  }

  function renderWorkView(stateId) {
    saveCurrentComposerDraft();
    sessionStore.workState = stateId;
    window.DSHWorkbench?.setWorkspace("work");
    syncRightTabsForWorkspace("work");
    syncCodeDockedComposer(stateId);

    document.querySelectorAll("[data-work-state-panel]").forEach((p) => {
      p.hidden = p.dataset.workStatePanel !== stateId;
    });
    document.querySelectorAll("[data-select-work-state]").forEach((b) => {
      const match = b.dataset.selectWorkState === stateId;
      b.setAttribute("aria-pressed", String(match));
      if (b.classList.contains("nav-row")) b.classList.toggle("is-selected", match);
    });

    const meta = WORK_VIEW_META[stateId] || WORK_VIEW_META.w1;
    if (breadcrumb) breadcrumb.textContent = meta.crumb;
    workbenchWindow.dataset.rightWide = "false";

    if (meta.right) {
      window.DSHWorkbench?.openRightInspector(meta.right);
    } else {
      window.DSHWorkbench?.closeRightInspector();
    }

    if (centerScroll) {
      centerScroll.classList.remove("is-code-scroll");
      centerScroll.scrollTop = meta.scrollTop;
    }

    const activePanel = document.querySelector(`[data-work-state-panel="${stateId}"]`);
    const textarea = activePanel?.querySelector("textarea");
    if (textarea && sessionStore.drafts.has(`work:${stateId}`)) {
      textarea.value = sessionStore.drafts.get(`work:${stateId}`);
    }
    announce(`已切换 Work 状态：${meta.crumb}`);
  }

  function renderCodeView(stateId) {
    saveCurrentComposerDraft();
    sessionStore.codeState = stateId;
    window.DSHWorkbench?.setWorkspace("code");
    syncRightTabsForWorkspace("code");
    syncCodeDockedComposer(stateId);

    document.querySelectorAll("[data-code-state-panel]").forEach((p) => {
      p.hidden = p.dataset.codeStatePanel !== stateId;
    });
    document.querySelectorAll("[data-select-code-state]").forEach((b) => {
      const match = b.dataset.selectCodeState === stateId;
      b.setAttribute("aria-pressed", String(match));
      if (b.classList.contains("nav-row")) b.classList.toggle("is-selected", match);
    });

    const meta = CODE_VIEW_META[stateId] || CODE_VIEW_META.c2;
    if (breadcrumb) breadcrumb.textContent = meta.crumb;
    if (layoutLabel) layoutLabel.textContent = meta.preset;
    workbenchWindow.dataset.rightWide = meta.wide ? "true" : "false";

    document.querySelectorAll("[data-layout-preset]").forEach((item) => {
      if (item.getAttribute("role") === "menuitemradio") {
        item.setAttribute("aria-checked", String(item.dataset.layoutPreset === meta.preset.toLowerCase()));
      }
    });

    if (meta.right) {
      window.DSHWorkbench?.openRightInspector(meta.right);
    } else {
      window.DSHWorkbench?.closeRightInspector();
    }

    if (centerScroll) {
      centerScroll.classList.toggle("is-code-scroll", true);
      centerScroll.scrollTop = meta.scrollTop;
    }

    const activePanel = document.querySelector(`[data-code-state-panel="${stateId}"]`);
    const textarea =
      document.querySelector(`[data-code-state-composer="${stateId}"] textarea`) ||
      activePanel?.querySelector("textarea");
    if (textarea && sessionStore.drafts.has(`code:${stateId}`)) {
      textarea.value = sessionStore.drafts.get(`code:${stateId}`);
    }
    announce(`已切换 Code 状态：${meta.crumb}`);
  }

  // Wire unified sidebar / stage-dock clicks
  document.addEventListener("click", (e) => {
    const wBtn = e.target.closest("[data-select-work-state]");
    if (wBtn) {
      renderWorkView(wBtn.dataset.selectWorkState);
      return;
    }

    const cBtn = e.target.closest("[data-select-code-state]");
    if (cBtn) {
      renderCodeView(cBtn.dataset.selectCodeState);
      return;
    }

    const simParallelBtn = e.target.closest("[data-switch-parallel-session]");
    if (simParallelBtn) {
      const sid = simParallelBtn.dataset.switchParallelSession;
      saveCurrentComposerDraft();
      sessionStore.activeCodeSession = sid;
      document.querySelectorAll("[data-switch-parallel-session]").forEach((b) => {
        b.classList.toggle("is-selected", b.dataset.switchParallelSession === sid);
      });
      document.querySelectorAll("[data-parallel-thread]").forEach((th) => {
        th.hidden = th.dataset.parallelThread !== sid;
      });
      const label = simParallelBtn.dataset.sessionLabel || sid;
      if (breadcrumb) breadcrumb.textContent = `DSH workbench · ${label}`;
      toast(`已切换至会话 ${label}（未决审批与草稿已在后台保留）`);
    }
  });

  // Coordinate top Workspace segmented switcher cleanly with active Work/Code sub-state
  document.addEventListener("dsh:workspace-change", (e) => {
    const space = e.detail?.workspace;
    if (space === "work") {
      syncRightTabsForWorkspace("work");
      syncCodeDockedComposer(sessionStore.workState);
      document.querySelectorAll("[data-work-state-panel]").forEach((p) => {
        p.hidden = p.dataset.workStatePanel !== sessionStore.workState;
      });
      const meta = WORK_VIEW_META[sessionStore.workState];
      if (breadcrumb && meta) breadcrumb.textContent = meta.crumb;
      workbenchWindow.dataset.rightWide = "false";
      if (meta?.right) window.DSHWorkbench?.openRightInspector(meta.right);
      else window.DSHWorkbench?.closeRightInspector();
    } else if (space === "code") {
      syncRightTabsForWorkspace("code");
      syncCodeDockedComposer(sessionStore.codeState);
      document.querySelectorAll("[data-code-state-panel]").forEach((p) => {
        p.hidden = p.dataset.codeStatePanel !== sessionStore.codeState;
      });
      const meta = CODE_VIEW_META[sessionStore.codeState];
      if (breadcrumb && meta) breadcrumb.textContent = meta.crumb;
      workbenchWindow.dataset.rightWide = meta?.wide ? "true" : "false";
      if (meta?.right) window.DSHWorkbench?.openRightInspector(meta.right);
      else window.DSHWorkbench?.closeRightInspector();
    }
  });

  // Coordinate Code Layout Presets (Focus / Build / Review / Debug) on top of same Session
  document.addEventListener("dsh:preset-change", (e) => {
    const preset = e.detail?.preset;
    const map = { focus: "c2", build: "c3", review: "c4", debug: "c6" };
    if (map[preset]) {
      workbenchWindow.dataset.rightWide = preset !== "focus" ? "true" : "false";
      if (preset === "focus") window.DSHWorkbench?.closeRightInspector();
      else {
        const rightTarget = preset === "build" ? "build-split" : preset === "review" ? "changes" : "preview";
        window.DSHWorkbench?.openRightInspector(rightTarget);
      }
      toast(`已应用布局预设 ${preset.toUpperCase()}（会话上下文、历史与草稿保持不断开）`);
    }
  });

  // Composer submission in unified Stage 2 shell (Queue/Follow-up/New Run)
  document.addEventListener("dsh:composer-submit", (e) => {
    const { text, textarea } = e.detail || {};
    if (!text || !textarea) return;
    const space = workbenchWindow.dataset.workspace;

    if (space === "work" && sessionStore.workState === "w2") {
      sessionStore.workQueue.push(text);
      const qStrip = document.getElementById("w2-queue-strip");
      const qText = document.getElementById("w2-queue-text");
      if (qStrip && qText) {
        qStrip.hidden = false;
        qText.textContent = `已排队补充指令 (${sessionStore.workQueue.length})：「${text}」 · 将于当前工具步骤结束后柔和插入`;
      }
      textarea.value = "";
      toast("运行中已温和排队追加指令（不会粗暴中断当前子任务）");
      return;
    }

    textarea.value = "";
    sessionStore.drafts.delete(currentDraftKey());
    toast(`已送入当前${space === "work" ? "任务" : "代码会话"}主链路：「${text.slice(0, 26)}${text.length > 26 ? "…" : ""}」`);
  });

  // Support URL query ?state=w2 | w3 | w4 | c1 | c2 | c3 | c4 | c5 | c6 | s1
  const urlParams = new URLSearchParams(window.location.search);
  const initState = (urlParams.get("state") || "").toLowerCase();
  if (/^w[1-4]$/.test(initState)) {
    renderWorkView(initState);
  } else if (/^c[1-6]$/.test(initState)) {
    renderCodeView(initState);
  } else if (initState === "s1" && appearanceDialog) {
    renderWorkView("w1");
    setTimeout(() => appearanceDialog.showModal(), 40);
  } else if (urlParams.get("workspace") === "code") {
    renderCodeView("c2");
  } else {
    renderWorkView("w1");
  }
})();
