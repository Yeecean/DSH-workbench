/** Host plugin entry declaring durable Workbench appearance and mode defaults. */

import type {} from '@deepseek-ai/dsh-settings'
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  ACCENT_PRESET_IDS,
  DEFAULT_ACCENT_PRESET,
  DEFAULT_WORKBENCH_MODE,
  WORKBENCH_MODES,
  type AccentPresetId,
  type WorkbenchMode,
} from './workbench-settings.ts'

/** Workbench appearance and mode preferences projected to the browser. */
export interface Config {
  /** Preferred mode selected on client startup (`'work'` or `'code'`). */
  defaultMode: Volatile<WorkbenchMode>
  /** Selected accent preset or validated `'custom'` theme JSON layer. */
  accentPreset: Volatile<AccentPresetId>
  /** Disable frosted glass translucency filters for higher visual contrast. */
  reducedTransparency: Volatile<boolean>
  /** Minimize shell animations and glass shimmer transitions. */
  reducedMotion: Volatile<boolean>
  /** Normalized Custom Theme JSON string validated on import. */
  customThemeJson: Volatile<string>
}

/** Schemastery schema validating durable Workbench settings on the Host. */
export const Config = z.object({
  defaultMode: z.union(WORKBENCH_MODES.map(value => z.const(value))).default(DEFAULT_WORKBENCH_MODE).volatile(),
  accentPreset: z.union(ACCENT_PRESET_IDS.map(value => z.const(value))).default(DEFAULT_ACCENT_PRESET).volatile(),
  reducedTransparency: z.boolean().default(false).volatile(),
  reducedMotion: z.boolean().default(false).volatile(),
  customThemeJson: z.string().default('').volatile(),
})

/** Register the `ui-workbench` user-settings namespace without generating a fallback form page. */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
}
