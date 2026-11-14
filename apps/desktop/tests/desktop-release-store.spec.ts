import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import {
  assertPublishableDesktopManifest,
  retainDesktopRelease,
  retainedDesktopPath,
  verifyRetainedDesktopRelease,
  type DesktopRetainedBuildIdentity,
  type DesktopRetainedSource,
} from '../scripts/desktop-release-store.ts'

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

async function fixture(qualification: 'signed' | 'unsigned' = 'signed') {
  const root = await mkdtemp(join(tmpdir(), 'desktop-release-store-'))
  roots.push(root)
  const file = join(root, 'installer.exe')
  await writeFile(file, 'signed installer fixture')
  const source: DesktopRetainedSource = {
    repository: 'owner/repository', runId: '100', attempt: '1', commit: 'a'.repeat(40), runnerName: 'windows-runner',
    target: 'win-x64', preset: 'test', productVersion: '1.0.0', version: '1.0.0', testReleaseId: 'b'.repeat(32),
    workflowCommit: 'a'.repeat(40), sourceRef: 'master', channel: 'nightly',
    publishRequested: true, qualification,
  }
  const buildIdentity: DesktopRetainedBuildIdentity = {
    builderRunner: 'dsh-win-builder-1',
    builderRunId: '100',
    builderAttempt: '1',
    workflowSha: 'a'.repeat(40),
    ...(qualification === 'signed'
      ? {
        signer: {
          runnerName: 'dsh-win-signer-1',
          runId: '100',
          attempt: '1',
          environment: 'windows-sign-test',
          certificateThumbprint: 'A'.repeat(40),
          signedAt: '2026-11-14T12:00:00.000Z',
        },
      }
      : {}),
  }
  return { root: join(root, 'releases'), file, source, buildIdentity }
}

it('retains independent v2 attempts with dual hashes and rejects replacing an existing attempt', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  const first = await retainDesktopRelease(root, source, [file], buildIdentity)
  const second = await retainDesktopRelease(root, { ...source, attempt: '2' }, [file], { ...buildIdentity, builderAttempt: '2' })
  expect(first).not.toBe(second)
  await expect(retainDesktopRelease(root, source, [file], buildIdentity)).rejects.toThrow(/already exists/u)
  await rm(file)
  const manifest = await verifyRetainedDesktopRelease(root, '100', '1')
  expect(manifest.schemaVersion).toBe(2)
  expect(manifest.source).toEqual(source)
  expect(manifest.files[0]).toMatchObject({ name: 'installer.exe' })
  if (manifest.schemaVersion !== 2) throw new Error('expected v2')
  expect(manifest.files[0]!.sha256).toMatch(/^[a-f0-9]{64}$/u)
  expect(manifest.files[0]!.sha512).toMatch(/^[A-Za-z0-9+/]{86}==$/u)
  expect(assertPublishableDesktopManifest(manifest).schemaVersion).toBe(2)
  expect(await readFile(join(first, 'installer.exe'), 'utf8')).toBe('signed installer fixture')
})

it('detects changed bytes even when file length is unchanged and detects sha256 mismatch', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  const directory = await retainDesktopRelease(root, source, [file], buildIdentity)
  const path = join(directory, 'installer.exe')
  await writeFile(path, Buffer.alloc((await readFile(path)).length))
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).rejects.toThrow(/changed file/u)

  const { root: root2, file: file2, source: source2, buildIdentity: buildIdentity2 } = await fixture()
  const dir2 = await retainDesktopRelease(root2, source2, [file2], buildIdentity2)
  const manifest = await verifyRetainedDesktopRelease(root2, '100', '1')
  if (manifest.schemaVersion !== 2) throw new Error('expected v2')
  await writeFile(join(dir2, 'manifest.json'), JSON.stringify({
    ...manifest,
    files: [{ ...manifest.files[0]!, sha256: '0'.repeat(64) }],
  }))
  await expect(verifyRetainedDesktopRelease(root2, '100', '1')).rejects.toThrow(/changed file/u)
})

it('reads legacy v1 manifests for audit only and rejects them for publication', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  const dir = await retainDesktopRelease(root, source, [file], buildIdentity)
  const v2 = await verifyRetainedDesktopRelease(root, '100', '1')
  const v1 = {
    schemaVersion: 1,
    source: v2.source,
    files: [{ name: v2.files[0]!.name, size: v2.files[0]!.size, sha512: v2.files[0]!.sha512 }],
  }
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(v1))
  const verified = await verifyRetainedDesktopRelease(root, '100', '1')
  expect(verified.schemaVersion).toBe(1)
  expect(() => assertPublishableDesktopManifest(verified)).toThrow(/legacy schemaVersion 1/u)
})

it('does not expose an incomplete copy and releases its claim after failure', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  await expect(retainDesktopRelease(root, source, [file, join(root, 'missing.zip')], buildIdentity)).rejects.toThrow()
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).rejects.toThrow()
  await retainDesktopRelease(root, source, [file], buildIdentity)
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).resolves.toMatchObject({ schemaVersion: 2, source })
})

it('permits only one writer for a concurrently retained attempt', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  const results = await Promise.allSettled([
    retainDesktopRelease(root, source, [file], buildIdentity),
    retainDesktopRelease(root, source, [file], buildIdentity),
  ])
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).resolves.toMatchObject({ schemaVersion: 2, source })
})

it('rejects traversal, duplicate files, and tampered manifest source or signer', async () => {
  const { root, file, source, buildIdentity } = await fixture()
  expect(() => retainedDesktopPath(root, '../100', '1')).toThrow()
  expect(() => retainedDesktopPath(root, '100', '0')).toThrow()
  await expect(retainDesktopRelease(root, source, [file, file], buildIdentity)).rejects.toThrow(/duplicate/u)
  const path = await retainDesktopRelease(root, source, [file], buildIdentity)
  const manifest = await verifyRetainedDesktopRelease(root, '100', '1')
  await writeFile(join(path, 'manifest.json'), JSON.stringify({ ...manifest, source: { ...source, attempt: '2' } }))
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).rejects.toThrow(/identity mismatch/u)
  await writeFile(join(path, 'manifest.json'), JSON.stringify({ ...manifest, files: [{ ...manifest.files[0], name: '../installer.exe' }] }))
  await expect(verifyRetainedDesktopRelease(root, '100', '1')).rejects.toThrow()
  if (manifest.schemaVersion === 2) {
    const withoutSigner = { ...manifest, buildIdentity: { ...manifest.buildIdentity, signer: undefined } }
    await writeFile(join(path, 'manifest.json'), JSON.stringify(withoutSigner))
    await expect(verifyRetainedDesktopRelease(root, '100', '1')).rejects.toThrow(/signer identity/u)
  }
})

it('enforces trusted sourceRef for signed and production manifests while allowing unsigned dev branches in test', async () => {
  const { root, file, source, buildIdentity } = await fixture('unsigned')
  source.sourceRef = 'feature/desktop-update'
  await expect(retainDesktopRelease(root, { ...source, preset: 'production' }, [file], buildIdentity)).rejects.toThrow(/Production/u)
  await expect(retainDesktopRelease(root, { ...source, qualification: 'signed' }, [file], {
    ...buildIdentity,
    signer: {
      runnerName: 'dsh-win-signer-1', runId: '100', attempt: '1',
      environment: 'windows-sign-test', certificateThumbprint: 'A'.repeat(40), signedAt: '2026-11-14T12:00:00.000Z',
    },
  })).rejects.toThrow(/Signed source/u)
  const directory = await retainDesktopRelease(root, source, [file], buildIdentity)
  const verified = await verifyRetainedDesktopRelease(root, source.runId, source.attempt)
  expect(verified.source.sourceRef).toBe(source.sourceRef)
  expect(() => assertPublishableDesktopManifest(verified)).toThrow(/unsigned/u)
  const path = join(directory, 'manifest.json')
  await writeFile(path, JSON.stringify({ ...verified, source: { ...verified.source, preset: 'production' } }))
  await expect(verifyRetainedDesktopRelease(root, source.runId, source.attempt)).rejects.toThrow(/Production/u)
})
