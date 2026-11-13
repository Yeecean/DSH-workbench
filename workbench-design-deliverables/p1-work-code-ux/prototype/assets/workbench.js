/* DSH Workbench Stage 1 — Interactive Shell, Popovers, Focusgroup & Breakpoint Controller
 * Strict Stage Gate 1 scope: W1 Work Empty + C2 Code Focus + Appearance & Font Controls
 */

(() => {
  const STORAGE_KEY = "dsh.workbench.stage1.appearance";

  const DEFAULT_APPEARANCE = {
    theme: "system",          // "system" | "light" | "dark"
    transparency: "glass",    // "glass" | "reduce"
    accent: "blue",           // "blue" | "indigo" | "teal" | "graphite"
    fontText: '"JetBrains Mono", "寒蝉半圆体", sans-serif',
    fontCode: '"JetBrains Mono", "寒蝉半圆体", monospace',
    fontTerminal: '"JetBrains Mono", "寒蝉半圆体", monospace',
    sizeText: 14,
    sizeCode: 13,
    sizeTerminal: 13,
  };

  const docEl = document.documentElement;
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const liveStatus = document.getElementById("a11y-live-status");
  const desktopFrame = document.getElementById("desktop-frame");
  const workbenchWindow = document.getElementById("workbench-window");

  if (!workbenchWindow) return;

  function announce(msg) {
    if (!liveStatus) return;
    liveStatus.textContent = "";
    requestAnimationFrame(() => {
      liveStatus.textContent = msg;
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById("workbench-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  // -------------------------------
  // 1. Appearance & Font Management
  // -------------------------------
  function loadAppearance() {
    let state = { ...DEFAULT_APPEARANCE };
    const lockFromUrl = new URLSearchParams(window.location.search);
    const isStandalone = document.body.dataset.standalone === "true";

    if (!isStandalone) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          state = { ...state, ...JSON.parse(raw) };
        }
      } catch {
        // Ignore blocked storage
      }
    }

    if (lockFromUrl.has("theme")) state.theme = lockFromUrl.get("theme");
    if (lockFromUrl.has("transparency")) state.transparency = lockFromUrl.get("transparency");
    if (lockFromUrl.has("accent")) state.accent = lockFromUrl.get("accent");
    return state;
  }

  function saveAppearance(state) {
    if (document.body.dataset.standalone === "true") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore blocked storage
    }
  }

  let appearance = loadAppearance();
  const darkMql = window.matchMedia("(prefers-color-scheme: dark)");

  function resolvedSystemLabel() {
    return darkMql.matches ? "跟随系统（当前深色）" : "跟随系统（当前浅色）";
  }

  function applyAppearance(state) {
    const metaValue = state.theme === "dark" ? "dark" : state.theme === "light" ? "light" : "light dark";
    if (metaColorScheme) {
      metaColorScheme.setAttribute("content", metaValue);
    }

    docEl.dataset.transparency = state.transparency === "reduce" ? "reduce" : "glass";
    docEl.dataset.accent = state.accent || "blue";

    docEl.style.setProperty("--dsh-font-family-text", state.fontText);
    docEl.style.setProperty("--dsh-font-family-code", state.fontCode);
    docEl.style.setProperty("--dsh-font-family-terminal", state.fontTerminal);
    docEl.style.setProperty("--dsh-content-font-size", `${state.sizeText}px`);
    docEl.style.setProperty("--dsh-code-font-size", `${state.sizeCode}px`);
    docEl.style.setProperty("--dsh-terminal-font-size", `${state.sizeTerminal}px`);

    // Sync Popover controls if present
    document.querySelectorAll("[data-theme-choice]").forEach((btn) => {
      const val = btn.dataset.themeChoice;
      btn.setAttribute("aria-pressed", String(val === state.theme));
      if (val === "system") {
        btn.title = resolvedSystemLabel();
        const hint = document.getElementById("system-theme-hint");
        if (hint) hint.textContent = darkMql.matches ? "当前系统：深色" : "当前系统：浅色";
      }
    });

    document.querySelectorAll("[data-transparency-choice]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.transparencyChoice === state.transparency));
    });

    document.querySelectorAll("[data-accent-choice]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.accentChoice === state.accent));
    });

    const selectMap = {
      text: state.fontText,
      code: state.fontCode,
      terminal: state.fontTerminal,
    };
    document.querySelectorAll("[data-font-role-select]").forEach((sel) => {
      const role = sel.dataset.fontRoleSelect;
      if (selectMap[role]) sel.value = selectMap[role];
    });

    const sizeMap = {
      text: state.sizeText,
      code: state.sizeCode,
      terminal: state.sizeTerminal,
    };
    Object.entries(sizeMap).forEach(([role, val]) => {
      const out = document.querySelector(`[data-size-readout="${role}"]`);
      if (out) out.textContent = `${val}px`;
    });
  }

  applyAppearance(appearance);

  darkMql.addEventListener("change", () => {
    if (appearance.theme === "system") {
      applyAppearance(appearance);
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      appearance = loadAppearance();
      applyAppearance(appearance);
    }
  });

  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest("[data-theme-choice]");
    if (themeBtn) {
      appearance.theme = themeBtn.dataset.themeChoice;
      saveAppearance(appearance);
      applyAppearance(appearance);
      return;
    }

    const transBtn = e.target.closest("[data-transparency-choice]");
    if (transBtn) {
      appearance.transparency = transBtn.dataset.transparencyChoice;
      saveAppearance(appearance);
      applyAppearance(appearance);
      return;
    }

    const accentBtn = e.target.closest("[data-accent-choice]");
    if (accentBtn) {
      appearance.accent = accentBtn.dataset.accentChoice;
      saveAppearance(appearance);
      applyAppearance(appearance);
      return;
    }

    const stepBtn = e.target.closest("[data-size-step]");
    if (stepBtn) {
      const role = stepBtn.dataset.sizeRole;
      const delta = Number(stepBtn.dataset.sizeStep);
      const bounds = {
        text: [13, 20],
        code: [13, 16],
        terminal: [13, 18],
      }[role];
      const key = { text: "sizeText", code: "sizeCode", terminal: "sizeTerminal" }[role];
      if (bounds && key) {
        appearance[key] = Math.min(bounds[1], Math.max(bounds[0], appearance[key] + delta));
        saveAppearance(appearance);
        applyAppearance(appearance);
      }
      return;
    }

    if (e.target.closest("[data-reset-appearance]")) {
      appearance = { ...DEFAULT_APPEARANCE };
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      applyAppearance(appearance);
      announce("已恢复默认外观与字体设置");
      showToast("已恢复默认外观与字体配置");
    }
  });

  document.addEventListener("change", (e) => {
    const sel = e.target.closest("[data-font-role-select]");
    if (!sel) return;
    const role = sel.dataset.fontRoleSelect;
    const key = { text: "fontText", code: "fontCode", terminal: "fontTerminal" }[role];
    if (key) {
      appearance[key] = sel.value;
      saveAppearance(appearance);
      applyAppearance(appearance);
    }
  });

  // -----------------------------------------
  // 2. Popover & Anchor Positioning Fallbacks
  // -----------------------------------------
  const supportsInvoker = "commandForElement" in HTMLButtonElement.prototype;
  const supportsPositionArea = CSS.supports("position-area", "block-end");

  function positionPopoverFallback(pop, trigger) {
    if (!pop || !trigger || supportsPositionArea) return;
    const tr = trigger.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    const margin = 12;
    const gap = 6;
    const preferAbove = pop.classList.contains("anchored-above");

    let top = preferAbove ? tr.top - pr.height - gap : tr.bottom + gap;
    if (!preferAbove && top + pr.height > window.innerHeight - margin) {
      top = Math.max(margin, tr.top - pr.height - gap);
    } else if (preferAbove && top < margin) {
      top = Math.min(window.innerHeight - margin - pr.height, tr.bottom + gap);
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - margin - pr.height));

    let left = preferAbove ? tr.left : tr.right - pr.width;
    if (left < margin) left = tr.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - margin - pr.width));

    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
  }

  const lastTriggerByPopover = new WeakMap();

  if (!supportsInvoker) {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('button[commandfor][command="toggle-popover"]');
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("commandfor"));
      if (!target) return;
      e.preventDefault();
      lastTriggerByPopover.set(target, btn);
      if (target.matches(":popover-open")) {
        target.hidePopover();
      } else {
        target.showPopover({ source: btn });
      }
    });
  } else {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('button[commandfor][command="toggle-popover"]');
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("commandfor"));
      if (target) lastTriggerByPopover.set(target, btn);
    });
  }

  document.addEventListener(
    "toggle",
    (e) => {
      const pop = e.target;
      if (!(pop instanceof HTMLElement) || !pop.hasAttribute("popover")) return;
      const isOpen = e.newState === "open";
      const trigger =
        lastTriggerByPopover.get(pop) ||
        document.querySelector(`[commandfor="${CSS.escape(pop.id)}"]`);

      if (trigger) {
        trigger.setAttribute("aria-expanded", String(isOpen));
      }

      if (isOpen) {
        if (trigger) positionPopoverFallback(pop, trigger);
        const menuGroup = pop.querySelector('[focusgroup~="menu"]');
        if (menuGroup) {
          const firstItem = menuGroup.querySelector(
            'button:not([aria-disabled="true"]):not(:disabled)'
          );
          if (firstItem && e.source === trigger) {
            requestAnimationFrame(() => firstItem.focus({ preventScroll: true }));
          }
        }
      }
    },
    true
  );

  // Menu keyboard fallback if native focusgroup unsupported
  if (!("focusGroup" in HTMLElement.prototype)) {
    document.querySelectorAll('[focusgroup~="menu"]').forEach((group) => {
      group.setAttribute("role", "menu");
      group.querySelectorAll("button:not([role])").forEach((b) => b.setAttribute("role", "menuitem"));
      group.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = [...group.querySelectorAll("button")].filter(
          (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true"
        );
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
            ? items.length - 1
            : (idx + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
        event.preventDefault();
        items[next].focus({ preventScroll: true });
      });
    });

    document.querySelectorAll('[focusgroup~="tablist"]').forEach((tablist) => {
      tablist.setAttribute("role", "tablist");
      const tabs = [...tablist.querySelectorAll("button")];
      tabs.forEach((t, i) => {
        t.setAttribute("role", "tab");
        if (!t.hasAttribute("tabindex")) {
          t.tabIndex = t.getAttribute("aria-selected") === "true" || i === 0 ? 0 : -1;
        }
      });
      tablist.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const idx = tabs.indexOf(document.activeElement);
        if (idx < 0) return;
        const nextIdx =
          event.key === "Home"
            ? 0
            : event.key === "End"
            ? tabs.length - 1
            : (idx + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
        event.preventDefault();
        tabs.forEach((t, j) => (t.tabIndex = j === nextIdx ? 0 : -1));
        tabs[nextIdx].focus({ preventScroll: true });
      });
    });
  }

  // -----------------------------------------
  // 3. Responsive Breakpoints & Mobile Drawer
  // -----------------------------------------
  const sidebar = document.getElementById("primary-sidebar");
  const drawerScrim = document.getElementById("drawer-scrim");
  const mainWorkspace = document.getElementById("main-workspace");
  const windowToolbar = document.getElementById("window-toolbar");
  const sessionToolbarWrap = document.getElementById("session-toolbar-wrap");
  let userCollapsedPref = null; // null = follow breakpoint auto behavior
  let lastToggleOpener = null;

  function currentFrameWidth() {
    return desktopFrame ? desktopFrame.getBoundingClientRect().width : window.innerWidth;
  }

  function syncDrawerA11y() {
    const w = currentFrameWidth();
    const isDrawerViewport = w < 768;
    const isOpen = workbenchWindow.classList.contains("mobile-drawer-open");

    if (sidebar) {
      sidebar.inert = isDrawerViewport && !isOpen;
    }
    if (drawerScrim) {
      drawerScrim.hidden = !(isDrawerViewport && isOpen);
    }
    if (mainWorkspace) mainWorkspace.inert = isDrawerViewport && isOpen;
    if (windowToolbar) windowToolbar.inert = isDrawerViewport && isOpen;
    if (sessionToolbarWrap) sessionToolbarWrap.inert = isDrawerViewport && isOpen;

    document.querySelectorAll("[data-sidebar-toggle]").forEach((btn) => {
      if (isDrawerViewport) {
        btn.setAttribute("aria-expanded", String(isOpen));
      } else {
        const collapsed =
          workbenchWindow.classList.contains("sidebar-collapsed") ||
          (w <= 1024 && !workbenchWindow.classList.contains("sidebar-force-expanded"));
        btn.setAttribute("aria-expanded", String(!collapsed));
      }
    });
  }

  function closeMobileDrawer(restoreFocus = true) {
    workbenchWindow.classList.remove("mobile-drawer-open");
    syncDrawerA11y();
    if (restoreFocus && lastToggleOpener) {
      lastToggleOpener.focus({ preventScroll: true });
      lastToggleOpener = null;
    }
  }

  function toggleSidebar(triggerBtn) {
    const w = currentFrameWidth();
    if (w < 768) {
      const opening = !workbenchWindow.classList.contains("mobile-drawer-open");
      if (opening) {
        lastToggleOpener = triggerBtn || document.activeElement;
        workbenchWindow.classList.add("mobile-drawer-open");
        syncDrawerA11y();
        const closeBtn = sidebar?.querySelector("[data-sidebar-toggle]");
        if (closeBtn) requestAnimationFrame(() => closeBtn.focus({ preventScroll: true }));
      } else {
        closeMobileDrawer(true);
      }
      return;
    }

    if (w <= 1024) {
      const nextExpanded = !workbenchWindow.classList.contains("sidebar-force-expanded");
      workbenchWindow.classList.toggle("sidebar-force-expanded", nextExpanded);
      workbenchWindow.classList.remove("sidebar-collapsed");
      userCollapsedPref = !nextExpanded;
    } else {
      const nextCollapsed = !workbenchWindow.classList.contains("sidebar-collapsed");
      workbenchWindow.classList.toggle("sidebar-collapsed", nextCollapsed);
      workbenchWindow.classList.remove("sidebar-force-expanded");
      userCollapsedPref = nextCollapsed;
    }
    syncDrawerA11y();
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-sidebar-toggle]");
    if (toggle) {
      toggleSidebar(toggle);
    }
  });

  if (drawerScrim) {
    drawerScrim.addEventListener("click", () => closeMobileDrawer(true));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && workbenchWindow.classList.contains("mobile-drawer-open")) {
      e.preventDefault();
      closeMobileDrawer(true);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
      e.preventDefault();
      toggleSidebar(document.activeElement);
    }
  });

  if (desktopFrame && "ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      const w = currentFrameWidth();
      if (w >= 768 && workbenchWindow.classList.contains("mobile-drawer-open")) {
        workbenchWindow.classList.remove("mobile-drawer-open");
      }
      if (w > 1024) {
        workbenchWindow.classList.remove("sidebar-force-expanded");
        if (userCollapsedPref === true) {
          workbenchWindow.classList.add("sidebar-collapsed");
        } else {
          workbenchWindow.classList.remove("sidebar-collapsed");
        }
      }
      syncDrawerA11y();
    });
    ro.observe(desktopFrame);
  }

  syncDrawerA11y();

  // -----------------------------------------
  // 4. Single-Track Right Inspector & Switcher
  // -----------------------------------------
  const rightInspector = document.getElementById("right-inspector");
  const rightResizer = document.getElementById("right-resizer");

  function selectRightTab(tabId) {
    if (!rightInspector) return;
    rightInspector.querySelectorAll('[role="tab"], [data-right-tab]').forEach((tab) => {
      const match = tab.dataset.rightTab === tabId;
      tab.setAttribute("aria-selected", String(match));
      if (!("focusGroup" in HTMLElement.prototype)) {
        tab.tabIndex = match ? 0 : -1;
      }
      tab.toggleAttribute("focusgroupstart", match);
    });
    rightInspector.querySelectorAll("[data-right-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.rightPanel !== tabId;
    });
    document.querySelectorAll("[data-open-right-tab]").forEach((btn) => {
      const active =
        workbenchWindow.dataset.rightOpen === "true" && btn.dataset.openRightTab === tabId;
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function openRightInspector(tabId = "files") {
    if (!rightInspector) return;
    rightInspector.hidden = false;
    workbenchWindow.dataset.rightOpen = "true";
    selectRightTab(tabId);
  }

  function closeRightInspector() {
    if (!rightInspector) return;
    rightInspector.hidden = true;
    workbenchWindow.dataset.rightOpen = "false";
    document.querySelectorAll("[data-open-right-tab]").forEach((btn) => {
      btn.setAttribute("aria-pressed", "false");
    });
  }

  function setWorkspace(space) {
    if (!workbenchWindow.dataset.switchable) return;
    const isCode = space === "code";
    workbenchWindow.dataset.workspace = space;

    document.querySelectorAll("[data-switch-workspace]").forEach((tab) => {
      const active = tab.dataset.switchWorkspace === space;
      tab.setAttribute("aria-selected", String(active));
      if ("tabIndex" in tab) tab.tabIndex = active ? 0 : -1;
    });

    document.querySelectorAll("[data-only-workspace]").forEach((el) => {
      el.hidden = el.dataset.onlyWorkspace !== space;
    });

    if (sessionToolbarWrap) {
      sessionToolbarWrap.hidden = !isCode;
    }

    const scrollArea = document.getElementById("center-scroll");
    if (scrollArea) {
      scrollArea.classList.toggle("is-code-scroll", isCode);
      scrollArea.scrollTop = isCode ? 58 : 0;
    }

    // Single-track Right Inspector belongs to active Code state unless toggled explicitly in Work
    if (!isCode) {
      closeRightInspector();
    }

    const breadcrumb = document.getElementById("toolbar-breadcrumb-label");
    if (breadcrumb) {
      breadcrumb.textContent = isCode ? "DSH workbench / code-ux" : "临时任务 · 未绑定项目";
    }
  }

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-switch-workspace]");
    if (!tab || !workbenchWindow.dataset.switchable) return;
    setWorkspace(tab.dataset.switchWorkspace);
  });

  // Initialize C2 scroll-underneath offset so glass scroll-edge is immediately perceptible
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("workspace")) {
    setWorkspace(urlParams.get("workspace") === "code" ? "code" : "work");
  } else {
    const initialSpace = workbenchWindow.dataset.workspace || "work";
    const scrollArea = document.getElementById("center-scroll");
    if (scrollArea && initialSpace === "code") {
      scrollArea.scrollTop = 58;
    }
  }

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-right-tab]");
    if (openBtn) {
      const targetTab = openBtn.dataset.openRightTab;
      const alreadyOpenOnTab =
        workbenchWindow.dataset.rightOpen === "true" &&
        rightInspector?.querySelector(`[data-right-tab="${targetTab}"][aria-selected="true"]`);
      if (alreadyOpenOnTab && openBtn.dataset.toggleable === "true") {
        closeRightInspector();
      } else {
        openRightInspector(targetTab);
      }
      return;
    }

    const tabBtn = e.target.closest("[data-right-tab]");
    if (tabBtn) {
      selectRightTab(tabBtn.dataset.rightTab);
      return;
    }

    if (e.target.closest("[data-close-right]")) {
      closeRightInspector();
    }
  });

  // Resizable single-track right rail obeying RIGHTBAR_MIN=300, CENTER_MIN=400, max ratio 0.7
  if (rightResizer && rightInspector) {
    let dragging = false;
    let startX = 0;
    let startWidth = 390;

    rightResizer.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startWidth = rightInspector.getBoundingClientRect().width;
      rightResizer.classList.add("is-dragging");
      rightResizer.setPointerCapture(e.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    rightResizer.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const winRect = workbenchWindow.getBoundingClientRect();
      const sidebarW = currentFrameWidth() < 768 ? 0 : sidebar ? sidebar.getBoundingClientRect().width : 280;
      const maxAllowed = Math.min(winRect.width * 0.7, winRect.width - sidebarW - 430);
      const nextW = Math.max(300, Math.min(maxAllowed, startWidth + (startX - e.clientX)));
      workbenchWindow.style.setProperty("--rightbar-width", `${Math.round(nextW)}px`);
    });

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      rightResizer.classList.remove("is-dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    rightResizer.addEventListener("pointerup", stopDrag);
    rightResizer.addEventListener("pointercancel", stopDrag);
  }

  // Open right rail / activity cleanly via URL param for static review screenshots
  if (urlParams.has("right")) {
    const mode = urlParams.get("right");
    if (["files", "terminal", "inspector"].includes(mode)) {
      openRightInspector(mode);
    }
  }
  if (urlParams.get("activity") === "open") {
    const act = document.getElementById("code-activity-disclosure");
    if (act) act.open = true;
  }

  // -----------------------------------------
  // 6. C2 Layout Preset & Menu Interactions
  // -----------------------------------------
  document.addEventListener("click", (e) => {
    const presetItem = e.target.closest("[data-layout-preset]");
    if (presetItem) {
      const preset = presetItem.dataset.layoutPreset;
      const layoutLabel = document.getElementById("layout-preset-label");
      const menu = presetItem.closest("[popover]");

      if (presetItem.getAttribute("aria-disabled") === "true") {
        showToast("该布局依赖待审计能力，Stage 1 原型不伪装已实现");
        return;
      }

      document.querySelectorAll("[data-layout-preset]").forEach((item) => {
        if (item.getAttribute("role") === "menuitemradio") {
          item.setAttribute("aria-checked", String(item.dataset.layoutPreset === preset));
        }
      });

      if (preset === "focus") {
        closeRightInspector();
        if (layoutLabel) layoutLabel.textContent = "Focus";
      } else if (preset === "build") {
        openRightInspector("terminal");
        if (layoutLabel) layoutLabel.textContent = "Build";
      }

      setTimeout(() => {
        menu?.hidePopover?.();
      }, 120);
    }

    const ctxOpt = e.target.closest("[data-composer-context-option]");
    if (ctxOpt) {
      const targetId = ctxOpt.dataset.targetLabel;
      const out = document.getElementById(targetId);
      if (out) out.textContent = ctxOpt.dataset.composerContextOption;
      const pop = ctxOpt.closest("[popover]");
      pop?.querySelectorAll('[role="menuitemradio"]').forEach((r) => {
        r.setAttribute("aria-checked", String(r === ctxOpt));
      });
      setTimeout(() => pop?.hidePopover?.(), 100);
    }
  });

  // -----------------------------------------
  // 7. Composers (IME-safe Enter + Suggestions + Attachments + Copy)
  // -----------------------------------------
  document.querySelectorAll("[data-suggestion-prompt]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const input = document.getElementById("work-composer-input");
      if (!input) return;
      input.value = chip.dataset.suggestionPrompt;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  document.querySelectorAll(".composer-card").forEach((card) => {
    const form = card.closest("form") || card;
    const textarea = card.querySelector("textarea");
    const attachRow = card.querySelector("[data-attachment-row]");
    const attachTrigger = card.querySelector("[data-demo-attach]");

    const addDemoChip = (fileName) => {
      if (!attachRow) return;
      attachRow.hidden = false;
      const chip = document.createElement("span");
      chip.className = "attachment-chip";
      chip.innerHTML = `<span></span><button type="button" class="attachment-remove" aria-label="移除附件 ${fileName}">×</button>`;
      chip.querySelector("span").textContent = fileName;
      chip.querySelector("button").addEventListener("click", () => {
        chip.remove();
        if (!attachRow.children.length) attachRow.hidden = true;
      });
      attachRow.appendChild(chip);
    };

    attachTrigger?.addEventListener("click", () => {
      addDemoChip("design-audit-notes.md");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("is-drag-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("is-drag-over"));
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("is-drag-over");
      const files = [...(e.dataTransfer?.files || [])];
      if (files.length) {
        files.forEach((f) => addDemoChip(f.name));
      } else {
        addDemoChip("spec-reference.md");
      }
    });

    // IME-safe Enter submit per modern-web-guidance/ime-safe-enter-submit
    textarea?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (event.isComposing || event.keyCode === 229) return;
        form.requestSubmit?.();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!textarea) return;
      const val = textarea.value.trim();
      if (!val) {
        showToast("请输入任务或开发指令");
        textarea.focus();
        return;
      }
      const space = workbenchWindow.dataset.workspace;
      showToast(
        space === "code"
          ? "已模拟提交至当前 Session（Stage 1 静态基准画板）"
          : "已接收任务描述（W2 Running 状态将在下一阶段评审后展开）"
      );
      textarea.value = "";
    });
  });

  // Copy code snippet button with aria live confirmation
  document.querySelectorAll("[data-copy-code]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const target = document.getElementById(btn.dataset.copyCode);
      if (!target) return;
      const label = btn.querySelector("[data-copy-label]");
      try {
        await navigator.clipboard.writeText(target.textContent || "");
        if (label) label.textContent = "已复制";
        announce("代码片段已复制");
      } catch {
        if (label) label.textContent = "复制受限";
        announce("剪贴板访问受限");
      }
      setTimeout(() => {
        if (label) label.textContent = "复制";
      }, 1600);
    });
  });

  // -----------------------------------------
  // 8. External Stage Preset Pill (index.html only)
  // -----------------------------------------
  const stageDock = document.getElementById("stage-dock");
  if (stageDock && desktopFrame) {
    document.getElementById("stage-dock-toggle")?.addEventListener("click", (e) => {
      const collapsed = stageDock.getAttribute("data-collapsed") === "true";
      stageDock.setAttribute("data-collapsed", String(!collapsed));
      e.currentTarget.setAttribute("aria-expanded", String(collapsed));
    });

    document.querySelectorAll("[data-stage-viewport]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.dataset.stageViewport;
        desktopFrame.dataset.viewportPreset = preset;
        document.querySelectorAll("[data-stage-viewport]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b === btn));
        });
      });
    });
  }
})();
