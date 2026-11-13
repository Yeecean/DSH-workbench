// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { allowAllAccess, bindSnapshotSelector, contextMenuHook, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import type { GlobalStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import { ModeSwitcher, type ModeSwitcherProps } from '../src/client/components/ModeSwitcher.tsx'
import { WorkTaskInspector, type WorkTaskInspectorProps } from '../src/client/components/WorkTaskInspector.tsx'
import { en } from '../src/client/locales.ts'
import { EMPTY_ACTIVITY_SNAPSHOT, type WorkbenchActivitySnapshot } from '../src/client/session-activity.ts'
import { createModeSwitcherStore } from '../src/client/stores.ts'

afterEach(() => {
  cleanup()
})

const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined })) as GlobalStandardProps['useResource']

function buildGlobalProps(options: {
  sessions?: SessionListState
  statuses?: SessionStatusSnapshot
  workspaces?: WorkspaceSnapshot
} = {}): GlobalStandardProps {
  const sessionsStore = createSnapshotStore<SessionListState>(options.sessions ?? {
    ids: [],
    byId: {},
    phase: 'ready',
    projectionsBySession: {},
  })
  const statusStore = createSnapshotStore<SessionStatusSnapshot>(options.statuses ?? new Map())
  const workspaceStore = createSnapshotStore<WorkspaceSnapshot>(options.workspaces ?? {
    items: [],
    archivedSessionIds: [],
    pinnedSessionIds: [],
    state: 'idle',
    phase: 'ready',
    error: null,
  })
  return {
    usePanelInfo: selector => selector({ activePanelId: null }),
    useSessions: bindSnapshotSelector(sessionsStore),
    useSessionStatus: bindSnapshotSelector(statusStore),
    useSessionRetainInfo: () => undefined,
    useResource,
    useWorkspaces: bindSnapshotSelector(workspaceStore),
    ...allowAllAccess,
    useContextMenu: contextMenuHook(),
  }
}

describe('ModeSwitcher', () => {
  it('switches between Work and Code via clicks and ArrowLeft/ArrowRight without showing Code presets in Work', () => {
    const store = createModeSwitcherStore()
    const instance = store.create()
    const switchMode = vi.fn((mode: 'work' | 'code') => { instance.actions.setMode(mode) })
    const selectPreset = vi.fn((preset: 'focus' | 'build' | 'review' | 'debug') => { instance.actions.setPreset(preset) })
    const toggleInspector = vi.fn(() => { instance.actions.setInspectorActive(!instance.getSnapshot().inspectorActive) })

    const props: ModeSwitcherProps = {
      ...buildGlobalProps(),
      useStore: bindSnapshotSelector(instance),
      actions: instance.actions,
      switchMode,
      selectPreset,
      toggleInspector,
      t: makeTranslate(en),
    }

    render(<ModeSwitcher {...props} />)

    const workTab = screen.getByRole('tab', { name: 'Work' })
    const codeTab = screen.getByRole('tab', { name: 'Code' })
    expect(workTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Review' })).toBeNull()

    fireEvent.click(codeTab)
    expect(switchMode).toHaveBeenCalledWith('code')
    expect(codeTab.getAttribute('aria-selected')).toBe('true')
    const reviewButton = screen.getByRole('button', { name: 'Review' })
    fireEvent.click(reviewButton)
    expect(selectPreset).toHaveBeenCalledWith('review')
    expect(reviewButton.getAttribute('aria-pressed')).toBe('true')

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    expect(switchMode).toHaveBeenLastCalledWith('work')

    const inspectorBtn = screen.getByRole('button', { name: 'Inspector' })
    fireEvent.click(inspectorBtn)
    expect(toggleInspector).toHaveBeenCalledTimes(1)
    expect(inspectorBtn.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('WorkTaskInspector', () => {
  it('renders empty state when no mainView session is retained and triggers native rightbar/settings shortcuts', () => {
    const store = createModeSwitcherStore()
    const instance = store.create()
    const openRightbarTab = vi.fn()
    const openSettings = vi.fn()
    const closeInspector = vi.fn()
    const switchMode = vi.fn((mode: 'work' | 'code') => { instance.actions.setMode(mode) })

    const props: WorkTaskInspectorProps = {
      active: true,
      width: 340,
      viewportWidth: 1280,
      canShow: true,
      ...buildGlobalProps(),
      useStore: bindSnapshotSelector(instance),
      useActivity: bindSnapshotSelector(createSnapshotStore<WorkbenchActivitySnapshot>(EMPTY_ACTIVITY_SNAPSHOT)),
      actions: instance.actions,
      switchMode,
      openRightbarTab,
      openResource: vi.fn(),
      openSettings,
      closeInspector,
      t: makeTranslate(en),
    }

    render(<WorkTaskInspector {...props} />)
    expect(screen.getByText('Ready for a new task')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /Workspace Files/ }))
    expect(openRightbarTab).toHaveBeenCalledWith('files')

    fireEvent.click(screen.getByRole('button', { name: /Terminal/ }))
    expect(openRightbarTab).toHaveBeenCalledWith('terminal')

    fireEvent.click(screen.getByRole('button', { name: /Browser Preview/ }))
    expect(openRightbarTab).toHaveBeenCalledWith('browser')

    fireEvent.click(screen.getByRole('button', { name: /Workbench Appearance/ }))
    expect(openSettings).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Close inspector' }))
    expect(closeInspector).toHaveBeenCalledTimes(1)
  })

  it('displays the retained active session metadata and running status badge', () => {
    const store = createModeSwitcherStore()
    const instance = store.create()
    type BrandedSessionId = SessionListState['ids'][number]
    type BrandedWorkspaceId = WorkspaceSnapshot['items'][number]['workspaceId']
    const sessionId = 'sess-wb-1' as BrandedSessionId
    const workspaceId = 'ws-wb-1' as BrandedWorkspaceId
    const session = {
      id: sessionId,
      displayTitle: 'Inspect Electron Build',
      cwd: 'E:\\workspaces\\app',
      running: true,
      retainedBy: { mainView: 1 },
      blank: false,
      updatedAt: 1,
    }
    const sessionsState: SessionListState = {
      ids: [sessionId],
      byId: { [sessionId]: session },
      phase: 'ready',
      projectionsBySession: {},
    }
    const workspaces: WorkspaceSnapshot = {
      items: [{
        workspaceId,
        path: 'E:\\workspaces\\app',
        title: 'app',
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
      ...buildGlobalProps({ sessions: sessionsState, workspaces }),
      useStore: bindSnapshotSelector(instance),
      useActivity: bindSnapshotSelector(createSnapshotStore<WorkbenchActivitySnapshot>({
        ...EMPTY_ACTIVITY_SNAPSHOT,
        sessionId,
      })),
      actions: instance.actions,
      switchMode: vi.fn(),
      openRightbarTab: vi.fn(),
      openResource: vi.fn(),
      openSettings: vi.fn(),
      closeInspector: vi.fn(),
      t: makeTranslate(en),
    }

    render(<WorkTaskInspector {...props} />)
    expect(screen.getByText('Inspect Electron Build')).toBeDefined()
    expect(screen.getByText('Running')).toBeDefined()
    expect(screen.getByText('app')).toBeDefined()

    const details = screen.getByTestId('workbench-technical-details') as HTMLDetailsElement
    expect(details.open).toBe(false)
    expect(screen.getByText('sess-wb-1')).toBeDefined()
    expect(screen.getByText('E:\\workspaces\\app')).toBeDefined()

    act(() => { instance.actions.setMode('code') })
    expect(screen.getByRole('heading', { name: 'Code Overview' })).toBeDefined()
  })
})
