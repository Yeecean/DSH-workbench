// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Context } from '@deepseek-ai/cordis'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  TestRemote,
  allowAllAccess,
  bindSnapshotSelector,
  contextMenuHook,
  makeTranslate,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { GlobalStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import { apply as themeApply, inject as themeInject } from '@deepseek-ai/dsh-client-ui-theme/client'
import { apply as layoutApply, inject as layoutInject } from '@deepseek-ai/dsh-client-ui-layout/client'
import ShortcutsService from '../../shortcuts/src/client/index.ts'
import { apply as workbenchApply, inject as workbenchInject } from '../src/client/index.ts'
import { ModeSwitcher, type ModeSwitcherInjected } from '../src/client/components/ModeSwitcher.tsx'
import {
  WorkbenchAppearanceRow,
  type WorkbenchAppearanceInjected,
  type WorkbenchAppearanceRowProps,
} from '../src/client/components/WorkbenchAppearanceRow.tsx'
import { en } from '../src/client/locales.ts'
import { createModeSwitcherStore, createWorkbenchSettingsStore } from '../src/client/stores.ts'
import z from '@deepseek-ai/schemastery'
import {
  ACCENT_PRESET_IDS,
  DEFAULT_ACCENT_PRESET,
  DEFAULT_WORKBENCH_MODE,
  DEFAULT_WORKBENCH_PREFERENCES,
  WORKBENCH_LOCAL_STORAGE_KEY,
  WORKBENCH_MODES,
  WORKBENCH_SETTINGS_NAMESPACE,
  normalizeWorkbenchPreferences,
} from '../src/workbench-settings.ts'

const WorkbenchSettingsSchema = z.object({
  defaultMode: z.union(WORKBENCH_MODES.map(value => z.const(value))).default(DEFAULT_WORKBENCH_MODE).volatile(),
  accentPreset: z.union(ACCENT_PRESET_IDS.map(value => z.const(value))).default(DEFAULT_ACCENT_PRESET).volatile(),
  reducedTransparency: z.boolean().default(false).volatile(),
  reducedMotion: z.boolean().default(false).volatile(),
  customThemeJson: z.string().default('').volatile(),
})

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

function buildGlobalProps(): GlobalStandardProps {
  return {
    usePanelInfo: selector => selector({ activePanelId: null }),
    useSessions: bindSnapshotSelector(createSnapshotStore<SessionListState>({
      ids: [], byId: {}, phase: 'ready', projectionsBySession: {},
    })),
    useSessionStatus: bindSnapshotSelector(createSnapshotStore<SessionStatusSnapshot>(new Map())),
    useSessionRetainInfo: () => undefined,
    useResource,
    useWorkspaces: bindSnapshotSelector(createSnapshotStore<WorkspaceSnapshot>({
      items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    })),
    ...allowAllAccess,
    useContextMenu: contextMenuHook(),
  }
}

describe('WorkbenchAppearanceRow component', () => {
  it('blocks malformed Custom Theme JSON, applies valid normalized JSON, and resets cleanly', () => {
    const store = createWorkbenchSettingsStore()
    const instance = store.create()
    const applyCustomThemeJson = vi.fn((customThemeJson: string) => {
      instance.actions.sync({ ...instance.getSnapshot().preferences, accentPreset: 'custom', customThemeJson }, true)
    })
    const resetCustomTheme = vi.fn(() => {
      instance.actions.sync(DEFAULT_WORKBENCH_PREFERENCES, true)
    })

    const props: WorkbenchAppearanceRowProps = {
      ...buildGlobalProps(),
      useStore: bindSnapshotSelector(instance),
      actions: instance.actions,
      setDefaultMode: vi.fn(),
      setAccentPreset: vi.fn(),
      setReducedTransparency: vi.fn(),
      setReducedMotion: vi.fn(),
      applyCustomThemeJson,
      resetCustomTheme,
      t: makeTranslate(en),
    }

    render(<WorkbenchAppearanceRow {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit JSON' }))

    const input = screen.getByRole('textbox', { name: 'Custom Theme JSON' }) as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '{not valid json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Validate & Apply' }))
    expect(applyCustomThemeJson).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('Syntax error')

    fireEvent.change(input, {
      target: {
        value: JSON.stringify({
          name: 'Glass Blue',
          tokens: { accent: '#007AFF', panelRadius: '18px' },
        }),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Validate & Apply' }))
    expect(applyCustomThemeJson).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status').textContent).toContain('Glass Blue')

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(resetCustomTheme).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status').textContent).toContain('cleared')
  })
})

describe('ui-workbench client plugin integration', () => {
  it('mounts mode switcher, global rightbar inspector, and general settings row with host persistence', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    const locale = new LocaleRuntime(ctx)
    locale.setLocale('en')
    ctx.provide('locale', locale)

    const hostSection: Record<string, unknown> = {
      defaultMode: 'work',
      accentPreset: 'blue',
      reducedTransparency: false,
      reducedMotion: false,
      customThemeJson: '',
    }
    const describe = vi.fn(() => Promise.resolve({
      ok: true as const,
      value: {
        writable: true,
        hasDocument: false,
        namespaces: [{
          ns: WORKBENCH_SETTINGS_NAMESPACE,
          schema: WorkbenchSettingsSchema.toJSON(),
          value: { ...hostSection },
          autoGenerate: false,
          applies: 'live' as const,
          secrets: [],
          revision: 0,
        }],
      },
    }))
    const mutate = vi.fn((_ns: string, ops: { path: string[]; value: unknown }[]) => {
      for (const op of ops) hostSection[op.path[0]!] = op.value
      return Promise.resolve({
        ok: true as const,
        value: {
          ns: WORKBENCH_SETTINGS_NAMESPACE,
          schema: WorkbenchSettingsSchema.toJSON(),
          value: { ...hostSection },
          autoGenerate: false,
          applies: 'live' as const,
          secrets: [],
          revision: 1,
        },
      })
    })
    const remote = new TestRemote(ctx, { settings: { describe, mutate } })
    remote.$host = { home: undefined, isLoopback: true }

    await ctx.plugin(ShortcutsService).await()
    await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
    await ctx.plugin({ inject: themeInject, apply: themeApply }).await()
    await ctx.plugin({ inject: layoutInject, apply: layoutApply }).await()

    const slots = ctx.get('slots') as SlotRegistry
    const unregExtra = slots.register(
      {
        name: 'shell.overlay',
        id: 'test-stub-seats',
        children: {
          'conversation.header.leading': { kind: 'single', scope: 'session' },
          'settings.general.item': { kind: 'list', scope: 'root' },
        },
      } as never,
      () => null,
    )

    try {
      const wbFiber = ctx.plugin({ inject: workbenchInject, apply: workbenchApply })
      await wbFiber.await()

      expect(workbenchInject).toEqual(['slots', 'locale', 'layout', 'theme'])
      expect(document.documentElement.dataset.dshWorkbench).toBe('1')
      expect(document.documentElement.dataset.workbenchMode).toBe('work')
      expect(slots.entries('conversation.header.leading').some(e => e.component === ModeSwitcher)).toBe(true)
      expect(slots.entries('shell.rightbar.global')).toHaveLength(1)
      expect(slots.entries('settings.general.item').some(e => e.component === WorkbenchAppearanceRow)).toBe(true)

      const switcherEntry = slots.entries('conversation.header.leading').find(e => e.component === ModeSwitcher)!
      const modeInstance = (switcherEntry.store as ReturnType<typeof createModeSwitcherStore>).create()
      const switcherInject = switcherEntry.inject as (
        a: typeof modeInstance.actions,
      ) => ModeSwitcherInjected & Record<string, unknown>
      const switcherInjected = switcherInject(modeInstance.actions)
      switcherInjected.switchMode('code')
      expect(document.documentElement.dataset.workbenchMode).toBe('code')
      switcherInjected.toggleInspector()
      expect(ctx.layout.rightbarInfo.getSnapshot().owner).toBe('global')
      expect(modeInstance.getSnapshot().inspectorActive).toBe(true)

      await vi.waitFor(() => {
        expect(describe).toHaveBeenCalled()
      })
      const appearanceEntry = slots.entries('settings.general.item').find(e => e.component === WorkbenchAppearanceRow)!
      expect((appearanceEntry as { options?: { id?: string } }).options?.id).toBe('workbench-appearance')
      const settingsInstance = (appearanceEntry.store as ReturnType<typeof createWorkbenchSettingsStore>).create()
      const settingsInject = appearanceEntry.inject as (
        a: typeof settingsInstance.actions,
      ) => WorkbenchAppearanceInjected & Record<string, unknown>
      const injected = settingsInject(settingsInstance.actions)
      injected.setReducedTransparency(true)
      expect(document.documentElement.dataset.workbenchReducedTransparency).toBe('true')
      const savedRaw = JSON.parse(localStorage.getItem(WORKBENCH_LOCAL_STORAGE_KEY)!) as Record<string, unknown>
      expect(normalizeWorkbenchPreferences(savedRaw).reducedTransparency).toBe(true)
      await vi.waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          WORKBENCH_SETTINGS_NAMESPACE,
          [{ op: 'set', path: ['reducedTransparency'], value: true }],
          0,
        )
      })

      await wbFiber.dispose()
    } finally {
      unregExtra()
      await ctx.fiber.dispose()
      await new Promise((resolve) => { setTimeout(resolve, 0) })
    }
  })
})
