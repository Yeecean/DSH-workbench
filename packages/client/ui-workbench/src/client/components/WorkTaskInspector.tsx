/** Global right-column Work Task Inspector occupant for `'shell.rightbar.global'`. */

import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { CodePresetId, WorkbenchMode } from '../../workbench-settings.ts'
import type { createModeSwitcherStore } from '../stores.ts'
import css from './WorkTaskInspector.module.css'

export interface WorkTaskInspectorInjected {
  switchMode: (mode: WorkbenchMode) => void
  openRightbarTab: (kind: 'files' | 'terminal' | 'browser') => void
  openSettings: () => void
  closeInspector: () => void
}

export type WorkTaskInspectorProps =
  PropsRuntime<'shell.rightbar.global'>
  & PropsStore<ReturnType<typeof createModeSwitcherStore>>
  & PropsLocale<'workbench'>
  & WorkTaskInspectorInjected

const PRESET_LOCALE_KEYS: Readonly<Record<CodePresetId, 'preset.focus' | 'preset.build' | 'preset.review' | 'preset.debug'>> = {
  focus: 'preset.focus',
  build: 'preset.build',
  review: 'preset.review',
  debug: 'preset.debug',
}

/**
 * Renders live Session, Workspace, and native rightbar launcher cards inside the
 * single global right rail (`'shell.rightbar.global'`).
 */
export function WorkTaskInspector({
  active,
  useSessions,
  useSessionStatus,
  useWorkspaces,
  useStore,
  switchMode,
  openRightbarTab,
  openSettings,
  closeInspector,
  t,
}: WorkTaskInspectorProps) {
  const { mode, preset } = useStore(state => state)
  const activeSession = useSessions(state => (
    Object.values(state.byId).find(item => (item.retainedBy.mainView ?? 0) > 0)
  ))
  const sessionStatus = useSessionStatus(map => (
    activeSession === undefined ? undefined : map.get(activeSession.id)
  ))
  const workspace = useWorkspaces((state) => {
    if (activeSession?.cwd !== undefined) {
      const matched = state.items.find(item => item.path === activeSession.cwd)
      if (matched !== undefined) return matched
    }
    return state.items[0]
  })

  const statusKey = sessionStatus?.pendingInteraction !== undefined
    ? 'waiting'
    : (sessionStatus?.running === true || activeSession?.running === true)
      ? 'running'
      : 'idle'

  const statusLabel = statusKey === 'waiting'
    ? t('inspector.session.status.waiting')
    : statusKey === 'running'
      ? t('inspector.session.status.running')
      : t('inspector.session.status.idle')

  return (
    <aside
      className={css.root}
      aria-label={mode === 'work' ? t('inspector.title.work') : t('inspector.title.code')}
      data-workbench-inspector=""
      data-workbench-inspector-active={active ? 'true' : 'false'}
    >
      <header className={css.header}>
        <h2 className={css.title}>
          {mode === 'work' ? t('inspector.title.work') : t('inspector.title.code')}
        </h2>
        <button
          type="button"
          className={css.closeButton}
          aria-label={t('inspector.close')}
          data-workbench-inspector-close=""
          onClick={closeInspector}
        >
          <IconCloseOutlineRegular size={14} />
        </button>
      </header>

      <div className={css.body}>
        <section className={css.card}>
          <div className={css.sectionLabel}>{t('inspector.section.mode')}</div>
          <div className={css.rowBetween}>
            <span className={css.modeBadge}>
              {mode === 'work' ? t('mode.work') : `${t('mode.code')} · ${t(PRESET_LOCALE_KEYS[preset])}`}
            </span>
            <button
              type="button"
              className={css.actionButton}
              style={{ width: 'auto', padding: '5px 10px' }}
              onClick={() => { switchMode(mode === 'work' ? 'code' : 'work') }}
            >
              {mode === 'work' ? t('inspector.switchToCode') : t('inspector.switchToWork')}
            </button>
          </div>
        </section>

        <section className={css.card} data-workbench-inspector-session="">
          <div className={css.rowBetween}>
            <span className={css.sectionLabel}>{t('inspector.section.session')}</span>
            {activeSession !== undefined && (
              <span className={css.statusBadge} data-status={statusKey}>
                {statusLabel}
              </span>
            )}
          </div>
          {activeSession === undefined ? (
            <>
              <div className={css.primaryText}>{t('inspector.session.emptyTitle')}</div>
              <div className={css.mutedText}>{t('inspector.session.emptyBody')}</div>
            </>
          ) : (
            <>
              <div className={css.primaryText}>{activeSession.displayTitle}</div>
              <div className={css.monoMeta}>
                {t('inspector.session.idLabel')}: {activeSession.id}
              </div>
              {activeSession.cwd !== undefined && (
                <div className={css.monoMeta}>{activeSession.cwd}</div>
              )}
            </>
          )}
        </section>

        <section className={css.card}>
          <div className={css.sectionLabel}>{t('inspector.section.workspace')}</div>
          <div className={css.mutedText}>
            {workspace === undefined ? t('inspector.workspace.none') : `${workspace.title} — ${workspace.path}`}
          </div>
          <div className={css.actionList}>
            <button
              type="button"
              className={css.actionButton}
              data-workbench-open-tab="files"
              onClick={() => { openRightbarTab('files') }}
            >
              <span>{t('inspector.action.openFiles')}</span>
              <span className={css.actionHint}>{t('inspector.hint.files')}</span>
            </button>
            <button
              type="button"
              className={css.actionButton}
              data-workbench-open-tab="terminal"
              onClick={() => { openRightbarTab('terminal') }}
            >
              <span>{t('inspector.action.openTerminal')}</span>
              <span className={css.actionHint}>{t('inspector.hint.terminal')}</span>
            </button>
            <button
              type="button"
              className={css.actionButton}
              data-workbench-open-tab="browser"
              onClick={() => { openRightbarTab('browser') }}
            >
              <span>{t('inspector.action.openBrowser')}</span>
              <span className={css.actionHint}>{t('inspector.hint.browser')}</span>
            </button>
            <button
              type="button"
              className={css.actionButton}
              data-workbench-open-settings=""
              onClick={openSettings}
            >
              <span>{t('inspector.action.openSettings')}</span>
              <span className={css.actionHint}>{t('inspector.hint.theme')}</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  )
}
