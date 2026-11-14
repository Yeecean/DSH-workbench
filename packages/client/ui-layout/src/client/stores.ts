/**
 * Root-owned frame measurement, panel preferences, and presentation reports.
 * The registration supplies a fresh store and binds its actions to ctx.layout.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { MainPanelId, RightbarInfo, RightbarSurface } from './service.ts'
import {
  clampWidth, RIGHTBAR_DEFAULT_RATIO, RIGHTBAR_MAX_RATIO, RIGHTBAR_MIN,
  SIDEBAR_AUTO_COLLAPSE, SIDEBAR_DEFAULT, SIDEBAR_DRAWER_BREAKPOINT, SIDEBAR_MAX, SIDEBAR_MIN,
} from './columns.ts'

type SurfaceReport = {
  shown: boolean
  track: boolean
  fullscreen: boolean
}

type SurfaceArbitration = {
  hasGlobalSlot: boolean
  reports: {
    session: SurfaceReport
    global: SurfaceReport
  }
  widths: {
    session: number | null
    global: number | null
  }
}

/**
 * Transient layout preferences. Responsive concessions never rewrite widths;
 * each right-column occupant owns its own expanded state while arbitration
 * selects the active presentation.
 */
type LayoutState = {
  panelInfo: {
    /** Null selects the Conversation; global panels keep the current Session intact. */
    activePanelId: MainPanelId | null
  }
  rightbarInfo: RightbarInfo
  layoutInfo: LayoutInfo
  /** Per-surface reports and width memories backing right-column arbitration. */
  rightbarSurfaces: SurfaceArbitration
}

type LayoutInfo = {
  sidebar: number
  /** Last positive frame measurement; window width bootstraps the first render. */
  viewportWidth: number
  narrowExpanded: boolean
  /**
   * Active surface's saved right panel width in px, or null before its first
   * opening. Resizing the frame and closing the panel preserve this preference.
   */
  rightbar: number | null
  /**
   * Whether the active right panel is drawn at all, in either presentation.
   *
   * Derived chrome, not a source of truth: whether the right surface is
   * expanded is a recorded fact owned by that surface, reported here so the
   * frame can place the panel's resize handle. The occupant reports it; nothing
   * else writes it.
   */
  rightbarShown: boolean
  /**
   * Whether the active normal panel width reserves a grid track, including
   * beneath fullscreen. Reported by the active occupant; always false while hidden.
   */
  rightbarTrack: boolean
  /** Active surface fullscreen presentation; hides the outer resize handle. */
  rightbarFullscreen: boolean
  /** Suppress transitions for a fullscreen exit until another geometry action. */
  rightbarInstant: boolean
}

/**
 * Annotation twin of the actions literal below (the export needs a declared
 * return type); drift fails assignability at the defineStore call.
 */
type LayoutActions = {
  selectPanel: (draft: LayoutState, panelId: MainPanelId | null) => void
  retainMainPanels: (draft: LayoutState, panelIds: readonly string[]) => void
  retainGlobalRightbar: (draft: LayoutState, mounted: boolean) => void
  setSidebar: (draft: LayoutState, px: number) => void
  toggleSidebar: (draft: LayoutState) => void
  setViewportWidth: (draft: LayoutState, width: number) => void
  setRightbar: (draft: LayoutState, px: number) => void
  openRightbar: (draft: LayoutState, track: boolean, fullscreen: boolean) => void
  closeRightbar: (draft: LayoutState) => void
  openGlobalRightbar: (draft: LayoutState, track: boolean, fullscreen: boolean) => void
  closeGlobalRightbar: (draft: LayoutState) => void
  selectRightbarSurface: (draft: LayoutState, surface: RightbarSurface | 'auto') => void
}

function defaultRightbarWidth(viewportWidth: number): number {
  return Math.max(RIGHTBAR_MIN, Math.round(viewportWidth * RIGHTBAR_DEFAULT_RATIO))
}

function sameReport(a: SurfaceReport, b: SurfaceReport): boolean {
  return a.shown === b.shown && a.track === b.track && a.fullscreen === b.fullscreen
}

function syncActiveRightbar(d: LayoutState, prevShown: boolean, prevFullscreen: boolean): void {
  const owner = d.rightbarInfo.owner
  const report = d.rightbarSurfaces.reports[owner]
  const width = d.rightbarSurfaces.widths[owner]
  if (prevShown !== report.shown || d.layoutInfo.rightbarTrack !== report.track || prevFullscreen !== report.fullscreen) {
    d.layoutInfo.rightbarInstant = report.shown
      ? prevFullscreen && !report.fullscreen
      : prevShown && prevFullscreen
  }
  if (report.shown && !prevShown && d.layoutInfo.viewportWidth < SIDEBAR_AUTO_COLLAPSE) {
    d.layoutInfo.narrowExpanded = false
  }
  d.layoutInfo.rightbar = width
  d.layoutInfo.rightbarShown = report.shown
  d.layoutInfo.rightbarTrack = report.track
  d.layoutInfo.rightbarFullscreen = report.fullscreen
}

function bumpRightbarOwner(
  d: LayoutState,
  owner: RightbarSurface,
  sessionPausedFullscreen: boolean,
): void {
  d.rightbarInfo = {
    owner,
    sessionPausedFullscreen,
    generation: d.rightbarInfo.generation + 1,
  }
}

/**
 * Create the layout panel store handle. For the sidebar the preference IS the
 * width, so closing it forgets its drag width — reopening restores the contract
 * default. Each right-column surface ('session' and 'global') initializes at 45%
 * of the frame on its first opening and keeps its own px preference across
 * resizes, close, and surface switches. Drag writes clamp to the current frame's
 * range. Narrow sidebar toggles change only the expansion override; opening a
 * right panel clears that override.
 * @returns the store handle (spec + type + identity + factory in one).
 */
export function createLayoutStore(): EngineStoreHandle<LayoutState, LayoutActions> {
  const handle = defineStore({
    init: (): LayoutState => ({
      panelInfo: { activePanelId: null },
      rightbarInfo: {
        owner: 'session',
        sessionPausedFullscreen: false,
        generation: 0,
      },
      layoutInfo: {
        sidebar: SIDEBAR_DEFAULT,
        viewportWidth: window.innerWidth,
        narrowExpanded: false,
        rightbar: null,
        rightbarShown: false,
        rightbarTrack: false,
        rightbarFullscreen: false,
        rightbarInstant: false,
      },
      rightbarSurfaces: {
        hasGlobalSlot: false,
        reports: {
          session: { shown: false, track: false, fullscreen: false },
          global: { shown: false, track: false, fullscreen: false },
        },
        widths: {
          session: null,
          global: null,
        },
      },
    }),
    actions: {
      selectPanel: (d, panelId: MainPanelId | null) => {
        if (d.panelInfo.activePanelId !== panelId) {
          d.panelInfo.activePanelId = panelId
        }
        if (d.layoutInfo.viewportWidth < SIDEBAR_DRAWER_BREAKPOINT && d.layoutInfo.narrowExpanded) {
          d.layoutInfo.narrowExpanded = false
        }
        if (panelId !== null) {
          if (d.rightbarInfo.owner === 'session'
            && d.rightbarSurfaces.reports.session.fullscreen
            && !d.rightbarInfo.sessionPausedFullscreen) {
            d.rightbarInfo = { ...d.rightbarInfo, sessionPausedFullscreen: true }
          }
          return
        }
        // Returning to Conversation yields back to Session if global isn't actively shown.
        if (d.rightbarInfo.owner === 'global' && !d.rightbarSurfaces.reports.global.shown) {
          const prevShown = d.layoutInfo.rightbarShown
          const prevFullscreen = d.layoutInfo.rightbarFullscreen
          bumpRightbarOwner(d, 'session', d.rightbarInfo.sessionPausedFullscreen)
          syncActiveRightbar(d, prevShown, prevFullscreen)
        }
      },
      retainMainPanels: (d, panelIds: readonly string[]) => {
        if (d.panelInfo.activePanelId !== null && !panelIds.includes(d.panelInfo.activePanelId)) {
          d.panelInfo.activePanelId = null
          if (d.rightbarInfo.owner === 'global' && !d.rightbarSurfaces.reports.global.shown) {
            const prevShown = d.layoutInfo.rightbarShown
            const prevFullscreen = d.layoutInfo.rightbarFullscreen
            bumpRightbarOwner(d, 'session', d.rightbarInfo.sessionPausedFullscreen)
            syncActiveRightbar(d, prevShown, prevFullscreen)
          }
        }
      },
      retainGlobalRightbar: (d, mounted: boolean) => {
        if (d.rightbarSurfaces.hasGlobalSlot === mounted) return
        d.rightbarSurfaces.hasGlobalSlot = mounted
        if (mounted) return
        const hadGlobal = d.rightbarSurfaces.reports.global.shown || d.rightbarInfo.owner === 'global'
        d.rightbarSurfaces.reports.global = { shown: false, track: false, fullscreen: false }
        if (d.rightbarInfo.owner === 'global') {
          const prevShown = d.layoutInfo.rightbarShown
          const prevFullscreen = d.layoutInfo.rightbarFullscreen
          bumpRightbarOwner(d, 'session', d.rightbarInfo.sessionPausedFullscreen)
          syncActiveRightbar(d, prevShown, prevFullscreen)
        } else if (hadGlobal) {
          d.rightbarInfo = { ...d.rightbarInfo, generation: d.rightbarInfo.generation + 1 }
        }
      },
      setSidebar: (d, px: number) => {
        d.layoutInfo.rightbarInstant = false
        d.layoutInfo.sidebar = clampWidth(px, SIDEBAR_MIN, SIDEBAR_MAX)
      },
      // Narrow toggles flip only the override: the width preference survives
      // untouched, so re-widening restores the pre-squeeze layout.
      toggleSidebar: (d) => {
        d.layoutInfo.rightbarInstant = false
        if (d.layoutInfo.viewportWidth < SIDEBAR_AUTO_COLLAPSE) d.layoutInfo.narrowExpanded = !d.layoutInfo.narrowExpanded
        else d.layoutInfo.sidebar = d.layoutInfo.sidebar === 0 ? SIDEBAR_DEFAULT : 0
      },
      // Crossing the breakpoint in either direction drops the override: the
      // narrow default is auto-collapsed, the wide state is the preference.
      setViewportWidth: (d, width: number) => {
        if (d.layoutInfo.viewportWidth === width) return
        d.layoutInfo.rightbarInstant = false
        if ((d.layoutInfo.viewportWidth < SIDEBAR_AUTO_COLLAPSE) !== (width < SIDEBAR_AUTO_COLLAPSE)
          || (d.layoutInfo.viewportWidth < SIDEBAR_DRAWER_BREAKPOINT) !== (width < SIDEBAR_DRAWER_BREAKPOINT)) {
          d.layoutInfo.narrowExpanded = false
        }
        d.layoutInfo.viewportWidth = width
      },
      setRightbar: (d, px: number) => {
        d.layoutInfo.rightbarInstant = false
        const clamped = clampWidth(px, RIGHTBAR_MIN, Math.max(RIGHTBAR_MIN, d.layoutInfo.viewportWidth * RIGHTBAR_MAX_RATIO))
        d.rightbarSurfaces.widths[d.rightbarInfo.owner] = clamped
        d.layoutInfo.rightbar = clamped
      },
      openRightbar: (d, track: boolean, fullscreen: boolean) => {
        const next: SurfaceReport = { shown: true, track, fullscreen }
        if (d.rightbarInfo.owner === 'session'
          && sameReport(d.rightbarSurfaces.reports.session, next)
          && d.layoutInfo.rightbarShown
          && d.layoutInfo.rightbarTrack === track
          && d.layoutInfo.rightbarFullscreen === fullscreen
          && d.rightbarSurfaces.widths.session !== null
          && !d.rightbarInfo.sessionPausedFullscreen) {
          return
        }
        const prevShown = d.layoutInfo.rightbarShown
        const prevFullscreen = d.layoutInfo.rightbarFullscreen
        d.rightbarSurfaces.reports.session = next
        d.rightbarSurfaces.widths.session ??= defaultRightbarWidth(d.layoutInfo.viewportWidth)
        if (d.rightbarInfo.owner === 'session') {
          if (d.rightbarInfo.sessionPausedFullscreen) {
            d.rightbarInfo = { ...d.rightbarInfo, sessionPausedFullscreen: false }
          }
          syncActiveRightbar(d, prevShown, prevFullscreen)
        }
      },
      closeRightbar: (d) => {
        const closed: SurfaceReport = { shown: false, track: false, fullscreen: false }
        if (d.rightbarInfo.owner === 'session') {
          if (!d.layoutInfo.rightbarShown && sameReport(d.rightbarSurfaces.reports.session, closed)) return
          const prevShown = d.layoutInfo.rightbarShown
          const prevFullscreen = d.layoutInfo.rightbarFullscreen
          d.rightbarSurfaces.reports.session = closed
          syncActiveRightbar(d, prevShown, prevFullscreen)
          return
        }
        if (!sameReport(d.rightbarSurfaces.reports.session, closed)) {
          d.rightbarSurfaces.reports.session = closed
        }
      },
      openGlobalRightbar: (d, track: boolean, fullscreen: boolean) => {
        const next: SurfaceReport = { shown: true, track, fullscreen }
        if (d.rightbarInfo.owner === 'global'
          && sameReport(d.rightbarSurfaces.reports.global, next)
          && d.layoutInfo.rightbarShown
          && d.layoutInfo.rightbarTrack === track
          && d.layoutInfo.rightbarFullscreen === fullscreen
          && d.rightbarSurfaces.widths.global !== null) {
          return
        }
        const prevShown = d.layoutInfo.rightbarShown
        const prevFullscreen = d.layoutInfo.rightbarFullscreen
        d.rightbarSurfaces.reports.global = next
        d.rightbarSurfaces.widths.global ??= defaultRightbarWidth(d.layoutInfo.viewportWidth)
        if (d.rightbarInfo.owner !== 'global') {
          const paused = d.rightbarSurfaces.reports.session.fullscreen || d.rightbarInfo.sessionPausedFullscreen
          bumpRightbarOwner(d, 'global', paused)
        }
        syncActiveRightbar(d, prevShown, prevFullscreen)
      },
      closeGlobalRightbar: (d) => {
        const closed: SurfaceReport = { shown: false, track: false, fullscreen: false }
        if (d.rightbarInfo.owner !== 'global') {
          if (!sameReport(d.rightbarSurfaces.reports.global, closed)) {
            d.rightbarSurfaces.reports.global = closed
          }
          return
        }
        const prevShown = d.layoutInfo.rightbarShown
        const prevFullscreen = d.layoutInfo.rightbarFullscreen
        d.rightbarSurfaces.reports.global = closed
        bumpRightbarOwner(d, 'session', d.rightbarInfo.sessionPausedFullscreen)
        syncActiveRightbar(d, prevShown, prevFullscreen)
      },
      selectRightbarSurface: (d, surface: RightbarSurface | 'auto') => {
        const next: RightbarSurface = surface === 'auto'
          ? (d.rightbarSurfaces.reports.global.shown && (d.panelInfo.activePanelId !== null || d.rightbarInfo.owner === 'global')
            ? 'global' : 'session')
          : surface
        if (d.rightbarInfo.owner === next) return
        const prevShown = d.layoutInfo.rightbarShown
        const prevFullscreen = d.layoutInfo.rightbarFullscreen
        const paused = next === 'global'
          ? d.rightbarSurfaces.reports.session.fullscreen || d.rightbarInfo.sessionPausedFullscreen
          : d.rightbarInfo.sessionPausedFullscreen
        bumpRightbarOwner(d, next, paused)
        syncActiveRightbar(d, prevShown, prevFullscreen)
      },
    },
  })
  return handle
}
