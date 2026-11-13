/** Store factories for Workbench mode switching, global inspector, and theme settings. */

import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import {
  DEFAULT_CODE_PRESET,
  DEFAULT_WORKBENCH_MODE,
  DEFAULT_WORKBENCH_PREFERENCES,
  WORKBENCH_LOCAL_STORAGE_KEY,
  normalizeWorkbenchPreferences,
  type CodePresetId,
  type WorkbenchMode,
  type WorkbenchPreferences,
} from '../workbench-settings.ts'

/** Synchronized shell mode state projected to `ModeSwitcher` and `WorkTaskInspector`. */
export interface WorkbenchModeState {
  mode: WorkbenchMode
  preset: CodePresetId
  inspectorActive: boolean
}

type ModeSwitcherActions = {
  setMode: (draft: WorkbenchModeState, mode: WorkbenchMode) => void
  setPreset: (draft: WorkbenchModeState, preset: CodePresetId) => void
  setInspectorActive: (draft: WorkbenchModeState, inspectorActive: boolean) => void
}

/**
 * Declares the shared Work × Code mode and inspector store handle.
 * @returns One root-scoped store handle synchronizing mode, preset, and inspector state.
 */
export function createModeSwitcherStore(): EngineStoreHandle<WorkbenchModeState, ModeSwitcherActions> {
  return defineStore({
    init: (): WorkbenchModeState => ({
      mode: DEFAULT_WORKBENCH_MODE,
      preset: DEFAULT_CODE_PRESET,
      inspectorActive: false,
    }),
    actions: {
      setMode: (d, mode: WorkbenchMode) => {
        if (d.mode !== mode) d.mode = mode
      },
      setPreset: (d, preset: CodePresetId) => {
        if (d.preset !== preset) d.preset = preset
      },
      setInspectorActive: (d, inspectorActive: boolean) => {
        if (d.inspectorActive !== inspectorActive) d.inspectorActive = inspectorActive
      },
    },
  })
}

/** Synchronized settings state projected to `WorkbenchAppearanceRow`. */
export interface WorkbenchSettingsRowState {
  preferences: WorkbenchPreferences
  writable: boolean
}

type WorkbenchSettingsRowActions = {
  sync: (draft: WorkbenchSettingsRowState, preferences: WorkbenchPreferences, writable: boolean) => void
}

/**
 * Declares the General Settings appearance/theme row store handle.
 * @returns One root-scoped store handle projecting persisted preferences and writability.
 */
export function createWorkbenchSettingsStore(): EngineStoreHandle<WorkbenchSettingsRowState, WorkbenchSettingsRowActions> {
  return defineStore({
    init: (): WorkbenchSettingsRowState => ({
      preferences: DEFAULT_WORKBENCH_PREFERENCES,
      writable: true,
    }),
    actions: {
      sync: (d, preferences: WorkbenchPreferences, writable: boolean) => {
        const current = d.preferences
        if (d.writable === writable
          && current.defaultMode === preferences.defaultMode
          && current.accentPreset === preferences.accentPreset
          && current.reducedTransparency === preferences.reducedTransparency
          && current.reducedMotion === preferences.reducedMotion
          && current.customThemeJson === preferences.customThemeJson) {
          return
        }
        d.preferences = preferences
        d.writable = writable
      },
    },
  })
}

/**
 * Read persisted fallback preferences from localStorage (SSR & jsdom safe).
 * @returns Validated Workbench preferences when present, or `undefined` if unavailable/corrupt.
 */
export function readLocalWorkbenchPreferences(): WorkbenchPreferences | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined
    const raw = localStorage.getItem(WORKBENCH_LOCAL_STORAGE_KEY)
    if (raw === null) return undefined
    return normalizeWorkbenchPreferences(JSON.parse(raw))
  } catch {
    return undefined
  }
}

/**
 * Write validated fallback preferences to localStorage (never throws in restricted sandboxes).
 * @param prefs Normalized Workbench preferences to persist locally.
 */
export function writeLocalWorkbenchPreferences(prefs: WorkbenchPreferences): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(WORKBENCH_LOCAL_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage quota/privacy failures.
  }
}
