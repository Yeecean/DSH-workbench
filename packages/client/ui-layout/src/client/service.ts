/**
 * LayoutController: the cross-plugin panel-action face behind ctx.layout.
 * Panel geometry and main-panel selection live in the root layout store;
 * the current-session selection lives with the runtime sessions service, and
 * the per-session active view dissolved into ui-conversation's session store
 * (its only consumer). What remains here is the contract other plugins'
 * apply worlds reach for panel transitions (main-panel selection and sidebar toggle,
 * right-panel show/hide from ui-sidebar-right) — writes stay inside the
 * store's declared action set, shared with the root registration.
 */
import type { BoundActions, HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { Branded } from '@deepseek-ai/dsh-brand'
import type { createLayoutStore } from './stores.ts'

/** Identity shared by a sidebar panel entry and its main-slot occupant. */
export type MainPanelId = Branded<'MainPanelId'>

/** Right-column occupant surface identifier. */
export type RightbarSurface = 'session' | 'global'

/** Root-scoped navigation state exposed to panel-aware components. */
export interface PanelInfo {
  /** Selected global panel; null displays the current Conversation. */
  readonly activePanelId: MainPanelId | null
}

/** Root-scoped right-column arbitration state exposed through `ctx.layout.rightbarInfo`. */
export interface RightbarInfo {
  /** Surface currently owning the single right column track and handle. */
  readonly owner: RightbarSurface
  /** Whether the Session surface's fullscreen mode was paused by switching away. */
  readonly sessionPausedFullscreen: boolean
  /** Monotonic arbitration epoch incremented when surface ownership changes. */
  readonly generation: number
}

/** The layout store's bound action set (framework-baked, draft params peeled). */
export type PanelActions = BoundActions<ReturnType<typeof createLayoutStore>>

/** Panel navigation and geometry actions exposed through ctx.layout. */
export interface ILayout {
  /** Selected central panel from the same root store used by `usePanelInfo`. */
  readonly panelInfo: HostObservable<PanelInfo>
  /** Active right-column surface arbitration state from the root layout store. */
  readonly rightbarInfo: HostObservable<RightbarInfo>
  /**
   * Select a global central panel without changing the current Session.
   * @param panelId - registered main key, or null to show the Conversation.
   * @throws if the selected main key is not registered; preserves the current selection.
   */
  selectPanel(panelId: MainPanelId | null): void
  /**
   * Start an asynchronous navigation, superseding any earlier pending navigation.
   * @returns a signal aborted by the next navigation or layout disposal; check it before committing UI state.
   */
  beginNavigation(): AbortSignal
  /** Toggle the sidebar panel (closed ⟷ contract default width). */
  toggleSidebar(): void
  /**
   * Report the Session right panel's presentation without changing its expanded state.
   * @param track - whether the normal panel width reserves a grid track,
   *   including beneath a fullscreen overlay.
   * @param fullscreen - whether the panel covers the frame and hides its outer
   *   resize handle; independent of the underlying grid track.
   */
  openRightbar(track: boolean, fullscreen: boolean): void
  /** Report the Session right panel as hidden: no track, no handle. */
  closeRightbar(): void
  /**
   * Report the global right panel's presentation and claim single-rail ownership.
   * @param track - whether the normal panel width reserves a grid track.
   * @param fullscreen - whether the global panel covers the frame.
   */
  openGlobalRightbar(track: boolean, fullscreen: boolean): void
  /** Report the global right panel as hidden and return ownership to Session. */
  closeGlobalRightbar(): void
  /**
   * Switch right-column arbitration ownership explicitly or automatically.
   * @param surface - target occupant surface (`'session'`, `'global'`, or `'auto'`).
   */
  selectRightbarSurface(surface: RightbarSurface | 'auto'): void
}

/** Cross-plugin panel-action face (ctx.layout). */
export class LayoutController implements ILayout {
  private navigation = new AbortController()

  /**
   * @param panels - actions of the instance shared with the root entry.
   * @param hasMainPanel - checks the live main-slot registry for a panel id.
   * @param panelInfo - root store's shared central-panel selection source.
   * @param rightbarInfo - root store's shared right-column arbitration source.
   */
  constructor(
    private readonly panels: PanelActions,
    private readonly hasMainPanel: (id: MainPanelId) => boolean,
    readonly panelInfo: HostObservable<PanelInfo>,
    readonly rightbarInfo: HostObservable<RightbarInfo> = {
      getSnapshot: () => ({ owner: 'session', sessionPausedFullscreen: false, generation: 0 }),
      subscribe: () => () => {},
    },
  ) {}

  /** Select a global panel or return to the Conversation. */
  selectPanel(panelId: MainPanelId | null): void {
    if (panelId !== null && !this.hasMainPanel(panelId)) {
      throw new Error(`layout.selectPanel: main panel "${panelId}" is not registered`)
    }
    this.navigation.abort()
    this.panels.selectPanel(panelId)
  }

  /** @returns the new pending navigation's cancellation signal. */
  beginNavigation(): AbortSignal {
    this.navigation.abort()
    this.navigation = new AbortController()
    return this.navigation.signal
  }

  /** Invalidate pending navigations when the layout owner is unloaded. */
  dispose(): void {
    this.navigation.abort()
  }

  /** Toggle the sidebar panel (closed ⟷ contract default width). */
  toggleSidebar(): void {
    this.panels.toggleSidebar()
  }

  /** Report the right panel's track and fullscreen presentation. */
  openRightbar(track: boolean, fullscreen: boolean): void {
    this.panels.openRightbar(track, fullscreen)
  }

  /** Report the right panel as hidden: no track, no handle. */
  closeRightbar(): void {
    this.panels.closeRightbar()
  }

  /** Report the global right panel's presentation and claim right-column ownership. */
  openGlobalRightbar(track: boolean, fullscreen: boolean): void {
    this.panels.openGlobalRightbar(track, fullscreen)
  }

  /** Report the global right panel as hidden and return right-column ownership. */
  closeGlobalRightbar(): void {
    this.panels.closeGlobalRightbar()
  }

  /** Switch right-column ownership explicitly or settle automatically. */
  selectRightbarSurface(surface: RightbarSurface | 'auto'): void {
    this.panels.selectRightbarSurface(surface)
  }
}
