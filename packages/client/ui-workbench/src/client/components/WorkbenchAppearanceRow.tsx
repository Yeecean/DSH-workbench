/** General Settings extension row for Workbench modes, Liquid Glass toggles, and validated Custom Theme JSON. */

import { useEffect, useState } from 'react'
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import {
  ACCENT_PRESET_IDS,
  SAMPLE_CUSTOM_THEME_JSON,
  WORKBENCH_MODES,
  parseCustomThemeJson,
  type AccentPresetId,
  type CustomThemeErrorCode,
  type WorkbenchMode,
} from '../../workbench-settings.ts'
import type { WorkbenchKey } from '../locales.ts'
import type { createWorkbenchSettingsStore } from '../stores.ts'
import css from './WorkbenchAppearanceRow.module.css'

export interface WorkbenchAppearanceInjected {
  setDefaultMode: (mode: WorkbenchMode) => void
  setAccentPreset: (accent: AccentPresetId) => void
  setReducedTransparency: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  applyCustomThemeJson: (normalizedJson: string) => void
  resetCustomTheme: () => void
}

export type WorkbenchAppearanceRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsStore<ReturnType<typeof createWorkbenchSettingsStore>>
  & PropsLocale<'workbench'>
  & WorkbenchAppearanceInjected

const ACCENT_LABEL_KEYS: Readonly<Record<AccentPresetId, WorkbenchKey>> = {
  blue: 'settings.accent.blue',
  graphite: 'settings.accent.graphite',
  amber: 'settings.accent.amber',
  custom: 'settings.accent.custom',
}

function errorKeyFor(code: CustomThemeErrorCode): WorkbenchKey {
  switch (code) {
    case 'empty': return 'settings.customTheme.error.empty'
    case 'too-large': return 'settings.customTheme.error.tooLarge'
    case 'invalid-json': return 'settings.customTheme.error.invalidJson'
    case 'not-object': return 'settings.customTheme.error.notObject'
    case 'invalid-name': return 'settings.customTheme.error.invalidName'
    case 'invalid-appearance': return 'settings.customTheme.error.invalidAppearance'
    case 'missing-tokens': return 'settings.customTheme.error.missingTokens'
    case 'empty-tokens': return 'settings.customTheme.error.emptyTokens'
    case 'unsupported-token': return 'settings.customTheme.error.unsupportedToken'
    case 'invalid-token-value': return 'settings.customTheme.error.invalidTokenValue'
  }
}

/**
 * Renders Workbench startup mode, Liquid Glass material toggles, and durable
 * strict-validated Custom Theme JSON import/export in General Settings.
 */
export function WorkbenchAppearanceRow({
  useStore,
  setDefaultMode,
  setAccentPreset,
  setReducedTransparency,
  setReducedMotion,
  applyCustomThemeJson,
  resetCustomTheme,
  t,
}: WorkbenchAppearanceRowProps) {
  const { preferences, writable } = useStore(state => state)
  const [editorOpen, setEditorOpen] = useState(false)
  const [draftJson, setDraftJson] = useState(preferences.customThemeJson || SAMPLE_CUSTOM_THEME_JSON)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  useEffect(() => {
    if (preferences.customThemeJson.trim().length > 0) {
      setDraftJson(preferences.customThemeJson)
    }
  }, [preferences.customThemeJson])

  const handleApplyJson = (): void => {
    const parsed = parseCustomThemeJson(draftJson)
    if (!parsed.ok) {
      setFeedback({
        kind: 'error',
        message: t(errorKeyFor(parsed.code), parsed.token !== undefined ? { token: parsed.token } : undefined),
      })
      return
    }
    setDraftJson(parsed.normalizedJson)
    applyCustomThemeJson(parsed.normalizedJson)
    setFeedback({
      kind: 'success',
      message: t('settings.customTheme.statusApplied', { name: parsed.theme.name }),
    })
  }

  const handleExportActive = (): void => {
    const activeJson = preferences.customThemeJson.trim().length > 0
      ? preferences.customThemeJson
      : SAMPLE_CUSTOM_THEME_JSON
    setDraftJson(activeJson)
    setEditorOpen(true)
    setFeedback(null)
  }

  const handleReset = (): void => {
    resetCustomTheme()
    setDraftJson(SAMPLE_CUSTOM_THEME_JSON)
    setFeedback({
      kind: 'success',
      message: t('settings.customTheme.statusReset'),
    })
  }

  return (
    <div className={css.group} data-workbench-settings="">
      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{t('settings.defaultMode.title')}</div>
          <div className={css.desc}>{t('settings.defaultMode.desc')}</div>
        </div>
        <div className={css.pillGroup} role="group" aria-label={t('settings.defaultMode.title')}>
          {WORKBENCH_MODES.map(mode => (
            <button
              key={mode}
              type="button"
              disabled={!writable}
              aria-pressed={preferences.defaultMode === mode}
              className={css.pillOption}
              data-workbench-setting-default-mode={mode}
              onClick={() => { setDefaultMode(mode) }}
            >
              {mode === 'work' ? t('mode.work') : t('mode.code')}
            </button>
          ))}
        </div>
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{t('settings.accent.title')}</div>
          <div className={css.desc}>{t('settings.accent.desc')}</div>
        </div>
        <div className={css.pillGroup} role="group" aria-label={t('settings.accent.title')}>
          {ACCENT_PRESET_IDS.map((accent) => {
            const customUnavailable = accent === 'custom' && preferences.customThemeJson.trim().length === 0
            return (
              <button
                key={accent}
                type="button"
                disabled={!writable || customUnavailable}
                aria-pressed={preferences.accentPreset === accent}
                className={css.pillOption}
                data-workbench-setting-accent={accent}
                onClick={() => { setAccentPreset(accent) }}
              >
                {t(ACCENT_LABEL_KEYS[accent])}
              </button>
            )
          })}
        </div>
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{t('settings.reducedTransparency.title')}</div>
          <div className={css.desc}>{t('settings.reducedTransparency.desc')}</div>
        </div>
        <Switch
          checked={preferences.reducedTransparency}
          disabled={!writable}
          label={t('settings.reducedTransparency.title')}
          onChange={setReducedTransparency}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{t('settings.reducedMotion.title')}</div>
          <div className={css.desc}>{t('settings.reducedMotion.desc')}</div>
        </div>
        <Switch
          checked={preferences.reducedMotion}
          disabled={!writable}
          label={t('settings.reducedMotion.title')}
          onChange={setReducedMotion}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{t('settings.customTheme.title')}</div>
          <div className={css.desc}>{t('settings.customTheme.desc')}</div>
        </div>
        <button
          type="button"
          className={css.secondaryButton}
          data-workbench-theme-json-toggle=""
          onClick={() => { setEditorOpen(open => !open) }}
        >
          {editorOpen ? t('settings.customTheme.toggleClose') : t('settings.customTheme.toggleOpen')}
        </button>
      </div>

      {editorOpen && (
        <div className={css.jsonPanel} data-workbench-theme-json-panel="">
          <textarea
            className={css.jsonEditor}
            aria-label={t('settings.customTheme.title')}
            data-workbench-theme-json-input=""
            value={draftJson}
            spellCheck={false}
            onChange={(event) => {
              setDraftJson(event.target.value)
              setFeedback(null)
            }}
          />
          <div className={css.jsonActions}>
            <button
              type="button"
              disabled={!writable}
              className={css.primaryButton}
              data-workbench-theme-json-apply=""
              onClick={handleApplyJson}
            >
              {t('settings.customTheme.apply')}
            </button>
            <button
              type="button"
              className={css.secondaryButton}
              onClick={() => {
                setDraftJson(SAMPLE_CUSTOM_THEME_JSON)
                setFeedback(null)
              }}
            >
              {t('settings.customTheme.sample')}
            </button>
            <button
              type="button"
              className={css.secondaryButton}
              onClick={handleExportActive}
            >
              {t('settings.customTheme.export')}
            </button>
            <button
              type="button"
              disabled={!writable}
              className={css.secondaryButton}
              data-workbench-theme-json-reset=""
              onClick={handleReset}
            >
              {t('settings.customTheme.reset')}
            </button>
          </div>
          {feedback !== null && (
            <div
              role={feedback.kind === 'error' ? 'alert' : 'status'}
              className={feedback.kind === 'error' ? css.feedbackError : css.feedbackSuccess}
              data-workbench-theme-json-feedback={feedback.kind}
            >
              {feedback.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
