// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Context } from '@deepseek-ai/cordis'
import type { SessionListState, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { allowAllAccess, bindSnapshotSelector, contextMenuHook, makeTranslate, TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import {
  EMPTY_CONVERSATION_SNAPSHOT,
  type InputActions,
  type InputState,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { apply as layoutApply, inject as layoutInject } from '@deepseek-ai/dsh-client-ui-layout/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { GlobalStandardProps, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { apply as themeApply, inject as themeInject } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import ShortcutsService from '../../shortcuts/src/client/index.ts'
import { PromptStarters, type PromptStartersProps } from '../src/client/components/PromptStarters.tsx'
import { WorkTaskInspector, type WorkTaskInspectorInjected, type WorkTaskInspectorProps } from '../src/client/components/WorkTaskInspector.tsx'
import { apply as workbenchApply, inject as workbenchInject } from '../src/client/index.ts'
import { en } from '../src/client/locales.ts'
import {
  deriveActivitySnapshot,
  workbenchChangesReviewAddress,
  workbenchPlanAddress,
  workbenchSubagentAddress,
  type WorkbenchActivitySnapshot,
} from '../src/client/session-activity.ts'
import { createModeSwitcherStore } from '../src/client/stores.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.dshWorkbench
  delete document.documentElement.dataset.workbenchMode
  delete document.documentElement.dataset.workbenchPreset
  delete document.documentElement.dataset.workbenchAccent
  delete document.documentElement.dataset.workbenchReducedTransparency
  delete document.documentElement.dataset.workbenchReducedMotion
  document.head.querySelectorAll('style[data-plugin="@deepseek-ai/dsh-client-ui-workbench"]').forEach((node) => { node.remove() })
})

const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined })) as GlobalStandardProps['useResource']

function buildGlobalProps(options: {
  sessions?: SessionListState
  statuses?: SessionStatusSnapshot
  workspaces?: WorkspaceSnapshot
} = {}): GlobalStandardProps {
  return {
    usePanelInfo: selector => selector({ activePanelId: null }),
    useSessions: bindSnapshotSelector(createSnapshotStore<SessionListState>(options.sessions ?? {
      ids: [], byId: {}, phase: 'ready', projectionsBySession: {},
    })),
    useSessionStatus: bindSnapshotSelector(createSnapshotStore<SessionStatusSnapshot>(options.statuses ?? new Map())),
    useSessionRetainInfo: () => undefined,
    useResource,
    useWorkspaces: bindSnapshotSelector(createSnapshotStore<WorkspaceSnapshot>(options.workspaces ?? {
      items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    })),
    ...allowAllAccess,
    useContextMenu: contextMenuHook(),
  }
}

describe('deriveActivitySnapshot', () => {
  it('derives plan, todos, deliverables, subagents, jobs, and deduplicated tool timeline without duplicating state', () => {
    const sessionId = 'sess-main-1' as SessionId
    const childId = 'sess-child-1' as SessionId
    const workspaceId = 'ws-1' as WorkspaceSnapshot['items'][number]['workspaceId']
    void workspaceId

    const listState: SessionListState = {
      ids: [sessionId, childId],
      byId: {
        [sessionId]: {
          id: sessionId,
          displayTitle: 'Build Electron Pipeline',
          cwd: 'E:\\repos\\dsh',
          running: true,
          retainedBy: { mainView: 1 },
          blank: false,
          updatedAt: 100,
        },
        [childId]: {
          id: childId,
          displayTitle: 'Test Audit Worker',
          cwd: 'E:\\repos\\dsh',
          running: true,
          retainedBy: {},
          blank: false,
          updatedAt: 95,
          parentId: sessionId,
          origin: 'subagent',
        },
      },
      phase: 'ready',
      projectionsBySession: {
        [sessionId]: {
          state: 'ready',
          error: null,
          values: {
            plan: { active: true, pending: false },
            subagentCatalog: [{ id: childId, createdAt: 90, mode: 'continuable', label: 'Audit Worker' }],
          },
        },
      },
    }

    const emptyArgs = {
      text: () => undefined,
      textPrefix: () => undefined,
    }

    const runningCall = {
      callId: 'call-run-1',
      name: 'bash',
      phase: 'start' as const,
      argsRaw: JSON.stringify({ command: 'pnpm run typecheck' }),
      args: {
        text: () => undefined,
        textPrefix: (key: string) => (key === 'command' ? 'pnpm run typecheck' : undefined),
      },
    }

    const planResult = {
      kind: 'tool-result' as const,
      seq: 12,
      callId: 'call-plan-1',
      name: 'exit_plan_mode',
      args: emptyArgs,
      call: {
        name: 'exit_plan_mode',
        argsRaw: JSON.stringify({ plan: '# Implementation Roadmap\n1. Ship P2' }),
      },
      isError: false,
    }

    const subagentResult = {
      kind: 'tool-result' as const,
      seq: 14,
      callId: 'call-sub-1',
      name: 'spawn_subagent',
      args: emptyArgs,
      call: {
        name: 'spawn_subagent',
        argsRaw: JSON.stringify({ description: 'Check Windows build' }),
      },
      isError: false,
    }

    const eventLocations = new Map([
      [
        12,
        {
          kind: 'turn',
          turn: {
            turn: 1,
            data: {
              get: (key: string) => {
                if (key !== 'deliverables') return undefined
                return {
                  produced: [{ path: 'E:\\repos\\dsh\\packages\\client\\ui-workbench\\src\\client\\index.ts' }],
                  changes: { seq: 42 },
                }
              },
            },
          },
        },
      ],
    ])

    const snapshot = deriveActivitySnapshot({
      listState,
      pendingInteractionKind: 'approval',
      completionUnread: true,
      todosProjection: [
        { content: 'Wire native trajectory observer', status: 'completed' },
        { content: 'Run desktop verification', status: 'in_progress' },
      ],
      trajectory: {
        eventNodes: [planResult, subagentResult],
        eventLocations,
        runningCalls: [runningCall],
      },
      jobRows: [
        { id: 'job-2', label: 'pnpm build', status: 'completed', detail: 'exit 0', startedAt: 100, finishedAt: 150 },
        { id: 'job-1', command: 'tsx scripts/dev.ts', status: 'running', progress: 'Listening on 9223', startedAt: 200 },
      ],
    })

    expect(snapshot.sessionId).toBe(sessionId)
    expect(snapshot.pendingInteractionKind).toBe('approval')
    expect(snapshot.completionUnread).toBe(true)
    expect(snapshot.plan).toEqual({
      active: true,
      pending: false,
      latestCallId: 'call-plan-1',
      latestTitle: 'Implementation Roadmap',
    })
    expect(snapshot.todos).toHaveLength(2)
    expect(snapshot.deliverables).toEqual({
      producedCount: 1,
      latestFiles: ['index.ts'],
      changesSeq: 42,
      changesTurn: 1,
    })
    expect(snapshot.subagents).toEqual([
      { id: childId, label: 'Test Audit Worker', mode: 'continuable', status: 'running', createdAt: 90 },
    ])
    expect(snapshot.jobs.map(job => job.id)).toEqual(['job-1', 'job-2'])
    expect(snapshot.activities.map(item => [item.title, item.category, item.status, item.subtitle])).toEqual([
      ['bash', 'tool', 'running', 'pnpm run typecheck'],
      ['spawn_subagent', 'subagent', 'completed', 'Check Windows build'],
      ['exit_plan_mode', 'tool', 'completed', undefined],
    ])
  })

  it('omits plan summary when host plan projection is inactive without plan calls', () => {
    const sessionId = 'sess-idle-plan' as SessionId
    const listState: SessionListState = {
      ids: [sessionId],
      byId: {
        [sessionId]: {
          id: sessionId,
          displayTitle: 'Idle Session',
          cwd: '/repo',
          running: false,
          retainedBy: { mainView: 1 },
          blank: false,
          updatedAt: 1,
        },
      },
      phase: 'ready',
      projectionsBySession: {
        [sessionId]: {
          state: 'ready',
          error: null,
          values: {
            plan: { active: false, pending: false },
          },
        },
      },
    }

    const snapshot = deriveActivitySnapshot({ listState })
    expect(snapshot.sessionId).toBe(sessionId)
    expect(snapshot.plan).toBeUndefined()
  })
})

describe('PromptStarters', () => {
  function renderStarters(options: {
    blank?: boolean
    running?: boolean
    draft?: string
    withWorkspace?: boolean
    mode?: 'work' | 'code'
  } = {}) {
    const sessionId = 'sess-hero-1' as SessionId
    const workspaceId = 'ws-hero-1' as WorkspaceSnapshot['items'][number]['workspaceId']
    const modeStore = createSnapshotStore<'work' | 'code'>(options.mode ?? 'work')
    const setDraft = vi.fn()
    const persistDraft = vi.fn()
    const sessionSnapshot: SessionSnapshot = {
      sessionId,
      pendingSubmissions: [],
      running: options.running ?? false,
      subagent: null,
      removed: false,
      openState: 'open',
      openError: null,
      hasMore: false,
      historyWasPartial: false,
      loadingOlder: false,
      historyLoadStatus: 'idle',
      promptError: null,
      blank: options.blank ?? true,
      lastAgentError: null,
      promptAttempted: false,
      awaitingFirstTurn: true,
    }
    const inputSnapshot: InputState = {
      draft: options.draft ?? '',
      attachmentIds: [],
      draftRev: 1,
      phase: 'plain',
      occurrences: [],
      queue: [],
    }
    const inputActions: InputActions = {
      insertQuote: () => true,
      captureInsertion: () => ({ start: 0, end: 0, draftRev: 1 }),
      insertText: () => true,
      setDraft,
      persistDraft,
      addAttachments: () => true,
      removeAttachment: () => {},
      pruneAttachments: () => {},
      submit: () => {},
    }
    let workspaceItems: WorkspaceSnapshot['items'] = []
    if (options.withWorkspace !== false) {
      workspaceItems = [{
        workspaceId,
        path: 'E:\\repos\\dsh',
        title: 'dsh',
        sessionIds: [sessionId],
        createdAt: '2026-11-13T00:00:00Z',
        updatedAt: '2026-11-13T00:00:00Z',
      }]
    }
    const workspaces: WorkspaceSnapshot = {
      items: workspaceItems,
      archivedSessionIds: [],
      pinnedSessionIds: [],
      state: 'idle',
      phase: 'ready',
      error: null,
    }
    const conversationStore = createSnapshotStore(EMPTY_CONVERSATION_SNAPSHOT)
    const sessionRuntimeProps: PropsRuntime<'conversation.input.dock'> = {
      ...buildGlobalProps({ workspaces }),
      sessionId,
      useSession: bindSnapshotSelector(createSnapshotStore(sessionSnapshot)),
      useProjection: () => undefined as never,
      useAccess: () => true,
      useConversation: bindSnapshotSelector(conversationStore),
      useChat: () => { throw new Error('unused') },
      useInput: bindSnapshotSelector(createSnapshotStore(inputSnapshot)),
      inputActions,
      useTrajectory: () => undefined as never,
      session: sessionSnapshot,
      input: inputSnapshot,
    }
    const props: PromptStartersProps = {
      ...sessionRuntimeProps,
      useWorkbenchMode: bindSnapshotSelector(modeStore),
      t: makeTranslate(en),
    }

    render(<PromptStarters {...props} />)
    return { setDraft, persistDraft, modeStore }
  }

  it('switches starter prompts between Work and Code modes and seeds composer draft on click', () => {
    const { setDraft, persistDraft, modeStore } = renderStarters({ mode: 'work' })
    expect(screen.getByRole('button', { name: 'Summarize Workspace' })).toBeDefined()

    act(() => { modeStore.set('code') })
    const codeButton = screen.getByRole('button', { name: 'Explore Codebase' })
    fireEvent.click(codeButton)
    expect(setDraft).toHaveBeenCalledWith('Explore the codebase entry points, core modules, and how state flows end to end.')
    expect(persistDraft).toHaveBeenCalledTimes(1)
  })

  it('stays hidden when session is active, draft is non-empty, or workspace is missing', () => {
    const r1 = render(<></>)
    r1.unmount()
    renderStarters({ blank: false })
    expect(screen.queryByRole('group')).toBeNull()
    cleanup()

    renderStarters({ draft: 'hello' })
    expect(screen.queryByRole('group')).toBeNull()
    cleanup()

    renderStarters({ withWorkspace: false })
    expect(screen.queryByRole('group')).toBeNull()
  })
})

describe('WorkTaskInspector P2 activity & native resource links', () => {
  it('filters activity streams, keeps timeline collapsed by default, and opens native Plan/Changes/Subagent resources', () => {
    const sessionId = 'sess-p2' as SessionId
    const childId = 'sess-child-2' as SessionId
    const workspaceId = 'ws-p2' as WorkspaceSnapshot['items'][number]['workspaceId']
    const store = createModeSwitcherStore()
    const instance = store.create()
    const openResource = vi.fn()

    const activity: WorkbenchActivitySnapshot = {
      sessionId,
      pendingInteractionKind: 'question',
      completionUnread: false,
      plan: { active: true, pending: false, latestCallId: 'call-plan-2', latestTitle: 'Desktop Polish Plan' },
      todos: [
        { content: 'Verify inspector filters', status: 'completed' },
        { content: 'Open changes diff', status: 'in_progress' },
      ],
      deliverables: { producedCount: 2, latestFiles: ['WorkTaskInspector.tsx', 'PromptStarters.tsx'], changesSeq: 99, changesTurn: 3 },
      subagents: [{ id: childId, label: 'UI QA Agent', mode: 'continuable', status: 'running', createdAt: 10 }],
      jobs: [{ id: 'job-win-1', label: 'vitest ui-workbench', status: 'running', detail: 'Running specs', startedAt: 20 }],
      activities: [
        { id: 'act-1', category: 'tool', title: 'read_file', subtitle: 'locales.ts', status: 'completed', seq: 2 },
        { id: 'act-2', category: 'subagent', title: 'spawn_subagent', subtitle: 'UI QA Agent', status: 'running', seq: 3 },
      ],
    }

    const sessions: SessionListState = {
      ids: [sessionId],
      byId: {
        [sessionId]: {
          id: sessionId,
          displayTitle: 'P2 Inspector Verification',
          cwd: 'E:\\repos\\dsh',
          running: true,
          retainedBy: { mainView: 1 },
          blank: false,
          updatedAt: 50,
        },
      },
      phase: 'ready',
      projectionsBySession: {},
    }

    const workspaces: WorkspaceSnapshot = {
      items: [{
        workspaceId,
        path: 'E:\\repos\\dsh',
        title: 'dsh-workbench',
        sessionIds: [sessionId],
        createdAt: '2026-11-13T00:00:00Z',
        updatedAt: '2026-11-13T00:00:00Z',
      }],
      archivedSessionIds: [],
      pinnedSessionIds: [],
      state: 'idle',
      phase: 'ready',
      error: null,
    }

    const props: WorkTaskInspectorProps = {
      active: true,
      width: 340,
      viewportWidth: 1280,
      canShow: true,
      ...buildGlobalProps({ sessions, workspaces }),
      useStore: bindSnapshotSelector(instance),
      useActivity: bindSnapshotSelector(createSnapshotStore(activity)),
      actions: instance.actions,
      switchMode: vi.fn(),
      openRightbarTab: vi.fn(),
      openResource,
      openSettings: vi.fn(),
      closeInspector: vi.fn(),
      t: makeTranslate(en),
    }

    render(<WorkTaskInspector {...props} />)

    expect(screen.getByText('Waiting for your answer to continue.')).toBeDefined()
    expect(screen.getByText('1/2 done')).toBeDefined()
    expect(screen.getByText('2 files updated')).toBeDefined()

    const timelineToggle = screen.getByRole('button', { name: /Timeline \(2\)/ })
    expect(timelineToggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('read_file')).toBeNull()

    fireEvent.click(timelineToggle)
    expect(timelineToggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('read_file')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Jobs' }))
    expect(screen.getByText('vitest ui-workbench')).toBeDefined()
    expect(screen.queryByText('read_file')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open Plan' }))
    expect(openResource).toHaveBeenCalledWith(workbenchPlanAddress(sessionId, 'call-plan-2'))

    fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }))
    expect(openResource).toHaveBeenCalledWith(workbenchChangesReviewAddress(sessionId, 99, 3))

    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }))
    expect(openResource).toHaveBeenCalledWith(workbenchSubagentAddress(sessionId, childId, 'continuable'))
  })

  it('wires jobs watchRows lifecycle and PromptStarters slot inside client plugin integration', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    const locale = new LocaleRuntime(ctx)
    locale.setLocale('en')
    ctx.provide('locale', locale)
    const section: Record<string, unknown> = {}
    const namespace = () => ({
      namespace: 'workbench',
      writable: true,
      storage: 'settings' as const,
      values: { ...section },
      sources: {},
      revision: 0,
    })
    const describeCall = () => Promise.resolve({
      ok: true as const,
      value: { writable: true, hasDocument: true, namespaces: [namespace()] },
    })
    const mutate = (_ns: string, ops: { path: string[]; value: unknown }[]) => {
      for (const op of ops) section[op.path[0]!] = op.value
      return Promise.resolve({ ok: true as const, value: namespace() })
    }
    const remote = new TestRemote(ctx, { settings: { describe: describeCall, mutate } })
    remote.$host = { home: undefined, isLoopback: true }

    await ctx.plugin(ShortcutsService).await()
    await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
    await ctx.plugin({ inject: themeInject, apply: themeApply }).await()
    await ctx.plugin({ inject: layoutInject, apply: layoutApply }).await()

    const s1 = 'sess-live-1' as SessionId
    const s2 = 'sess-live-2' as SessionId
    const sessionsStore = createSnapshotStore<SessionListState>({
      ids: [s1, s2],
      byId: {
        [s1]: { id: s1, displayTitle: 'One', cwd: 'E:\\a', running: false, retainedBy: { mainView: 1 }, blank: false, updatedAt: 1 },
        [s2]: { id: s2, displayTitle: 'Two', cwd: 'E:\\b', running: true, retainedBy: {}, blank: false, updatedAt: 2 },
      },
      phase: 'ready',
      projectionsBySession: {},
    })
    ctx.provide('sessions', {
      list: sessionsStore,
      binding: () => undefined,
    } as never)

    const releaseS1 = vi.fn()
    const releaseS2 = vi.fn()
    const watchRows = vi.fn((sid: SessionId) => (sid === s1 ? releaseS1 : releaseS2))
    const jobsState = createSnapshotStore({
      rows: {
        [s1]: [{ id: 'job-a', label: 'Build Task', status: 'running', startedAt: 10 }],
      },
      observed: {},
    })
    ctx.provide('jobs', {
      state: jobsState,
      watchRows,
    } as never)

    const slots = ctx.get('slots') as SlotRegistry
    const unregStub = slots.register({
      name: 'shell.overlay',
      id: 'p2-stub-seats',
      children: {
        'conversation.header.leading': { kind: 'single', scope: 'session' },
        'conversation.input.dock': { kind: 'list', scope: 'session' },
        'settings.general.item': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)

    try {
      const fiber = ctx.plugin({ inject: workbenchInject, apply: workbenchApply })
      await fiber.await()

      expect(watchRows).toHaveBeenCalledWith(s1)
      expect(slots.entries('conversation.input.dock').some(entry => entry.component === PromptStarters)).toBe(true)

      const inspectorEntry = slots.entries('shell.rightbar.global')[0]!
      const modeActions = createModeSwitcherStore().create().actions
      const injected = inspectorEntry.inject?.(modeActions as never) as Partial<WorkTaskInspectorInjected> | undefined
      expect(injected?.hooks?.activity.getSnapshot().jobs).toHaveLength(1)

      sessionsStore.set({
        ids: [s1, s2],
        byId: {
          [s1]: { id: s1, displayTitle: 'One', cwd: 'E:\\a', running: false, retainedBy: {}, blank: false, updatedAt: 1 },
          [s2]: { id: s2, displayTitle: 'Two', cwd: 'E:\\b', running: true, retainedBy: { mainView: 1 }, blank: false, updatedAt: 2 },
        },
        phase: 'ready',
        projectionsBySession: {},
      })

      expect(releaseS1).toHaveBeenCalledTimes(1)
      expect(watchRows).toHaveBeenCalledWith(s2)

      await fiber.dispose()
      expect(releaseS2).toHaveBeenCalledTimes(1)
    } finally {
      unregStub()
      await ctx.fiber.dispose()
      await new Promise((resolve) => { setTimeout(resolve, 0) })
    }
  })
})
