/** Global right-column Work Task Inspector occupant for `'shell.rightbar.global'`. */

import { useState } from 'react'
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { CodePresetId, WorkbenchMode } from '../../workbench-settings.ts'
import {
  workbenchChangesReviewAddress,
  workbenchPlanAddress,
  workbenchSubagentAddress,
  type ActivityCategory,
  type WorkbenchActivitySnapshot,
  type WorkbenchJobItem,
} from '../session-activity.ts'
import type { createModeSwitcherStore } from '../stores.ts'
import css from './WorkTaskInspector.module.css'

/** Native callbacks and activity observable injected into `'shell.rightbar.global'`. */
export interface WorkTaskInspectorInjected {
  /** Reactive read-only session activity & jobs projection compiled from native DSH services. */
  hooks: {
    activity: ObservableSnapshot<WorkbenchActivitySnapshot>
  }
  /** Switch top Workbench presentation mode (`work` | `code`). */
  switchMode: (mode: WorkbenchMode) => void
  /** Open one standard native right-sidebar tab (`files` | `terminal` | `browser`). */
  openRightbarTab: (kind: 'files' | 'terminal' | 'browser') => void
  /** Open a native sidebar resource (plan preview, changes review, or subagent chat). */
  openResource?: (address: string) => void
  /** Navigate to Settings -> General. */
  openSettings: () => void
  /** Collapse/release the global right rail occupant. */
  closeInspector: () => void
}

/** Composed props for {@link WorkTaskInspector}. */
export type WorkTaskInspectorProps =
  PropsRuntime<'shell.rightbar.global'>
  & PropsStore<ReturnType<typeof createModeSwitcherStore>>
  & PropsLocale<'workbench'>
  & InjectFace<WorkTaskInspectorInjected>

const PRESET_LOCALE_KEYS: Readonly<Record<CodePresetId, 'preset.focus' | 'preset.build' | 'preset.review' | 'preset.debug'>> = {
  focus: 'preset.focus',
  build: 'preset.build',
  review: 'preset.review',
  debug: 'preset.debug',
}

const FILTER_OPTIONS: readonly {
  readonly id: ActivityCategory
  readonly labelKey: 'inspector.filter.all' | 'inspector.filter.tool' | 'inspector.filter.subagent' | 'inspector.filter.job'
}[] = [
  { id: 'all', labelKey: 'inspector.filter.all' },
  { id: 'tool', labelKey: 'inspector.filter.tool' },
  { id: 'subagent', labelKey: 'inspector.filter.subagent' },
  { id: 'job', labelKey: 'inspector.filter.job' },
]

function jobStatusKey(
  status: WorkbenchJobItem['status'],
):
  | 'inspector.activity.status.running'
  | 'inspector.activity.status.stopping'
  | 'inspector.activity.status.completed'
  | 'inspector.activity.status.killed'
  | 'inspector.activity.status.failed' {
  switch (status) {
    case 'running': return 'inspector.activity.status.running'
    case 'stopping': return 'inspector.activity.status.stopping'
    case 'completed': return 'inspector.activity.status.completed'
    case 'killed': return 'inspector.activity.status.killed'
    case 'failed': return 'inspector.activity.status.failed'
  }
}

function pendingInteractionNoticeKey(
  kind: string,
): 'inspector.session.pendingPlanReview' | 'inspector.session.pendingQuestion' | 'inspector.session.pendingApproval' {
  if (kind === 'plan-review') return 'inspector.session.pendingPlanReview'
  if (kind === 'question') return 'inspector.session.pendingQuestion'
  return 'inspector.session.pendingApproval'
}

/**
 * Renders live Session status, Plan/Todos/Deliverables summary, filterable
 * collapsible Activity timeline, Subagents/Background Jobs, native tool
 * launchers, and collapsed technical details inside `'shell.rightbar.global'`.
 */
export function WorkTaskInspector({
  active,
  useSessions,
  useSessionStatus,
  useWorkspaces,
  useStore,
  useActivity,
  switchMode,
  openRightbarTab,
  openResource,
  openSettings,
  closeInspector,
  t,
}: WorkTaskInspectorProps) {
  const { mode, preset } = useStore(state => state)
  const activity = useActivity(state => state)
  const [filter, setFilter] = useState<ActivityCategory>('all')
  const [timelineExpanded, setTimelineExpanded] = useState(false)

  const activeSession = useSessions(state => (
    Object.values(state.byId).find(item => (item.retainedBy.mainView ?? 0) > 0)
  ))
  const sessionStatus = useSessionStatus(map => (
    activeSession === undefined ? undefined : map.get(activeSession.id)
  ))
  const workspace = useWorkspaces((state) => {
    if (activeSession !== undefined) {
      const bySession = state.items.find(item => item.sessionIds.includes(activeSession.id))
      if (bySession !== undefined) return bySession
    }
    if (activeSession?.cwd !== undefined) {
      const matched = state.items.find(item => item.path === activeSession.cwd)
      if (matched !== undefined) return matched
    }
    return state.items[0]
  })

  const statusKey = sessionStatus?.pendingInteraction !== undefined || activity.pendingInteractionKind !== undefined
    ? 'waiting'
    : sessionStatus?.running === true || activeSession?.running === true
      ? 'running'
      : sessionStatus?.completionUnread === true || activity.completionUnread
        ? 'done'
        : 'idle'

  const statusLabel = statusKey === 'waiting'
    ? t('inspector.session.status.waiting')
    : statusKey === 'running'
      ? t('inspector.session.status.running')
      : statusKey === 'done'
        ? t('inspector.session.status.done')
        : t('inspector.session.status.idle')

  const pendingKind = sessionStatus?.pendingInteraction?.kind ?? activity.pendingInteractionKind
  const filteredTimeline = activity.activities.filter(item => (
    filter === 'all' || (filter === 'tool' && item.category === 'tool') || (filter === 'subagent' && item.category === 'subagent')
  ))
  const showSubagents = filter === 'all' || filter === 'subagent'
  const showJobs = filter === 'all' || filter === 'job'
  const liveCount = activity.activities.filter(item => item.status === 'running').length
    + activity.jobs.filter(item => item.status === 'running' || item.status === 'stopping').length
    + activity.subagents.filter(item => item.status === 'running').length
  const completedTodos = activity.todos.filter(item => item.status === 'completed').length

  const hasPlanOrDeliverables = activity.plan !== undefined
    || activity.todos.length > 0
    || activity.deliverables !== undefined

  const hasFilteredActivity = (showSubagents && activity.subagents.length > 0)
    || (showJobs && activity.jobs.length > 0)
    || filteredTimeline.length > 0

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
        <section className={css.card} data-workbench-inspector-session="">
          <div className={css.rowBetween}>
            <span className={css.sectionLabel}>{t('inspector.section.mode')}</span>
            <button
              type="button"
              className={css.compactButton}
              onClick={() => { switchMode(mode === 'work' ? 'code' : 'work') }}
            >
              {mode === 'work' ? t('inspector.switchToCode') : t('inspector.switchToWork')}
            </button>
          </div>
          <div className={css.rowBetween}>
            <span className={css.modeBadge}>
              {mode === 'work' ? t('mode.work') : `${t('mode.code')} · ${t(PRESET_LOCALE_KEYS[preset])}`}
            </span>
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
              <div className={css.workspaceTag}>
                <span>{t('inspector.workspace.label')}:</span>
                <span className={css.workspaceName}>
                  {workspace === undefined ? t('inspector.workspace.none') : workspace.title}
                </span>
              </div>
              {pendingKind !== undefined && (
                <div className={css.noticeBanner} data-tone="warning">
                  {t(pendingInteractionNoticeKey(pendingKind))}
                </div>
              )}
              {pendingKind === undefined && statusKey === 'done' && (
                <div className={css.noticeBanner} data-tone="info">
                  {t('inspector.session.completionUnread')}
                </div>
              )}
            </>
          )}
        </section>

        <section className={css.card} data-workbench-inspector-deliverables="">
          <div className={css.sectionLabel}>{t('inspector.section.planAndFiles')}</div>
          {!hasPlanOrDeliverables ? (
            <div className={css.mutedText}>{t('inspector.deliverables.empty')}</div>
          ) : (
            <>
              {activity.plan !== undefined && (
                <div className={css.rowBetween}>
                  <span className={css.mutedText}>
                    {activity.plan.latestTitle
                      ?? (activity.plan.pending
                        ? t('inspector.plan.pending')
                        : activity.plan.active
                          ? t('inspector.plan.active')
                          : t('inspector.plan.open'))}
                  </span>
                  {activity.sessionId !== undefined && activity.plan.latestCallId !== undefined && openResource !== undefined && (
                    <button
                      type="button"
                      className={css.compactButton}
                      data-workbench-open-plan=""
                      onClick={() => {
                        if (activity.sessionId !== undefined && activity.plan?.latestCallId !== undefined) {
                          openResource(workbenchPlanAddress(activity.sessionId, activity.plan.latestCallId))
                        }
                      }}
                    >
                      {t('inspector.plan.open')}
                    </button>
                  )}
                </div>
              )}

              {activity.todos.length > 0 && (
                <>
                  <div className={css.rowBetween}>
                    <span className={css.mutedText}>
                      {t('inspector.todos.progress', { done: completedTodos, total: activity.todos.length })}
                    </span>
                  </div>
                  <ul className={css.todoList}>
                    {activity.todos.slice(0, 5).map(todo => (
                      <li key={todo.content} className={css.todoRow}>
                        <div className={css.itemTitleRow}>
                          <span className={css.statusDot} data-tone={todo.status} aria-hidden="true" />
                          <span className={css.itemTitle}>{todo.content}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {activity.deliverables !== undefined && (
                <>
                  <div className={css.rowBetween}>
                    <span className={css.mutedText}>
                      {t('inspector.deliverables.changed', { count: activity.deliverables.producedCount })}
                    </span>
                    {activity.sessionId !== undefined
                      && activity.deliverables.changesSeq !== undefined
                      && activity.deliverables.changesTurn !== undefined
                      && openResource !== undefined && (
                      <button
                        type="button"
                        className={css.compactButton}
                        data-workbench-open-changes=""
                        onClick={() => {
                          const sid = activity.sessionId
                          const deliv = activity.deliverables
                          if (
                            sid !== undefined
                            && deliv !== undefined
                            && deliv.changesSeq !== undefined
                            && deliv.changesTurn !== undefined
                          ) {
                            openResource(
                              workbenchChangesReviewAddress(
                                sid,
                                deliv.changesSeq,
                                deliv.changesTurn,
                              ),
                            )
                          }
                        }}
                      >
                        {t('inspector.deliverables.review')}
                      </button>
                    )}
                  </div>
                  {activity.deliverables.latestFiles.length > 0 && (
                    <div className={css.fileChips}>
                      {activity.deliverables.latestFiles.map(file => (
                        <span key={file} className={css.fileChip}>{file}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className={css.card} data-workbench-inspector-activity="">
          <div className={css.rowBetween}>
            <span className={css.sectionLabel}>{t('inspector.section.activity')}</span>
            {liveCount > 0 && (
              <span className={css.statusBadge} data-status="running">
                {t('inspector.activity.liveNow', { count: liveCount })}
              </span>
            )}
          </div>

          <div className={css.filterRow} role="group" aria-label={t('inspector.section.activity')}>
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className={css.filterChip}
                aria-pressed={filter === option.id}
                data-workbench-activity-filter={option.id}
                onClick={() => { setFilter(option.id) }}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          {!hasFilteredActivity ? (
            <div className={css.mutedText}>{t('inspector.activity.empty')}</div>
          ) : (
            <>
              {showSubagents && activity.subagents.length > 0 && (
                <ul className={css.itemList}>
                  {activity.subagents.map(subagent => (
                    <li key={subagent.id} className={css.itemRow}>
                      <div className={css.itemMain}>
                        <div className={css.itemTitleRow}>
                          <span className={css.statusDot} data-tone={subagent.status === 'running' ? 'running' : 'done'} aria-hidden="true" />
                          <span className={css.itemTitle}>{subagent.label}</span>
                          <span className={css.itemCategoryPill}>{t('inspector.filter.subagent')}</span>
                        </div>
                      </div>
                      {activity.sessionId !== undefined && openResource !== undefined && (
                        <button
                          type="button"
                          className={css.itemAction}
                          onClick={() => {
                            if (activity.sessionId !== undefined) {
                              openResource(workbenchSubagentAddress(activity.sessionId, subagent.id, subagent.mode))
                            }
                          }}
                        >
                          {t('inspector.activity.openSubagent')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {showJobs && activity.jobs.length > 0 && (
                <ul className={css.itemList}>
                  {activity.jobs.map(job => (
                    <li key={job.id} className={css.itemRow}>
                      <div className={css.itemMain}>
                        <div className={css.itemTitleRow}>
                          <span className={css.statusDot} data-tone={job.status} aria-hidden="true" />
                          <span className={css.itemTitle}>{job.label}</span>
                          <span className={css.itemCategoryPill}>{t(jobStatusKey(job.status))}</span>
                        </div>
                        {job.detail !== undefined && job.detail.trim() !== '' && (
                          <div className={css.itemSubtitle}>{job.detail}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {filteredTimeline.length > 0 && (
                <>
                  <button
                    type="button"
                    className={css.timelineToggle}
                    aria-expanded={timelineExpanded}
                    data-workbench-timeline-toggle=""
                    onClick={() => { setTimelineExpanded(prev => !prev) }}
                  >
                    <span>{t('inspector.activity.timelineToggle', { count: filteredTimeline.length })}</span>
                    <span>{timelineExpanded ? '▾' : '▸'}</span>
                  </button>
                  {timelineExpanded && (
                    <ul className={css.itemList} data-workbench-timeline-list="">
                      {filteredTimeline.map(item => (
                        <li key={item.id} className={css.itemRow}>
                          <div className={css.itemMain}>
                            <div className={css.itemTitleRow}>
                              <span className={css.statusDot} data-tone={item.status} aria-hidden="true" />
                              <span className={css.itemTitle}>{item.title}</span>
                              <span className={css.itemCategoryPill}>
                                {item.category === 'subagent' ? t('inspector.filter.subagent') : t('inspector.filter.tool')}
                              </span>
                            </div>
                            {item.subtitle !== undefined && (
                              <div className={css.itemSubtitle}>{item.subtitle}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className={css.card}>
          <div className={css.sectionLabel}>{t('inspector.section.workspace')}</div>
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
          {(activeSession?.cwd ?? workspace?.path) !== undefined && (
            <div className={css.readOnlyHint} data-workbench-workspace-readonly="">
              {t('inspector.workspace.readOnlyNote')}
            </div>
          )}
        </section>

        <details
          className={css.technicalDetails}
          data-testid="workbench-technical-details"
          data-workbench-technical-details=""
        >
          <summary className={css.technicalSummary}>{t('inspector.section.technical')}</summary>
          <div className={css.technicalBody}>
            <div className={css.technicalField}>
              <span className={css.mutedText}>{t('inspector.session.idLabel')}</span>
              <span className={css.monoMeta}>{activeSession?.id ?? t('inspector.technical.none')}</span>
            </div>
            <div className={css.technicalField}>
              <span className={css.mutedText}>{t('inspector.technical.workspacePath')}</span>
              <span className={css.monoMeta}>{activeSession?.cwd ?? workspace?.path ?? t('inspector.technical.none')}</span>
            </div>
            <div className={css.technicalField}>
              <span className={css.mutedText}>{t('inspector.technical.jobIds')}</span>
              <span className={css.monoMeta}>
                {activity.jobs.length > 0 ? activity.jobs.map(job => job.id).join(', ') : t('inspector.technical.none')}
              </span>
            </div>
          </div>
        </details>
      </div>
    </aside>
  )
}
