/**
 * Lightweight Work & Code prompt starters rendered above the Hero composer
 * exclusively on ready blank sessions with an empty draft.
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { WorkbenchMode } from '../../workbench-settings.ts'
import css from './PromptStarters.module.css'

/** Injected reactive workbench mode snapshot for `'conversation.input.dock'`. */
export interface PromptStartersInjected {
  /** Observable snapshot channel bound by renderer to `useWorkbenchMode`. */
  hooks: {
    workbenchMode: ObservableSnapshot<WorkbenchMode>
  }
}

/** Props for the `'conversation.input.dock'` prompt starter strip. */
export type PromptStartersProps =
  PropsRuntime<'conversation.input.dock'>
  & PropsLocale<'workbench'>
  & InjectFace<PromptStartersInjected>

interface StarterSpec {
  readonly id: string
  readonly labelKey:
    | 'starter.work.summarize.label'
    | 'starter.work.plan.label'
    | 'starter.work.docs.label'
    | 'starter.work.status.label'
    | 'starter.code.explore.label'
    | 'starter.code.debug.label'
    | 'starter.code.review.label'
    | 'starter.code.tests.label'
  readonly promptKey:
    | 'starter.work.summarize.prompt'
    | 'starter.work.plan.prompt'
    | 'starter.work.docs.prompt'
    | 'starter.work.status.prompt'
    | 'starter.code.explore.prompt'
    | 'starter.code.debug.prompt'
    | 'starter.code.review.prompt'
    | 'starter.code.tests.prompt'
}

const WORK_STARTERS: readonly StarterSpec[] = [
  { id: 'work-summarize', labelKey: 'starter.work.summarize.label', promptKey: 'starter.work.summarize.prompt' },
  { id: 'work-plan', labelKey: 'starter.work.plan.label', promptKey: 'starter.work.plan.prompt' },
  { id: 'work-docs', labelKey: 'starter.work.docs.label', promptKey: 'starter.work.docs.prompt' },
  { id: 'work-status', labelKey: 'starter.work.status.label', promptKey: 'starter.work.status.prompt' },
]

const CODE_STARTERS: readonly StarterSpec[] = [
  { id: 'code-explore', labelKey: 'starter.code.explore.label', promptKey: 'starter.code.explore.prompt' },
  { id: 'code-debug', labelKey: 'starter.code.debug.label', promptKey: 'starter.code.debug.prompt' },
  { id: 'code-review', labelKey: 'starter.code.review.label', promptKey: 'starter.code.review.prompt' },
  { id: 'code-tests', labelKey: 'starter.code.tests.label', promptKey: 'starter.code.tests.prompt' },
]

function focusComposerEditor(): void {
  if (typeof document === 'undefined') return
  const editor = document.querySelector<HTMLElement>('[data-composer-seat] [contenteditable="true"]')
  editor?.focus()
}

/**
 * Renders 4 mode-adapted prompt starter chips on blank sessions with empty drafts
 * and an attached workspace, disappearing automatically once typing or turns begin.
 */
export function PromptStarters({
  session,
  input,
  inputActions,
  useSessions,
  useWorkspaces,
  useWorkbenchMode,
  t,
}: PromptStartersProps) {
  const mode = useWorkbenchMode(state => state)
  const workspaces = useWorkspaces(state => state)
  const sessionCwd = useSessions(state => state.byId[session.sessionId]?.cwd ?? '')

  if (!session.blank || session.running || session.removed || session.subagent !== null) {
    return null
  }
  if (input.phase !== 'plain' || input.draft.trim() !== '' || input.attachmentIds.length > 0) {
    return null
  }

  const workspaceReady = workspaces.items.some(item => item.sessionIds.includes(session.sessionId))
    || (workspaces.phase !== 'ready' && sessionCwd !== '')
  if (!workspaceReady) return null

  const starters = mode === 'code' ? CODE_STARTERS : WORK_STARTERS

  return (
    <div
      className={css.root}
      role="group"
      aria-label={t('starter.region.ariaLabel')}
      data-workbench-starters={mode}
    >
      {starters.map(starter => (
        <button
          key={starter.id}
          type="button"
          className={css.chip}
          data-workbench-starter={starter.id}
          onClick={() => {
            inputActions.setDraft(t(starter.promptKey))
            inputActions.persistDraft()
            focusComposerEditor()
          }}
        >
          {t(starter.labelKey)}
        </button>
      ))}
    </div>
  )
}
