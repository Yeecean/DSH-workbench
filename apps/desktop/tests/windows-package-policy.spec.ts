import { describe, expect, it } from 'vitest'
import {
  assertWindowsPackagePolicy,
  classifySourceRef,
  evaluateWindowsPackagePolicy,
  validateSourceRefSyntax,
} from '../scripts/windows-package-policy.mjs'

describe('Windows packaging authorization policy (P8-S1 fail-closed)', () => {
  it.each([
    { sourceRef: 'master', refKind: 'branch' as const, expectedKind: 'master' },
    { sourceRef: 'feature/p8-s1-windows-release-security', refKind: 'branch' as const, expectedKind: 'dev-branch' },
    { sourceRef: 'fix/win-installer', refKind: 'branch' as const, expectedKind: 'dev-branch' },
    { sourceRef: 'dsh-v0.2.2-rc.2', refKind: 'tag' as const, expectedKind: 'release-tag' },
  ])('allows test + unsigned for trusted source $sourceRef ($refKind)', ({ sourceRef, refKind, expectedKind }) => {
    const decision = assertWindowsPackagePolicy({
      repository: 'Yeecean/DSH-workbench',
      expectedRepository: 'Yeecean/DSH-workbench',
      sourceRef,
      refKind,
      preset: 'test',
      signing: 'unsigned',
      updateChannel: 'nightly',
      versionMode: 'default',
      compressionLevel: '3',
    })
    expect(decision).toEqual({
      allowed: true,
      sourceKind: expectedKind,
      preset: 'test',
      signing: 'unsigned',
      sourceRef,
    })
  })

  it.each([
    ['dev branch + signed', { sourceRef: 'feature/test', refKind: 'branch' as const, preset: 'test', signing: 'signed' }, /rejected for development branches/u],
    ['master + signed (S1 fail-closed)', { sourceRef: 'master', refKind: 'branch' as const, preset: 'test', signing: 'signed' }, /disabled in P8-S1/u],
    ['release tag + signed (S1 fail-closed)', { sourceRef: 'dsh-v0.2.2-rc.2', refKind: 'tag' as const, preset: 'test', signing: 'signed' }, /disabled in P8-S1/u],
    ['production + unsigned from master', { sourceRef: 'master', refKind: 'branch' as const, preset: 'production', signing: 'unsigned' }, /production preset cannot be packaged as unsigned/u],
    ['production + unsigned from tag', { sourceRef: 'dsh-v0.2.2-rc.2', refKind: 'tag' as const, preset: 'production', signing: 'unsigned' }, /production preset cannot be packaged as unsigned/u],
    ['production + signed from master (S1 fail-closed)', { sourceRef: 'master', refKind: 'branch' as const, preset: 'production', signing: 'signed' }, /disabled in P8-S1/u],
    ['production + signed from tag (S1 fail-closed)', { sourceRef: 'dsh-v0.2.2-rc.2', refKind: 'tag' as const, preset: 'production', signing: 'signed' }, /disabled in P8-S1/u],
    ['raw 40-char SHA', { sourceRef: 'a'.repeat(40), preset: 'test', signing: 'unsigned' }, /raw commit SHAs/u],
    ['PR ref', { sourceRef: 'refs/pull/123/merge', preset: 'test', signing: 'unsigned' }, /not a raw ref/u],
    ['refs/heads prefix', { sourceRef: 'refs/heads/master', preset: 'test', signing: 'unsigned' }, /not a raw ref/u],
    ['non-whitelist tag', { sourceRef: 'v1.0.0', refKind: 'tag' as const, preset: 'test', signing: 'unsigned' }, /non-whitelist tag/u],
    ['external/fork repository', { repository: 'fork-owner/DSH-workbench', expectedRepository: 'Yeecean/DSH-workbench', sourceRef: 'master', preset: 'test', signing: 'unsigned' }, /external or mismatched repository/u],
    ['path traversal in sourceRef', { sourceRef: '../master', preset: 'test', signing: 'unsigned' }, /invalid git ref/u],
    ['whitespace in sourceRef', { sourceRef: ' master ', preset: 'test', signing: 'unsigned' }, /empty or padded/u],
  ])('rejects %s', (_label, input, pattern) => {
    const decision = evaluateWindowsPackagePolicy(input)
    expect(decision.allowed).toBe(false)
    if (!decision.allowed) expect(decision.reason).toMatch(pattern)
    expect(() => assertWindowsPackagePolicy(input)).toThrow(pattern)
  })

  it('rejects invalid ref syntax and classifies unknown kinds safely', () => {
    expect(() => validateSourceRefSyntax('')).toThrow()
    expect(() => validateSourceRefSyntax('HEAD')).toThrow()
    expect(classifySourceRef('v1.0.0', 'tag')).toBe('untrusted')
    expect(classifySourceRef('dsh-v1.0.0', 'tag')).toBe('release-tag')
    expect(classifySourceRef('master', 'branch')).toBe('master')
    expect(classifySourceRef('feat/x', 'branch')).toBe('dev-branch')
  })
})
