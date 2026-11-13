/** Top header Work × Code segmented mode switcher and Code preset controls. */

import type { KeyboardEvent } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { CODE_PRESET_IDS, WORKBENCH_MODES, type CodePresetId, type WorkbenchMode } from '../../workbench-settings.ts'
import type { createModeSwitcherStore } from '../stores.ts'
import css from './ModeSwitcher.module.css'

export interface ModeSwitcherInjected {
  switchMode: (mode: WorkbenchMode) => void
  selectPreset: (preset: CodePresetId) => void
  toggleInspector: () => void
}

export type ModeSwitcherProps =
  PropsRuntime<'conversation.header.leading'>
  & PropsStore<ReturnType<typeof createModeSwitcherStore>>
  & PropsLocale<'workbench'>
  & ModeSwitcherInjected

const PRESET_LABEL_KEYS: Readonly<Record<CodePresetId, 'preset.focus' | 'preset.build' | 'preset.review' | 'preset.debug'>> = {
  focus: 'preset.focus',
  build: 'preset.build',
  review: 'preset.review',
  debug: 'preset.debug',
}

/** Renders Work × Code segmented switch and Code preset strip without altering session identity. */
export function ModeSwitcher({
  useStore,
  switchMode,
  selectPreset,
  toggleInspector,
  t,
}: ModeSwitcherProps) {
  const { mode, preset, inspectorActive } = useStore(state => state)

  const handleSegmentKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next: WorkbenchMode = mode === 'work' ? 'code' : 'work'
    switchMode(next)
  }

  return (
    <div className={css.root} data-workbench-switcher="">
      <div
        className={css.segmented}
        role="tablist"
        aria-label={t('mode.switcher.ariaLabel')}
        onKeyDown={handleSegmentKeyDown}
      >
        {WORKBENCH_MODES.map(item => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`workbench-mode-tab-${item}`}
            aria-selected={mode === item}
            tabIndex={mode === item ? 0 : -1}
            className={css.segment}
            data-workbench-mode-option={item}
            onClick={() => { switchMode(item) }}
          >
            {t(item === 'work' ? 'mode.work' : 'mode.code')}
          </button>
        ))}
      </div>

      {mode === 'code' && (
        <div className={css.presetGroup} data-workbench-presets="">
          {CODE_PRESET_IDS.map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={preset === item}
              className={css.presetButton}
              data-workbench-preset-option={item}
              onClick={() => { selectPreset(item) }}
            >
              {t(PRESET_LABEL_KEYS[item])}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-pressed={inspectorActive}
        className={css.inspectorToggle}
        data-workbench-inspector-toggle=""
        onClick={toggleInspector}
      >
        {t('inspector.toggle')}
      </button>
    </div>
  )
}
