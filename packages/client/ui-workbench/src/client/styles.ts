/** Lifecycle-managed Liquid Glass stylesheet and document attribute presenter. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import {
  buildWorkbenchTokenOverrides,
  type CodePresetId,
  type WorkbenchMode,
  type WorkbenchPreferences,
} from '../workbench-settings.ts'

const STYLE_TAG_SELECTOR = 'style[data-plugin-css="@deepseek-ai/dsh-client-ui-workbench/glass"]'

/** Snapshot of document-level Workbench visual attributes and preferences. */
export interface WorkbenchVisualState {
  readonly mode: WorkbenchMode
  readonly preset: CodePresetId
  readonly preferences: WorkbenchPreferences
}

/**
 * Mount the Workbench glass token stylesheet and return an updater/disposer
 * so document datasets and theme token layers clean up on plugin unload.
 * @param ctx Cordis plugin client context providing access to the optional theme service.
 * @param glassCss Inlined Liquid Glass token stylesheet string bundled into `client.js`.
 * @returns Controller with `syncVisuals` to apply DOM/theme state and `dispose` for cleanup.
 */
export function installWorkbenchStyles(ctx: Context, glassCss: string): {
  syncVisuals: (state: WorkbenchVisualState) => void
  dispose: () => void
} {
  let ownedTag: HTMLStyleElement | undefined
  let tokenLayer: (() => void) | undefined

  if (typeof document !== 'undefined' && document.querySelector(STYLE_TAG_SELECTOR) === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-workbench'
    tag.dataset.pluginCss = '@deepseek-ai/dsh-client-ui-workbench/glass'
    tag.textContent = glassCss
    document.head.appendChild(tag)
    ownedTag = tag
  }

  const syncVisuals = (state: WorkbenchVisualState): void => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.dataset.dshWorkbench = '1'
      root.dataset.workbenchMode = state.mode
      root.dataset.workbenchPreset = state.preset
      root.dataset.workbenchAccent = state.preferences.accentPreset
      root.dataset.workbenchReducedTransparency = String(state.preferences.reducedTransparency)
      root.dataset.workbenchReducedMotion = String(state.preferences.reducedMotion)
    }
    const themeService = ctx.get('theme')
    if (themeService?.overrideTokens !== undefined) {
      tokenLayer?.()
      tokenLayer = themeService.overrideTokens(
        '@deepseek-ai/dsh-client-ui-workbench',
        buildWorkbenchTokenOverrides(state.preferences),
      )
    }
  }

  const dispose = (): void => {
    tokenLayer?.()
    tokenLayer = undefined
    ownedTag?.remove()
    ownedTag = undefined
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      delete root.dataset.dshWorkbench
      delete root.dataset.workbenchMode
      delete root.dataset.workbenchPreset
      delete root.dataset.workbenchAccent
      delete root.dataset.workbenchReducedTransparency
      delete root.dataset.workbenchReducedMotion
    }
  }

  ctx.effect(() => dispose, 'ui-workbench: styles & theme tokens')
  return { syncVisuals, dispose }
}
