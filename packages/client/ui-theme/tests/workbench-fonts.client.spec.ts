/** Offline Workbench fonts remain self-contained in the packaged client styles. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('offline workbench fonts', () => {
  it('ships local TrueType weights and OFL licenses without remote URLs', () => {
    const css = readFileSync(new URL('../src/styles/workbench-fonts.css', import.meta.url), 'utf8')
    expect(css).not.toMatch(/url\(https?:/)
    expect(css).toContain('寒蝉半圆体')
    expect(css).toContain('ChillRoundM')
    expect(css).toContain('JetBrains Mono')

    const refs = [...css.matchAll(/url\(\.\/(workbench-fonts\/[^)]+\.ttf)\)/g)].map(match => match[1]!)
    expect(new Set(refs)).toEqual(new Set([
      'workbench-fonts/ChillRoundM.ttf',
      'workbench-fonts/JetBrainsMono-Regular.ttf',
      'workbench-fonts/JetBrainsMono-Medium.ttf',
      'workbench-fonts/JetBrainsMono-SemiBold.ttf',
      'workbench-fonts/JetBrainsMono-Bold.ttf',
    ]))

    for (const ref of new Set(refs)) {
      const font = readFileSync(new URL(`../src/styles/${ref}`, import.meta.url))
      // SFNT v1.0 header for TrueType fonts.
      expect(font.readUInt32BE(0)).toBe(0x00010000)
    }

    for (const licenseFile of ['ChillRoundM-LICENSE.txt', 'JetBrainsMono-OFL.txt']) {
      const license = readFileSync(new URL(`../src/styles/workbench-fonts/${licenseFile}`, import.meta.url), 'utf8')
      expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1')
    }

    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      files: string[]
      exports: Record<string, unknown>
    }
    expect(manifest.files).toContain('lib/styles')
    expect(manifest.exports['./workbench-fonts.css']).toBe('./lib/styles/workbench-fonts.css')
  })
})
