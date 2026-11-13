/**
 * Workbench browser plugin: mounts Apple Liquid Glass styling and offline fonts,
 * the top Work × Code mode switcher, the global Work Task Inspector inside the
 * single right-column arbitration track, and persistent General Settings controls.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-general/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { createSnapshotStore, type BoundActions } from '@deepseek-ai/dsh-client-store'
import {
  DEFAULT_WORKBENCH_PREFERENCES,
  WORKBENCH_SETTINGS_NAMESPACE,
  normalizeWorkbenchPreferences,
  type AccentPresetId,
  type CodePresetId,
  type WorkbenchMode,
  type WorkbenchPreferences,
} from '../workbench-settings.ts'
import { ModeSwitcher } from './components/ModeSwitcher.tsx'
import { PromptStarters } from './components/PromptStarters.tsx'
import { WorkbenchAppearanceRow } from './components/WorkbenchAppearanceRow.tsx'
import { WorkTaskInspector } from './components/WorkTaskInspector.tsx'
import { WORKBENCH_LOCALE_NS, de, en, es, fr, ja, pt, ru, zh, type WorkbenchKey } from './locales.ts'
import { installSessionActivityObserver } from './session-activity.ts'
import {
  createModeSwitcherStore,
  createWorkbenchSettingsStore,
  readLocalWorkbenchPreferences,
  writeLocalWorkbenchPreferences,
} from './stores.ts'
import { installWorkbenchStyles } from './styles.ts'
import glassCss from './styles/workbench-glass.css?inline'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    workbench: WorkbenchKey
  }
}

/** Plugin client context type exported alongside `apply`. */
export type ClientContext = Context

export const inject = ['slots', 'locale', 'layout', 'theme']

/** Mount Workbench presentation, mode controls, right-rail inspector, and settings. */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.register(WORKBENCH_LOCALE_NS, { zh, en, ja, es, fr, de, ru, pt }),
    'ui-workbench: dictionaries',
  )

  const { syncVisuals } = installWorkbenchStyles(ctx, glassCss)

  const initialPrefs = readLocalWorkbenchPreferences() ?? DEFAULT_WORKBENCH_PREFERENCES
  let activePreferences: WorkbenchPreferences = initialPrefs
  let activeMode: WorkbenchMode = initialPrefs.defaultMode
  let activePreset: CodePresetId = 'focus'
  let userSwitchedMode = false

  const headerModeStore = createModeSwitcherStore()
  const inspectorModeStore = createModeSwitcherStore()
  const settingsStore = createWorkbenchSettingsStore()

  const modeBindings = new Set<BoundActions<typeof headerModeStore>>()
  let settingsBinding: BoundActions<typeof settingsStore> | undefined
  let settingsWritable = true

  let openTabHandler: ((kind: 'files' | 'terminal' | 'browser') => void) | undefined
  let openResourceHandler: ((address: string) => void) | undefined
  let persistFields: ((patch: Partial<WorkbenchPreferences>) => void) | undefined

  const activityObserver = installSessionActivityObserver(ctx)
  const modeSource = createSnapshotStore<WorkbenchMode>(activeMode)

  ctx.inject(['sidebarRight'], (child) => {
    const openResource = (address: string): void => {
      try {
        child.sidebarRight.openResource(address)
      } catch {
        // No mounted session surface on screen yet.
      }
    }
    openResourceHandler = openResource
    child.effect(() => () => {
      if (openResourceHandler === openResource) openResourceHandler = undefined
    }, 'ui-workbench: sidebarRight resource handler')
  })

  const syncAll = (): void => {
    const rightbar = ctx.layout.rightbarInfo.getSnapshot()
    const inspectorActive = rightbar.owner === 'global'
    modeSource.set(activeMode)
    syncVisuals({
      mode: activeMode,
      preset: activePreset,
      preferences: activePreferences,
    })
    for (const bound of modeBindings) {
      bound.setMode(activeMode)
      bound.setPreset(activePreset)
      bound.setInspectorActive(inspectorActive)
    }
    settingsBinding?.sync(activePreferences, settingsWritable)
  }

  // Initial sync immediately establishes default CSS variables and fonts.
  syncAll()

  const unsubscribeRightbar = ctx.layout.rightbarInfo.subscribe(() => {
    syncAll()
  })
  ctx.effect(() => unsubscribeRightbar, 'ui-workbench: rightbar arbitration observer')

  ctx.inject(['sidebarRight'], (child) => {
    const opener = (kind: 'files' | 'terminal' | 'browser'): void => {
      child.sidebarRight.openTab(kind)
    }
    openTabHandler = opener
    child.effect(() => () => {
      if (openTabHandler === opener) openTabHandler = undefined
    }, 'ui-workbench: sidebarRight tab launcher')
  })

  ctx.inject(['configForms', 'remote'], (child) => {
    const form = child.configForms.get<Partial<WorkbenchPreferences>>(WORKBENCH_SETTINGS_NAMESPACE)
    const applyFromHost = (): void => {
      const snap = form.getSnapshot()
      if (snap.status === 'loading') return
      settingsWritable = snap.writable
      if (snap.value !== undefined) {
        const normalized = normalizeWorkbenchPreferences(snap.value)
        activePreferences = normalized
        writeLocalWorkbenchPreferences(normalized)
        if (!userSwitchedMode) activeMode = normalized.defaultMode
      }
      syncAll()
    }
    const unsub = form.subscribe(applyFromHost)
    applyFromHost()

    const writer = (patch: Partial<WorkbenchPreferences>): void => {
      const ops = Object.entries(patch).map(([field, value]) => ({
        op: 'set' as const,
        path: [field],
        value,
      }))
      if (ops.length === 0) return
      void form.mutate(ops)
    }
    persistFields = writer

    child.effect(() => () => {
      unsub()
      if (persistFields === writer) persistFields = undefined
    }, 'ui-workbench: configForm host sync')
  })

  const switchMode = (next: WorkbenchMode): void => {
    userSwitchedMode = true
    activeMode = next
    syncAll()
  }

  const selectPreset = (preset: CodePresetId): void => {
    activePreset = preset
    syncAll()
    if (preset === 'focus') {
      ctx.layout.closeRightbar()
      ctx.layout.closeGlobalRightbar()
    } else if (preset === 'review') {
      openTabHandler?.('files')
    } else {
      openTabHandler?.('terminal')
    }
  }

  const toggleInspector = (): void => {
    if (ctx.layout.rightbarInfo.getSnapshot().owner === 'global') {
      ctx.layout.closeGlobalRightbar()
    } else {
      ctx.layout.openGlobalRightbar(true, false)
    }
  }

  const updatePreferences = (patch: Partial<WorkbenchPreferences>): void => {
    activePreferences = normalizeWorkbenchPreferences({ ...activePreferences, ...patch })
    writeLocalWorkbenchPreferences(activePreferences)
    syncAll()
    persistFields?.(patch)
  }

  ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
    name: 'conversation.header.leading',
    store: headerModeStore,
    locale: WORKBENCH_LOCALE_NS,
    inject: (bound: BoundActions<typeof headerModeStore>) => {
      modeBindings.add(bound)
      bound.setMode(activeMode)
      bound.setPreset(activePreset)
      bound.setInspectorActive(ctx.layout.rightbarInfo.getSnapshot().owner === 'global')
      return {
        switchMode,
        selectPreset,
        toggleInspector,
      }
    },
  }, ModeSwitcher))

  ctx.slots.inject('shell.rightbar.global', () => ctx.slots.register({
    name: 'shell.rightbar.global',
    store: inspectorModeStore,
    locale: WORKBENCH_LOCALE_NS,
    inject: (bound: BoundActions<typeof inspectorModeStore>) => {
      modeBindings.add(bound)
      bound.setMode(activeMode)
      bound.setPreset(activePreset)
      bound.setInspectorActive(ctx.layout.rightbarInfo.getSnapshot().owner === 'global')
      return {
        hooks: {
          activity: activityObserver.source,
        },
        switchMode,
        openRightbarTab: (kind: 'files' | 'terminal' | 'browser') => { openTabHandler?.(kind) },
        openResource: (address: string) => { openResourceHandler?.(address) },
        openSettings: () => { ctx.emit('ui-settings/open', 'general') },
        closeInspector: () => { ctx.layout.closeGlobalRightbar() },
      }
    },
  }, WorkTaskInspector))

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'workbench-starters',
    order: 5,
    locale: WORKBENCH_LOCALE_NS,
    inject: () => ({
      hooks: {
        workbenchMode: modeSource,
      },
    }),
  }, PromptStarters))

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'workbench-appearance',
    order: 12,
    store: settingsStore,
    locale: WORKBENCH_LOCALE_NS,
    inject: (bound: BoundActions<typeof settingsStore>) => {
      settingsBinding = bound
      bound.sync(activePreferences, settingsWritable)
      return {
        setDefaultMode: (defaultMode: WorkbenchMode) => {
          updatePreferences({ defaultMode })
        },
        setAccentPreset: (accentPreset: AccentPresetId) => {
          updatePreferences({ accentPreset })
        },
        setReducedTransparency: (reducedTransparency: boolean) => {
          updatePreferences({ reducedTransparency })
        },
        setReducedMotion: (reducedMotion: boolean) => {
          updatePreferences({ reducedMotion })
        },
        applyCustomThemeJson: (customThemeJson: string) => {
          updatePreferences({ customThemeJson, accentPreset: 'custom' })
        },
        resetCustomTheme: () => {
          updatePreferences({ customThemeJson: '', accentPreset: 'blue' })
        },
      }
    },
  }, WorkbenchAppearanceRow))
}
