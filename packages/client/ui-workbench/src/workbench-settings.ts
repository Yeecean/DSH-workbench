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
/** Default Liquid Glass backdrop blur radius when transparency is enabled. */
export const DEFAULT_GLASS_BLUR = '28px'
const DEFAULT_GLASS_BACKDROP = 'blur(var(--wb-blur)) saturate(185%) contrast(103%)'

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
const SAFE_LENGTH = /^(?:0(?:px)?|0\.\d{1,2}px|[1-9]\d{0,2}(?:\.\d{1,2})?px)$/
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
 * Strict validator for px length values (`0`, `0px`, or `Npx`, capped at 999.99px).
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
  readonly ambient: AccentPaletteModes
}>> = {
  blue: {
    accent: { light: '#007AFF', dark: '#0A84FF' },
    tint: { light: 'rgba(0, 122, 255, 0.12)', dark: 'rgba(10, 132, 255, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#FFFFFF' },
    ambient: {
      light: 'radial-gradient(1120px 680px at 84% -8%, rgba(56, 152, 255, 0.24), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(45, 212, 191, 0.16), transparent 60%),'
        + ' radial-gradient(660px 460px at 22% 8%, rgba(129, 140, 248, 0.14), transparent 64%),'
        + ' linear-gradient(155deg, #d8e6f7 0%, #e9f0f9 48%, #f4f7fc 100%)',
      dark: 'radial-gradient(1120px 680px at 84% -8%, rgba(48, 140, 255, 0.26), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(20, 184, 166, 0.16), transparent 60%),'
        + ' radial-gradient(660px 460px at 22% 8%, rgba(99, 102, 241, 0.18), transparent 64%),'
        + ' linear-gradient(155deg, #162033 0%, #101622 48%, #0b0f17 100%)',
    },
  },
  graphite: {
    accent: { light: '#4B5563', dark: '#9CA3AF' },
    tint: { light: 'rgba(75, 85, 99, 0.12)', dark: 'rgba(156, 163, 175, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#0F172A' },
    ambient: {
      light: 'radial-gradient(1120px 680px at 84% -8%, rgba(100, 116, 139, 0.20), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(148, 163, 184, 0.16), transparent 60%),'
        + ' linear-gradient(155deg, #dfe5ee 0%, #edf1f6 52%, #f5f7fa 100%)',
      dark: 'radial-gradient(1120px 680px at 84% -8%, rgba(148, 163, 184, 0.16), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(71, 85, 105, 0.18), transparent 60%),'
        + ' linear-gradient(155deg, #191d26 0%, #12151d 52%, #0c0e14 100%)',
    },
  },
  amber: {
    accent: { light: '#C25E00', dark: '#FF9F0A' },
    tint: { light: 'rgba(194, 94, 0, 0.12)', dark: 'rgba(255, 159, 10, 0.18)' },
    ink: { light: '#FFFFFF', dark: '#1C1917' },
    ambient: {
      light: 'radial-gradient(1120px 680px at 84% -8%, rgba(245, 158, 11, 0.18), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(56, 189, 248, 0.12), transparent 60%),'
        + ' linear-gradient(155deg, #f3e9dc 0%, #f5f1eb 52%, #f8f6f2 100%)',
      dark: 'radial-gradient(1120px 680px at 84% -8%, rgba(245, 158, 11, 0.20), transparent 62%),'
        + ' radial-gradient(880px 580px at 10% 106%, rgba(59, 130, 246, 0.14), transparent 60%),'
        + ' linear-gradient(155deg, #211a14 0%, #161311 52%, #0d0c0b 100%)',
    },
  },
}

const SOLID_COMPOSER_SEAT_BG = 'linear-gradient('
  + '180deg, color-mix(in srgb, var(--dsw-alias-bg-base) 0%, transparent) 0px, var(--dsw-alias-bg-base) 36px)'

function applySurfaceTransparencyMode(
  overrides: Record<string, { light: string; dark: string }>,
  ambient: AccentPaletteModes,
  reduced: boolean,
): void {
  if (reduced) {
    overrides['--wb-blur'] = { light: '0px', dark: '0px' }
    overrides['--wb-glass-backdrop'] = { light: 'none', dark: 'none' }
    overrides['--wb-glass-modal-backdrop'] = { light: 'none', dark: 'none' }
    overrides['--wb-glass-mask-backdrop'] = { light: 'var(--dsw-mask-blur)', dark: 'var(--dsw-mask-blur)' }
    overrides['--wb-glass-surface'] = { light: 'var(--dsw-alias-bg-layer-1)', dark: 'var(--dsw-alias-bg-layer-1)' }
    overrides['--wb-glass-elevated'] = { light: 'var(--dsw-alias-bg-layer-2)', dark: 'var(--dsw-alias-bg-layer-2)' }
    overrides['--wb-glass-chrome'] = { light: 'var(--dsw-alias-bg-layer-2)', dark: 'var(--dsw-alias-bg-layer-2)' }
    overrides['--wb-glass-sheen'] = { light: 'none', dark: 'none' }
    overrides['--wb-glass-rim'] = { light: 'none', dark: 'none' }
    overrides['--wb-glass-border'] = { light: 'var(--dsw-alias-border-l2)', dark: 'var(--dsw-alias-border-l2)' }
    overrides['--wb-glass-panel-shadow'] = { light: 'none', dark: 'none' }
    overrides['--wb-glass-composer-shadow'] = { light: 'var(--dsw-elevation-soft)', dark: 'var(--dsw-elevation-soft)' }
    overrides['--wb-ambient-bg'] = { light: 'none', dark: 'none' }
    overrides['--wb-shell-frame-bg'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-shell-titlebar-bg'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-windows-caption-bg'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-shell-sidebar-col-bg'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-shell-sidebar-bg'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-shell-sidebar-fade'] = {
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    }
    overrides['--wb-shell-sidebar-cta-bg'] = {
      light: 'var(--dsw-alias-button-elevated-fill)',
      dark: 'var(--dsw-alias-button-elevated-fill)',
    }
    overrides['--wb-shell-sidebar-cta-hover'] = {
      light: 'var(--dsw-alias-button-floating-hover)',
      dark: 'var(--dsw-alias-button-floating-hover)',
    }
    overrides['--wb-shell-center-col-bg'] = { light: 'var(--dsw-alias-bg-base)', dark: 'var(--dsw-alias-bg-base)' }
    overrides['--wb-shell-center-bg'] = { light: 'var(--dsw-alias-bg-base)', dark: 'var(--dsw-alias-bg-base)' }
    overrides['--wb-shell-header-bg'] = { light: 'transparent', dark: 'transparent' }
    overrides['--wb-shell-composer-seat-bg'] = {
      light: SOLID_COMPOSER_SEAT_BG,
      dark: SOLID_COMPOSER_SEAT_BG,
    }
    overrides['--wb-shell-composer-bg'] = {
      light: 'var(--dsw-specific-input-major)',
      dark: 'var(--dsw-specific-input-major)',
    }
    overrides['--wb-shell-rightbar-bg'] = { light: 'var(--dsw-alias-bg-base)', dark: 'var(--dsw-alias-bg-base)' }
    overrides['--wb-shell-user-bubble-bg'] = {
      light: 'var(--dsw-specific-bubble)',
      dark: 'var(--dsw-specific-bubble)',
    }
    overrides['--wb-shell-floating-btn-bg'] = {
      light: 'var(--dsw-alias-button-floating-fill)',
      dark: 'var(--dsw-alias-button-floating-fill)',
    }
    overrides['--wb-shell-modal-bg'] = { light: 'var(--dsw-alias-bg-layer-2)', dark: 'var(--dsw-alias-bg-layer-2)' }
    overrides['--wb-shell-sticky-row-bg'] = { light: 'var(--dsw-alias-bg-base)', dark: 'var(--dsw-alias-bg-base)' }
    return
  }

  overrides['--wb-blur'] = { light: DEFAULT_GLASS_BLUR, dark: DEFAULT_GLASS_BLUR }
  // Derive backdrop from `--wb-blur` on `body` so ThemePresenter resolves custom blur instead of `:root` defaults.
  overrides['--wb-glass-backdrop'] = {
    light: DEFAULT_GLASS_BACKDROP,
    dark: DEFAULT_GLASS_BACKDROP,
  }
  overrides['--wb-glass-modal-backdrop'] = {
    light: 'blur(36px) saturate(195%) contrast(104%)',
    dark: 'blur(36px) saturate(195%) contrast(104%)',
  }
  overrides['--wb-glass-mask-backdrop'] = {
    light: 'blur(14px) saturate(140%)',
    dark: 'blur(14px) saturate(140%)',
  }
  overrides['--wb-glass-surface'] = {
    light: 'rgba(248, 251, 255, 0.58)',
    dark: 'rgba(24, 30, 42, 0.58)',
  }
  overrides['--wb-glass-elevated'] = {
    light: 'rgba(255, 255, 255, 0.78)',
    dark: 'rgba(30, 38, 54, 0.74)',
  }
  overrides['--wb-glass-chrome'] = {
    light: 'rgba(246, 250, 255, 0.62)',
    dark: 'rgba(22, 29, 43, 0.62)',
  }
  overrides['--wb-glass-sheen'] = {
    light: 'linear-gradient(155deg, rgba(255, 255, 255, 0.52) 0%, '
      + 'rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.24) 100%)',
    dark: 'linear-gradient(155deg, rgba(255, 255, 255, 0.11) 0%, '
      + 'rgba(255, 255, 255, 0.015) 45%, rgba(255, 255, 255, 0.05) 100%)',
  }
  overrides['--wb-glass-rim'] = {
    light: 'inset 0 1px 0 rgba(255, 255, 255, 0.94), inset 0 -0.5px 0 rgba(15, 23, 42, 0.05)',
    dark: 'inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -0.5px 0 rgba(255, 255, 255, 0.05)',
  }
  overrides['--wb-glass-border'] = {
    light: 'rgba(255, 255, 255, 0.72)',
    dark: 'rgba(255, 255, 255, 0.14)',
  }
  overrides['--wb-glass-panel-shadow'] = {
    light: '0 1px 2px rgba(15, 23, 42, 0.05), 0 12px 32px -12px rgba(15, 23, 42, 0.14)',
    dark: '0 1px 2px rgba(0, 0, 0, 0.35), 0 18px 42px -16px rgba(0, 0, 0, 0.68)',
  }
  overrides['--wb-glass-composer-shadow'] = {
    light: 'inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 0 0 0.5px rgba(255, 255, 255, 0.78), '
      + '0 2px 6px rgba(15, 23, 42, 0.06), 0 14px 36px -12px rgba(15, 23, 42, 0.16)',
    dark: 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 0 0.5px rgba(255, 255, 255, 0.16), '
      + '0 2px 6px rgba(0, 0, 0, 0.35), 0 18px 44px -14px rgba(0, 0, 0, 0.72)',
  }
  overrides['--wb-ambient-bg'] = { ...ambient }
  overrides['--wb-shell-frame-bg'] = { ...ambient }
  overrides['--wb-shell-titlebar-bg'] = {
    light: 'rgba(246, 249, 254, 0.36)',
    dark: 'rgba(18, 24, 36, 0.40)',
  }
  overrides['--wb-windows-caption-bg'] = { light: 'transparent', dark: 'transparent' }
  overrides['--wb-shell-sidebar-col-bg'] = { light: 'transparent', dark: 'transparent' }
  overrides['--wb-shell-sidebar-bg'] = {
    light: 'rgba(248, 251, 255, 0.56)',
    dark: 'rgba(22, 29, 43, 0.56)',
  }
  overrides['--wb-shell-sidebar-fade'] = { light: 'transparent', dark: 'transparent' }
  overrides['--wb-shell-sidebar-cta-bg'] = {
    light: 'rgba(255, 255, 255, 0.74)',
    dark: 'rgba(255, 255, 255, 0.09)',
  }
  overrides['--wb-shell-sidebar-cta-hover'] = {
    light: 'rgba(255, 255, 255, 0.92)',
    dark: 'rgba(255, 255, 255, 0.15)',
  }
  overrides['--wb-shell-center-col-bg'] = {
    light: 'rgba(255, 255, 255, 0.16)',
    dark: 'rgba(12, 17, 27, 0.18)',
  }
  overrides['--wb-shell-center-bg'] = {
    light: 'rgba(255, 255, 255, 0.14)',
    dark: 'rgba(12, 17, 27, 0.16)',
  }
  overrides['--wb-shell-header-bg'] = {
    light: 'rgba(248, 251, 255, 0.54)',
    dark: 'rgba(22, 28, 42, 0.54)',
  }
  overrides['--wb-shell-composer-seat-bg'] = { light: 'transparent', dark: 'transparent' }
  overrides['--wb-shell-composer-bg'] = {
    light: 'rgba(255, 255, 255, 0.64)',
    dark: 'rgba(26, 33, 48, 0.62)',
  }
  overrides['--wb-shell-rightbar-bg'] = {
    light: 'rgba(248, 251, 255, 0.56)',
    dark: 'rgba(22, 29, 43, 0.58)',
  }
  overrides['--wb-shell-user-bubble-bg'] = {
    light: 'rgba(224, 237, 255, 0.72)',
    dark: 'rgba(34, 52, 82, 0.68)',
  }
  overrides['--wb-shell-floating-btn-bg'] = {
    light: 'rgba(255, 255, 255, 0.76)',
    dark: 'rgba(32, 40, 56, 0.78)',
  }
  overrides['--wb-shell-modal-bg'] = {
    light: 'rgba(250, 252, 255, 0.78)',
    dark: 'rgba(24, 30, 44, 0.80)',
  }
  overrides['--wb-shell-sticky-row-bg'] = {
    light: 'rgba(246, 250, 255, 0.74)',
    dark: 'rgba(18, 24, 36, 0.76)',
  }
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
  const overrides: Record<string, { light: string; dark: string }> = {
    '--wb-accent': { ...palette.accent },
    '--wb-accent-tint': { ...palette.tint },
    '--wb-accent-ink': { ...palette.ink },
    '--wb-radius-pill': { light: '999px', dark: '999px' },
    '--wb-radius-panel': { light: '18px', dark: '18px' },
    '--wb-radius-card': { light: '14px', dark: '14px' },
    '--wb-radius-composer': { light: '20px', dark: '20px' },
    '--wb-radius-modal': { light: '22px', dark: '22px' },
    '--wb-glass-shadow': {
      light: '0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px -12px rgba(15, 23, 42, 0.12)',
      dark: '0 1px 2px rgba(0, 0, 0, 0.25), 0 14px 36px -14px rgba(0, 0, 0, 0.56)',
    },
    '--dsw-alias-brand-primary': { ...palette.accent },
    '--dsw-alias-link': { ...palette.accent },
    '--dsw-alias-state-business-primary': { ...palette.accent },
    '--dsw-alias-state-business-tertiary': { ...palette.tint },
  }

  applySurfaceTransparencyMode(overrides, palette.ambient, prefs.reducedTransparency)

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
    applySurfaceTransparencyMode(overrides, palette.ambient, true)
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
