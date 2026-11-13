// @vitest-environment jsdom
/** Verifies right-rail surface handoff between global rightbar and session rightbar actions. */
import { act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { SlotTestRuntime } from '@deepseek-ai/dsh-client-test-runtime'
import { apply as applyMenus, inject as injectMenus } from '@deepseek-ai/dsh-client-ui-context-menu/client'
import type { ILayout, RightbarInfo, RightbarSurface } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { ShortcutCatalogEntry } from '@deepseek-ai/dsh-client-shortcuts/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply, inject } from '../src/client/index.ts'
import type { createSidebarRightStore } from '../src/client/stores.ts'

const SESSION = 's-handoff' as SessionId
const runtimes: SlotTestRuntime[] = []

afterEach(async () => {
  for (const runtime of runtimes.splice(0)) await runtime.dispose()
})

async function setup() {
  const runtime = await SlotTestRuntime.create()
  runtimes.push(runtime)
  const rightbarInfo = createSnapshotStore<RightbarInfo>({
    owner: 'global',
    sessionPausedFullscreen: false,
    generation: 1,
  })
  const selectRightbarSurface = vi.fn((surface: RightbarSurface | 'auto') => {
    const owner: RightbarSurface | null = surface === 'auto' ? 'global' : surface
    const current = rightbarInfo.getSnapshot()
    rightbarInfo.set({
      owner,
      sessionPausedFullscreen: owner === 'session' ? false : current.sessionPausedFullscreen,
      generation: current.generation + 1,
    })
  })
  const layout: ILayout = {
    panelInfo: runtime.panelInfo,
    rightbarInfo,
    selectPanel: vi.fn(),
    beginNavigation: vi.fn(),
    toggleSidebar: vi.fn(),
    openRightbar: vi.fn(),
    closeRightbar: vi.fn(),
    openGlobalRightbar: vi.fn(),
    closeGlobalRightbar: vi.fn(),
    selectRightbarSurface,
  }
  runtime.ctx.provide('layout', layout)
  runtime.ctx.provide('resources', { pin: vi.fn() } as never)
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.ctx.provide('shortcuts', {
    register: () => () => {},
    catalog: createSnapshotStore<readonly ShortcutCatalogEntry[]>([]),
  } as never)
  runtime.slots.installLocale(locale)
  await runtime.mount({ inject: [...injectMenus], apply: applyMenus })
  await runtime.declare({
    'rightbar': { kind: 'single', scope: 'root' },
    'shell.overlay': { kind: 'list', scope: 'root' },
    'conversation.session.header.corner': { kind: 'single', scope: 'session' },
  })
  await runtime.sessions.add({ id: SESSION })
  const reference = runtime.sessions.retainFor(runtime.ctx, SESSION, { source: 'mainView' })
  await runtime.mount({ inject: [...inject], apply })
  await act(async () => {
    runtime.ctx.sidebarRightTabs.register({
      id: 'test/text',
      kind: 'text',
      priority: 'builtin',
      patterns: ['dsh-resource://file/**'],
      title: address => address.slice(address.lastIndexOf('/') + 1),
    })
  })
  runtime.renderSlot('rightbar', { width: 420, viewportWidth: 1440, canShow: true })
  const instance = runtime.storeOf('rightbar.session', reference) as ReturnType<ReturnType<typeof createSidebarRightStore>['create']>
  return { runtime, layout, rightbarInfo, selectRightbarSurface, instance }
}

describe('SidebarRight surface handoff against global rightbar', () => {
  it('requests session surface on toggleExpanded without collapsing an already-expanded session', async () => {
    const { runtime, rightbarInfo, selectRightbarSurface, instance } = await setup()
    act(() => { instance.actions.setExpanded(SESSION, true) })
    expect(rightbarInfo.getSnapshot().owner).toBe('global')
    expect(instance.getSnapshot().bySession[SESSION]?.layout.expanded).toBe(true)

    act(() => { runtime.ctx.sidebarRight.toggleExpanded() })
    expect(selectRightbarSurface).toHaveBeenCalledWith('session')
    expect(rightbarInfo.getSnapshot().owner).toBe('session')
    expect(instance.getSnapshot().bySession[SESSION]?.layout.expanded).toBe(true)

    // Once session owns the right rail, toggling again collapses normally.
    act(() => { runtime.ctx.sidebarRight.toggleExpanded() })
    expect(instance.getSnapshot().bySession[SESSION]?.layout.expanded).toBe(false)
  })

  it('requests session surface when openResource is called while global rightbar owns the rail', async () => {
    const { runtime, layout, rightbarInfo, selectRightbarSurface, instance } = await setup()
    expect(rightbarInfo.getSnapshot().owner).toBe('global')

    act(() => { runtime.ctx.sidebarRight.openResource('dsh-resource://file/session/s-handoff/main.ts') })
    expect(selectRightbarSurface).toHaveBeenCalledWith('session')
    expect(rightbarInfo.getSnapshot().owner).toBe('session')
    expect(instance.getSnapshot().bySession[SESSION]?.layout.expanded).toBe(true)

    // Return ownership to global, then openTab hands it back to session cleanly.
    act(() => { layout.selectRightbarSurface('global') })
    expect(rightbarInfo.getSnapshot().owner).toBe('global')
    act(() => { runtime.ctx.sidebarRight.openTab('guide') })
    expect(rightbarInfo.getSnapshot().owner).toBe('session')
  })
})
