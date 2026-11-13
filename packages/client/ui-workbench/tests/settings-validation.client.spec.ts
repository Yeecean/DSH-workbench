import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOM_THEME_MAX_BYTES,
  DEFAULT_WORKBENCH_PREFERENCES,
  SAMPLE_CUSTOM_THEME_JSON,
  buildWorkbenchTokenOverrides,
  normalizeWorkbenchPreferences,
  parseCustomThemeJson,
} from '../src/workbench-settings.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseCustomThemeJson', () => {
  it('validates, trims, and normalizes supported theme JSON', () => {
    const raw = JSON.stringify({
      name: '  Copper Twilight  ',
      appearance: 'dark',
      tokens: {
        accent: '  #FF9F0A ',
        surfaceBase: 'rgb(18, 20, 26)',
        glassBlur: '24px',
        panelRadius: '18px',
      },
    })
    const result = parseCustomThemeJson(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected valid theme')
    expect(result.theme).toEqual({
      version: 1,
      name: 'Copper Twilight',
      appearance: 'dark',
      tokens: {
        accent: '#FF9F0A',
        surfaceBase: 'rgb(18, 20, 26)',
        glassBlur: '24px',
        panelRadius: '18px',
      },
    })
    expect(JSON.parse(result.normalizedJson)).toEqual(result.theme)
  })

  it('validates the shipped sample theme JSON', () => {
    const result = parseCustomThemeJson(SAMPLE_CUSTOM_THEME_JSON)
    expect(result.ok).toBe(true)
  })

  it('rejects empty, oversized, malformed, and non-object inputs', () => {
    expect(parseCustomThemeJson('   ')).toEqual({ ok: false, code: 'empty' })
    expect(parseCustomThemeJson('x'.repeat(CUSTOM_THEME_MAX_BYTES + 1))).toEqual({ ok: false, code: 'too-large' })
    expect(parseCustomThemeJson('{bad json')).toEqual({ ok: false, code: 'invalid-json' })
    expect(parseCustomThemeJson('[]')).toEqual({ ok: false, code: 'not-object' })
    expect(parseCustomThemeJson('null')).toEqual({ ok: false, code: 'not-object' })
  })

  it('rejects invalid name, appearance, missing/empty tokens, and unsupported token keys', () => {
    expect(parseCustomThemeJson(JSON.stringify({ name: '', tokens: { accent: '#007AFF' } }))).toEqual({
      ok: false,
      code: 'invalid-name',
    })
    expect(parseCustomThemeJson(JSON.stringify({ name: 'a'.repeat(65), tokens: { accent: '#007AFF' } }))).toEqual({
      ok: false,
      code: 'invalid-name',
    })
    expect(parseCustomThemeJson(JSON.stringify({ appearance: 'sepia', tokens: { accent: '#007AFF' } }))).toEqual({
      ok: false,
      code: 'invalid-appearance',
    })
    expect(parseCustomThemeJson(JSON.stringify({ name: 'MissingTokens' }))).toEqual({
      ok: false,
      code: 'missing-tokens',
    })
    expect(parseCustomThemeJson(JSON.stringify({ tokens: {} }))).toEqual({
      ok: false,
      code: 'empty-tokens',
    })
    expect(parseCustomThemeJson(JSON.stringify({ tokens: { unknownVar: '#000' } }))).toEqual({
      ok: false,
      code: 'unsupported-token',
      token: 'unknownVar',
    })
  })

  it('rejects CSS injection vectors and delegates color checks to CSS.supports when present', () => {
    for (const badColor of [
      'url(https://evil.test/x.png)',
      '#007AFF; background: red',
      'var(--other-var)',
      'expression(alert(1))',
      'red',
      '#12',
    ]) {
      expect(parseCustomThemeJson(JSON.stringify({ tokens: { accent: badColor } }))).toEqual({
        ok: false,
        code: 'invalid-token-value',
        token: 'accent',
      })
    }

    for (const badLength of ['20rem', '-5px', '1000px', '24px; color: red']) {
      expect(parseCustomThemeJson(JSON.stringify({ tokens: { glassBlur: badLength } }))).toEqual({
        ok: false,
        code: 'invalid-token-value',
        token: 'glassBlur',
      })
    }

    const supports = vi.fn((_prop: string, value: string) => value !== '#123456')
    vi.stubGlobal('CSS', { supports })
    expect(parseCustomThemeJson(JSON.stringify({ tokens: { accent: '#123456' } }))).toEqual({
      ok: false,
      code: 'invalid-token-value',
      token: 'accent',
    })
    expect(supports).toHaveBeenCalledWith('color', '#123456')
  })
})

describe('normalizeWorkbenchPreferences & buildWorkbenchTokenOverrides', () => {
  it('falls back safely for corrupt raw state and clears custom accent if JSON fails validation', () => {
    expect(normalizeWorkbenchPreferences(null)).toEqual(DEFAULT_WORKBENCH_PREFERENCES)
    expect(normalizeWorkbenchPreferences({
      defaultMode: 'home',
      accentPreset: 'custom',
      reducedTransparency: 'yes',
      customThemeJson: '{corrupt',
    })).toEqual({
      defaultMode: 'work',
      accentPreset: 'blue',
      reducedTransparency: false,
      reducedMotion: false,
      customThemeJson: '',
    })
  })

  it('maps appearance-scoped custom tokens onto light/dark override pairs', () => {
    const customLight = JSON.stringify({
      name: 'Daylight',
      appearance: 'light',
      tokens: { accent: '#112233', panelRadius: '20px' },
    })
    const overrides = buildWorkbenchTokenOverrides({
      ...DEFAULT_WORKBENCH_PREFERENCES,
      accentPreset: 'custom',
      customThemeJson: customLight,
    })
    expect(overrides['--wb-accent']).toEqual({ light: '#112233', dark: '#0A84FF' })
    expect(overrides['--wb-radius-panel']).toEqual({ light: '20px', dark: '18px' })
    expect(overrides['--wb-windows-caption-bg']).toEqual({ light: 'transparent', dark: 'transparent' })
  })

  it('restores solid caption and glass token overrides when reducedTransparency is enabled', () => {
    const overrides = buildWorkbenchTokenOverrides({
      ...DEFAULT_WORKBENCH_PREFERENCES,
      reducedTransparency: true,
    })
    expect(overrides['--wb-glass-backdrop']).toEqual({ light: 'none', dark: 'none' })
    expect(overrides['--wb-windows-caption-bg']).toEqual({
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    })
  })
})
