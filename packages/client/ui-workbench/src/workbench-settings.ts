/**
 * Shared Workbench preferences, defaults, token presets, and strict Custom Theme
 * JSON validation shared across the Host schema and browser plugin runtime.
 */

export const WORKBENCH_SETTINGS_NAMESPACE = 'ui-workbench'
/** LocalStorage key used to cache validated Workbench preferences locally. */
export const WORKBENCH_LOCAL_STORAGE_KEY = 'dsh.workbench.preferences.v1'

/** Top-level Workbench shell modes (`Work` × `Code`). */
export const WORKBENCH_MODES = ['work', 'code'] as const
/** Union of supported Workbench shell modes. */
export type WorkbenchMode = typeof WORKBENCH_MODES[number]

/** Available Code-mode surface presets. */
export const CODE_PRESET_IDS = ['focus', 'build', 'review', 'debug'] as const
/** Union of supported Code-mode surface preset identifiers. */
export type CodePresetId = typeof CODE_PRESET_IDS[number]

/** Available Workbench accent color presets. */
export const ACCENT_PRESET_IDS = ['blue', 'graphite', 'amber', 'custom'] as const
/** Union of supported Workbench accent preset identifiers. */
export type AccentPresetId = typeof ACCENT_PRESET_IDS[number]

/** Default startup mode for fresh Workbench profiles. */
export const DEFAULT_WORKBENCH_MODE: WorkbenchMode = 'work'
/** Default right-rail preset active in Code mode. */
export const DEFAULT_CODE_PRESET: CodePresetId = 'focus'
/** Default Workbench accent preset. */
export const DEFAULT_ACCENT_PRESET: AccentPresetId = 'blue'

/** Maximum byte length accepted for imported Custom Theme JSON documents. */
export const CUSTOM_THEME_MAX_BYTES = 32_768

/** Persisted user preferences controlling Workbench mode, glass material, and custom theme JSON. */
export interface WorkbenchPreferences {
  readonly defaultMode: WorkbenchMode
  readonly accentPreset: AccentPresetId
  readonly reducedTransparency: boolean
  readonly reducedMotion: boolean
  readonly customThemeJson: string
}

/** Frozen baseline Workbench preferences applied when no overrides exist. */
export const DEFAULT_WORKBENCH_PREFERENCES: WorkbenchPreferences = Object.freeze({
  defaultMode: DEFAULT_WORKBENCH_MODE,
  accentPreset: DEFAULT_ACCENT_PRESET,
  reducedTransparency: false,
  reducedMotion: false,
  customThemeJson: '',
})

/** Allowed token keys mapped cleanly to DSH `--dsw-*` / Workbench `--wb-*` vars. */
export const CUSTOM_THEME_TOKEN_MAP = Object.freeze({
  accent: { kind: 'color', cssVars: ['--wb-accent', '--dsw-alias-brand-primary', '--dsw-alias-link', '--dsw-alias-state-business-primary'] },
  accentSoft: { kind: 'color', cssVars: ['--wb-accent-tint', '--dsw-alias-state-business-tertiary'] },
  accentText: { kind: 'color', cssVars: ['--wb-accent-ink'] },
  surfaceBase: { kind: 'color', cssVars: ['--dsw-alias-bg-base'] },
  surfaceLayer1: { kind: 'color', cssVars: ['--dsw-alias-bg-layer-1'] },
  surfaceLayer2: { kind: 'color', cssVars: ['--dsw-alias-bg-layer-2'] },
  surfaceGlass: { kind: 'color', cssVars: ['--wb-glass-surface'] },
  surfaceGlassElevated: { kind: 'color', cssVars: ['--wb-glass-elevated'] },
  labelPrimary: { kind: 'color', cssVars: ['--dsw-alias-label-primary'] },
  labelSecondary: { kind: 'color', cssVars: ['--dsw-alias-label-secondary'] },
  borderHairline: { kind: 'color', cssVars: ['--wb-glass-border', '--dsw-alias-border-l2'] },
  glassBlur: { kind: 'length', cssVars: ['--wb-blur'] },
  panelRadius: { kind: 'length', cssVars: ['--wb-radius-panel'] },
} as const)

/** Supported token keys mapped inside `CUSTOM_THEME_TOKEN_MAP`. */
export type CustomThemeTokenKey = keyof typeof CUSTOM_THEME_TOKEN_MAP

/** Appearance polarity targeted by a Custom Theme JSON definition. */
export type CustomThemeAppearance = 'light' | 'dark' | 'both'

/** Normalized and schema-validated Custom Theme JSON document. */
export interface ValidatedCustomTheme {
  readonly version: 1
  readonly name: string
  readonly appearance: CustomThemeAppearance
  readonly tokens: Readonly<Partial<Record<CustomThemeTokenKey, string>>>
}

/** Machine-readable validation error codes returned by `parseCustomThemeJson`. */
export type CustomThemeErrorCode =
  | 'empty'
  | 'too-large'
  | 'invalid-json'
  | 'not-object'
  | 'invalid-name'
  | 'invalid-appearance'
  | 'missing-tokens'
  | 'empty-tokens'
  | 'unsupported-token'
  | 'invalid-token-value'

/** Discriminated result produced when parsing Custom Theme JSON input. */
export type CustomThemeParseResult =
  | { readonly ok: true; readonly theme: ValidatedCustomTheme; readonly normalizedJson: string }
  | { readonly ok: false; readonly code: CustomThemeErrorCode; readonly token?: string }

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const FUNC_COLOR = /^(?:rgb|rgba|hsl|hsla|oklch|oklab|color-mix)\([^;{}<>]{1,160}\)$/i
const SAFE_LENGTH = /^(?:0|[1-9]\d{0,2}(?:\.\d{1,2})?px)$/
const UNSAFE_CSS = /[;{}<>]|url\s*\(|expression\s*\(|var\s*\(|@import|[\u0000-\u001F\u007F]/i

/**
 * Strict validator for user-supplied CSS color literals (no variables/functions with injection vectors).
 * @param value Candidate value to validate as a safe CSS color string.
 * @returns `true` when `value` is a safe hex or functional color literal.
 */
export function isValidCssColor(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 180 || UNSAFE_CSS.test(trimmed)) return false
  if (!HEX_COLOR.test(trimmed) && !FUNC_COLOR.test(trimmed)) return false
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', trimmed)
  }
  return true
}

/**
 * Strict validator for px length values (`0` or `Npx`, capped at 999px).
 * @param value Candidate value to validate as a safe CSS length in pixels.
 * @returns `true` when `value` matches an allowed pixel length literal.
 */
export function isValidCssLength(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return !UNSAFE_CSS.test(trimmed) && SAFE_LENGTH.test(trimmed)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

/**
 * Parse and strictly validate an imported Custom Theme JSON document.
 * Rejects oversized payloads, unsupported keys, malformed colors/lengths, and CSS injection tokens.
 * @param raw Raw JSON string provided by the user or restored from settings.
 * @returns Discriminated validation result with normalized JSON when valid.
 */
export function parseCustomThemeJson(raw: string): CustomThemeParseResult {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return { ok: false, code: 'empty' }
  if (trimmed.length > CUSTOM_THEME_MAX_BYTES) return { ok: false, code: 'too-large' }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { ok: false, code: 'invalid-json' }
  }
  if (!isPlainRecord(parsed)) return { ok: false, code: 'not-object' }

  const nameRaw = parsed.name
  let name = 'Custom Workbench'
  if (nameRaw !== undefined) {
    if (typeof nameRaw !== 'string' || nameRaw.trim().length === 0 || nameRaw.trim().length > 64) {
      return { ok: false, code: 'invalid-name' }
    }
    name = nameRaw.trim()
  }

  const appearanceRaw = parsed.appearance
  let appearance: CustomThemeAppearance = 'both'
  if (appearanceRaw !== undefined) {
    if (appearanceRaw !== 'light' && appearanceRaw !== 'dark' && appearanceRaw !== 'both') {
      return { ok: false, code: 'invalid-appearance' }
    }
    appearance = appearanceRaw
  }

  if (!isPlainRecord(parsed.tokens)) return { ok: false, code: 'missing-tokens' }

  const entries = Object.entries(parsed.tokens)
  if (entries.length === 0) return { ok: false, code: 'empty-tokens' }

  const validatedTokens: Partial<Record<CustomThemeTokenKey, string>> = {}
  for (const [key, rawValue] of entries) {
    if (!Object.hasOwn(CUSTOM_THEME_TOKEN_MAP, key)) {
      return { ok: false, code: 'unsupported-token', token: key }
    }
    const spec = CUSTOM_THEME_TOKEN_MAP[key as CustomThemeTokenKey]
    const valid = spec.kind === 'color' ? isValidCssColor(rawValue) : isValidCssLength(rawValue)
    if (!valid) {
      return { ok: false, code: 'invalid-token-value', token: key }
    }
    validatedTokens[key as CustomThemeTokenKey] = (rawValue as string).trim()
  }

  const theme: ValidatedCustomTheme = {
    version: 1,
    name,
    appearance,
    tokens: validatedTokens,
  }
  return {
    ok: true,
    theme,
    normalizedJson: JSON.stringify(theme, null, 2),
  }
}

/** Sample Custom Theme JSON starter displayed in the Settings JSON editor. */
export const SAMPLE_CUSTOM_THEME_JSON = JSON.stringify({
  version: 1,
  name: 'Cupertino Mist',
  appearance: 'both',
  tokens: {
    accent: '#0A84FF',
    accentSoft: 'rgba(10, 132, 255, 0.14)',
    accentText: '#FFFFFF',
    borderHairline: 'rgba(60, 60, 67, 0.16)',
  },
}, null, 2)

/** Light/dark color pair consumed by the DSH runtime theme override registry. */
export interface AccentPaletteModes {
  readonly light: string
  readonly dark: string
}

const ACCENT_PALETTES: Readonly<Record<Exclude<AccentPresetId, 'custom'>, {
  readonly accent: AccentPaletteModes
  readonly tint: AccentPaletteModes
  readonly ink: AccentPaletteModes
}>> = {
  blue: {
    accent: { light: '#007AFF', dark: '#0A84FF' },
    tint: { light: 'rgba(0, 122, 255, 0.12)', dark: 'rgba(10, 132, 255, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#FFFFFF' },
  },
  graphite: {
    accent: { light: '#4B5563', dark: '#9CA3AF' },
    tint: { light: 'rgba(75, 85, 99, 0.12)', dark: 'rgba(156, 163, 175, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#0F172A' },
  },
  amber: {
    accent: { light: '#C25E00', dark: '#FF9F0A' },
    tint: { light: 'rgba(194, 94, 0, 0.12)', dark: 'rgba(255, 159, 10, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#1C1917' },
  },
}

/**
 * Build theme token overrides (`{ light, dark }` pairs required by `ui-theme`).
 * @param prefs Normalized Workbench preferences including active accent and custom theme JSON.
 * @returns Map of CSS variable names to `{ light, dark }` values.
 */
export function buildWorkbenchTokenOverrides(
  prefs: WorkbenchPreferences,
): Record<string, { light: string; dark: string }> {
  const palette = prefs.accentPreset === 'custom' ? ACCENT_PALETTES.blue : ACCENT_PALETTES[prefs.accentPreset]
  const blur = prefs.reducedTransparency ? '0px' : '20px'
  const overrides: Record<string, { light: string; dark: string }> = {
    '--wb-accent': { ...palette.accent },
    '--wb-accent-tint': { ...palette.tint },
    '--wb-accent-ink': { ...palette.ink },
    '--wb-blur': { light: blur, dark: blur },
    '--wb-radius-pill': { light: '999px', dark: '999px' },
    '--wb-radius-panel': { light: '18px', dark: '18px' },
    '--wb-radius-card': { light: '14px', dark: '14px' },
    '--wb-glass-surface': prefs.reducedTransparency
      ? { light: 'var(--dsw-alias-bg-layer-1)', dark: 'var(--dsw-alias-bg-layer-1)' }
      : { light: 'rgba(255, 255, 255, 0.72)', dark: 'rgba(28, 30, 36, 0.72)' },
    '--wb-glass-elevated': prefs.reducedTransparency
      ? { light: 'var(--dsw-alias-bg-layer-2)', dark: 'var(--dsw-alias-bg-layer-2)' }
      : { light: 'rgba(255, 255, 255, 0.86)', dark: 'rgba(38, 40, 48, 0.84)' },
    '--wb-glass-rim': prefs.reducedTransparency
      ? { light: 'none', dark: 'none' }
      : { light: 'inset 0 1px 0 rgba(255, 255, 255, 0.78)', dark: 'inset 0 1px 0 rgba(255, 255, 255, 0.09)' },
    '--wb-glass-border': { light: 'rgba(15, 23, 42, 0.08)', dark: 'rgba(255, 255, 255, 0.11)' },
    '--wb-glass-shadow': {
      light: '0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px -12px rgba(15, 23, 42, 0.12)',
      dark: '0 1px 2px rgba(0, 0, 0, 0.25), 0 14px 36px -14px rgba(0, 0, 0, 0.56)',
    },
    '--wb-ambient-bg': prefs.reducedTransparency
      ? { light: 'none', dark: 'none' }
      : {
        light: 'radial-gradient(960px 540px at 82% -10%, rgba(10, 132, 255, 0.07), transparent 64%),'
          + ' radial-gradient(760px 440px at 14% 110%, rgba(99, 102, 241, 0.05), transparent 62%)',
        dark: 'radial-gradient(960px 540px at 84% -8%, rgba(10, 132, 255, 0.10), transparent 64%),'
          + ' radial-gradient(760px 440px at 12% 112%, rgba(94, 92, 230, 0.08), transparent 62%)',
      },
    '--dsw-alias-brand-primary': { ...palette.accent },
    '--dsw-alias-link': { ...palette.accent },
    '--dsw-alias-state-business-primary': { ...palette.accent },
    '--dsw-alias-state-business-tertiary': { ...palette.tint },
  }

  if (prefs.accentPreset === 'custom' && prefs.customThemeJson.trim().length > 0) {
    const parsed = parseCustomThemeJson(prefs.customThemeJson)
    if (parsed.ok) {
      const { appearance, tokens } = parsed.theme
      for (const [key, value] of Object.entries(tokens)) {
        const spec = CUSTOM_THEME_TOKEN_MAP[key as CustomThemeTokenKey]
        for (const cssVar of spec.cssVars) {
          const existing = overrides[cssVar]
          if (appearance === 'both') {
            overrides[cssVar] = { light: value, dark: value }
          } else if (appearance === 'light') {
            overrides[cssVar] = { light: value, dark: existing?.dark ?? value }
          } else {
            overrides[cssVar] = { light: existing?.light ?? value, dark: value }
          }
        }
      }
    }
  }

  if (prefs.reducedTransparency) {
    overrides['--wb-blur'] = { light: '0px', dark: '0px' }
    overrides['--wb-glass-surface'] = { light: 'var(--dsw-alias-bg-layer-1)', dark: 'var(--dsw-alias-bg-layer-1)' }
    overrides['--wb-glass-elevated'] = { light: 'var(--dsw-alias-bg-layer-2)', dark: 'var(--dsw-alias-bg-layer-2)' }
    overrides['--wb-glass-rim'] = { light: 'none', dark: 'none' }
    overrides['--wb-ambient-bg'] = { light: 'none', dark: 'none' }
  }
  return overrides
}

/** Normalize raw persisted section / JSON values into a safe `WorkbenchPreferences`. */
/**
 * Normalize raw persisted settings objects into a valid `WorkbenchPreferences` snapshot.
 * @param raw Untrusted object parsed from host settings or `localStorage`.
 * @returns Sanitized immutable Workbench preferences with invalid custom themes stripped.
 */
export function normalizeWorkbenchPreferences(raw: unknown): WorkbenchPreferences {
  if (!isPlainRecord(raw)) return DEFAULT_WORKBENCH_PREFERENCES
  const defaultMode: WorkbenchMode = raw.defaultMode === 'code' ? 'code' : 'work'
  const accentPreset: AccentPresetId = ACCENT_PRESET_IDS.includes(raw.accentPreset as AccentPresetId)
    ? (raw.accentPreset as AccentPresetId)
    : DEFAULT_ACCENT_PRESET
  const reducedTransparency = typeof raw.reducedTransparency === 'boolean' ? raw.reducedTransparency : false
  const reducedMotion = typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : false
  let customThemeJson = ''
  if (typeof raw.customThemeJson === 'string' && raw.customThemeJson.trim().length > 0) {
    const validated = parseCustomThemeJson(raw.customThemeJson)
    if (validated.ok) customThemeJson = validated.normalizedJson
  }
  return Object.freeze({
    defaultMode,
    accentPreset: accentPreset === 'custom' && customThemeJson === '' ? DEFAULT_ACCENT_PRESET : accentPreset,
    reducedTransparency,
    reducedMotion,
    customThemeJson,
  })
}
