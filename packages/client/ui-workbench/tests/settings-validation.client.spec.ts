import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOM_THEME_MAX_BYTES,
  DEFAULT_GLASS_BLUR,
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

    for (const badLength of ['20rem', '-5px', '00px', '01px', '0.5', '1000px', '24px; color: red']) {
      expect(parseCustomThemeJson(JSON.stringify({ tokens: { glassBlur: badLength } }))).toEqual({
        ok: false,
        code: 'invalid-token-value',
        token: 'glassBlur',
      })
    }

    for (const goodLength of ['0', '0px', '0.5px', '4px', '28px', '64px']) {
      expect(parseCustomThemeJson(JSON.stringify({ tokens: { glassBlur: goodLength } }))).toMatchObject({
        ok: true,
        theme: { tokens: { glassBlur: goodLength } },
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
      accentPreset: 'custom',
      customThemeJson: JSON.stringify({ tokens: { glassBlur: '44px' } }),
      reducedTransparency: true,
    })
    expect(overrides['--wb-blur']).toEqual({ light: '0px', dark: '0px' })
    expect(overrides['--wb-glass-backdrop']).toEqual({ light: 'none', dark: 'none' })
    expect(overrides['--wb-windows-caption-bg']).toEqual({
      light: 'var(--dsw-specific-sidebar-fill)',
      dark: 'var(--dsw-specific-sidebar-fill)',
    })
  })

  it('derives --wb-glass-backdrop from --wb-blur for default, low, mid, and high glassBlur without changing unrelated tokens', () => {
    const defaults = buildWorkbenchTokenOverrides(DEFAULT_WORKBENCH_PREFERENCES)
    expect(DEFAULT_GLASS_BLUR).toBe('28px')
    expect(defaults['--wb-blur']).toEqual({ light: '28px', dark: '28px' })
    expect(defaults['--wb-glass-backdrop']).toEqual({
      light: 'blur(var(--wb-blur)) saturate(185%) contrast(103%)',
      dark: 'blur(var(--wb-blur)) saturate(185%) contrast(103%)',
    })
    expect(defaults['--wb-glass-backdrop']?.light).not.toContain('28px')

    for (const blur of ['0px', '4px', '20px', '64px']) {
      const overrides = buildWorkbenchTokenOverrides({
        ...DEFAULT_WORKBENCH_PREFERENCES,
        accentPreset: 'custom',
        customThemeJson: JSON.stringify({
          name: `Blur ${blur}`,
          appearance: 'both',
          tokens: { glassBlur: blur },
        }),
      })
      expect(overrides['--wb-blur']).toEqual({ light: blur, dark: blur })
      expect(overrides['--wb-glass-backdrop']).toEqual(defaults['--wb-glass-backdrop'])
      expect(overrides['--wb-glass-backdrop']?.light).toContain('var(--wb-blur)')
      expect(overrides['--wb-glass-backdrop']?.dark).toContain('var(--wb-blur)')

      for (const [token, value] of Object.entries(defaults)) {
        if (token === '--wb-blur') continue
        expect(overrides[token], `unrelated token ${token} changed for glassBlur=${blur}`).toEqual(value)
      }
    }
  })

  it('falls back safely when glassBlur is missing, invalid, out of range, or scoped to one appearance', () => {
    const missingBlur = buildWorkbenchTokenOverrides({
      ...DEFAULT_WORKBENCH_PREFERENCES,
      accentPreset: 'custom',
      customThemeJson: JSON.stringify({ tokens: { accent: '#0A84FF' } }),
    })
    expect(missingBlur['--wb-blur']).toEqual({ light: '28px', dark: '28px' })

    const invalidBlurNormalized = normalizeWorkbenchPreferences({
      accentPreset: 'custom',
      customThemeJson: JSON.stringify({ tokens: { glassBlur: '1500px' } }),
    })
    expect(invalidBlurNormalized).toEqual(DEFAULT_WORKBENCH_PREFERENCES)
    expect(buildWorkbenchTokenOverrides(invalidBlurNormalized)['--wb-blur']).toEqual({ light: '28px', dark: '28px' })

    const unnormalizedBadBlur = buildWorkbenchTokenOverrides({
      ...DEFAULT_WORKBENCH_PREFERENCES,
      accentPreset: 'custom',
      customThemeJson: JSON.stringify({ tokens: { glassBlur: '-10px' } }),
    })
    expect(unnormalizedBadBlur['--wb-blur']).toEqual({ light: '28px', dark: '28px' })

    const darkOnly = buildWorkbenchTokenOverrides({
      ...DEFAULT_WORKBENCH_PREFERENCES,
      accentPreset: 'custom',
      customThemeJson: JSON.stringify({
        appearance: 'dark',
        tokens: { glassBlur: '12px' },
      }),
    })
    expect(darkOnly['--wb-blur']).toEqual({ light: '28px', dark: '12px' })
    expect(darkOnly['--wb-glass-backdrop']).toEqual({
      light: 'blur(var(--wb-blur)) saturate(185%) contrast(103%)',
      dark: 'blur(var(--wb-blur)) saturate(185%) contrast(103%)',
    })
  })

  it('keeps workbench-glass.css and glass component stylesheets wired to var(--wb-glass-backdrop) without hardcoded blur(28px)', () => {
    const glassCssText = readFileSync(fileURLToPath(new URL('../src/client/styles/workbench-glass.css', import.meta.url)), 'utf8')
    expect(glassCssText).toContain('--wb-blur: 28px;')
    expect(glassCssText).toContain('--wb-glass-backdrop: blur(var(--wb-blur)) saturate(185%) contrast(103%);')
    expect(glassCssText).not.toContain('--wb-glass-backdrop: blur(28px)')

    for (const relativeCss of [
      '../src/client/components/ModeSwitcher.module.css',
      '../src/client/components/PromptStarters.module.css',
      '../src/client/components/WorkTaskInspector.module.css',
      '../../ui-layout/src/client/AppFrame.module.css',
      '../../ui-sidebar/src/client/SidebarRoot.module.css',
    ]) {
      const cssText = readFileSync(fileURLToPath(new URL(relativeCss, import.meta.url)), 'utf8')
      expect(cssText, `${relativeCss} should consume --wb-glass-backdrop`).toContain('var(--wb-glass-backdrop')
      expect(cssText, `${relativeCss} should not hardcode blur(28px)`).not.toContain('blur(28px)')
    }
  })
})
