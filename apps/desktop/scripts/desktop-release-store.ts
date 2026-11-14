/** Retain immutable Desktop build files outside disposable runner checkouts. */
import { createHash } from 'node:crypto'
import { createReadStream, constants } from 'node:fs'
import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { basename, isAbsolute, join } from 'node:path'
import { z } from 'zod'
import { desktopPublishQualificationError } from './desktop-publish-qualification.mjs'

const positiveId = z.string().regex(/^[1-9]\d*$/u)
const filename = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u)
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/u)
const sha512Base64 = z.string().regex(/^[A-Za-z0-9+/]{86}==$/u)
const TRUSTED_SOURCE_REF_PATTERN = /^(?:master|dsh-v[0-9][0-9A-Za-z.-]*)$/u

export const sourceSchema = z.strictObject({
  repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/u),
  runId: positiveId,
  attempt: positiveId,
  commit: z.string().regex(/^[a-f0-9]{40}$/u),
  workflowCommit: z.string().regex(/^[a-f0-9]{40}$/u),
  sourceRef: z.string().min(1),
  channel: z.enum(['nightly', 'stable']),
  runnerName: z.string().min(1),
  // Storage accepts every Desktop target; CI routing separately limits currently provisioned platforms.
  target: z.enum(['mac-arm64', 'mac-x64', 'win-x64']),
  preset: z.enum(['test', 'production']),
  productVersion: z.string().min(1),
  version: z.string().min(1),
  testReleaseId: z.string().regex(/^[a-f0-9]{32}$/u).nullable(),
  // Older retained manifests carry this flag; manual publication does not depend on it.
  publishRequested: z.boolean().optional(),
  qualification: z.enum(['signed', 'notarized', 'unsigned', 'unnotarized']),
})
  .refine(source => source.preset === 'test' || TRUSTED_SOURCE_REF_PATTERN.test(source.sourceRef),
    'Production source must be master or dsh-v*')
  .refine(source => source.qualification !== 'signed'
    || TRUSTED_SOURCE_REF_PATTERN.test(source.sourceRef),
  'Signed source must be master or dsh-v*')
  .refine(source => source.preset !== 'production'
    || source.qualification === 'signed' || source.qualification === 'notarized',
  'Production preset cannot be unsigned or unnotarized')

const fileSchemaV1 = z.strictObject({
  name: filename,
  size: z.number().int().positive(),
  sha512: sha512Base64,
})

const fileSchemaV2 = z.strictObject({
  name: filename,
  size: z.number().int().positive(),
  sha256: sha256Hex,
  sha512: sha512Base64,
})

export const signerIdentitySchema = z.strictObject({
  runnerName: z.string().min(1),
  runId: positiveId,
  attempt: positiveId,
  environment: z.string().min(1),
  certificateThumbprint: z.string().regex(/^[A-F0-9]{40}$/iu),
  signedAt: z.iso.datetime(),
})

export const buildIdentitySchema = z.strictObject({
  builderRunner: z.string().min(1),
  builderRunId: positiveId,
  builderAttempt: positiveId,
  workflowSha: z.string().regex(/^[a-f0-9]{40}$/u),
  unsignedFiles: z.array(fileSchemaV2).min(1).optional(),
  signer: signerIdentitySchema.optional(),
})

const manifestSchemaV1 = z.strictObject({
  schemaVersion: z.literal(1),
  source: sourceSchema,
  files: z.array(fileSchemaV1).min(1),
})

const manifestSchemaV2 = z.strictObject({
  schemaVersion: z.literal(2),
  source: sourceSchema,
  files: z.array(fileSchemaV2).min(1),
  buildIdentity: buildIdentitySchema,
})
  .refine(manifest => manifest.source.qualification !== 'signed' || manifest.buildIdentity.signer !== undefined,
    'Signed manifest requires signer identity')
  .refine(manifest => (manifest.source.qualification !== 'unsigned' && manifest.source.qualification !== 'unnotarized')
    || manifest.buildIdentity.signer === undefined,
  'Debugging manifest cannot carry signer identity')

const manifestSchema = z.union([manifestSchemaV2, manifestSchemaV1])

/** Public, credential-free identity of one packaging attempt. */
export type DesktopRetainedSource = z.infer<typeof sourceSchema>
/** Signer identity attached only by an isolated signing job. */
export type DesktopSignerIdentity = z.infer<typeof signerIdentitySchema>
/** Build and optional signing identity for schemaVersion 2 manifests. */
export type DesktopRetainedBuildIdentity = z.infer<typeof buildIdentitySchema>
/** Dual-hash file inventory entry in schemaVersion 2 manifests. */
export type DesktopRetainedFileV2 = z.infer<typeof fileSchemaV2>
/** File inventory bound to a schemaVersion 2 packaging attempt. */
export type DesktopRetainedManifestV2 = z.infer<typeof manifestSchemaV2>
/** File inventory bound to the source packaging attempt (v1 read-only or v2). */
export type DesktopRetainedManifest = z.infer<typeof manifestSchema>

/**
 * Compute size, SHA-256 hex, and SHA-512 base64 in a single streaming pass.
 * @param path Regular file path on disk.
 * @returns Size and dual cryptographic digests.
 */
export async function fingerprintDesktopFile(path: string): Promise<{ size: number; sha256: string; sha512: string }> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('desktop release store: expected a regular file')
  const sha256 = createHash('sha256')
  const sha512 = createHash('sha512')
  let size = 0
  for await (const bytes of createReadStream(path)) {
    size += bytes.length
    sha256.update(bytes)
    sha512.update(bytes)
  }
  if (size === 0) throw new Error('desktop release store: empty artifact')
  return { size, sha256: sha256.digest('hex'), sha512: sha512.digest('base64') }
}

async function directory(path: string): Promise<string> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('desktop release store: expected a real directory')
  return realpath(path)
}

/**
 * Resolve an attempt beneath an absolute, machine-owned releases root.
 * @param root Persistent releases directory, outside the checkout.
 * @param runId GitHub packaging run ID.
 * @param attempt Packaging attempt, not the publishing attempt.
 * @returns Deterministic path after validating both identifiers.
 */
export function retainedDesktopPath(root: string, runId: string, attempt: string): string {
  if (!isAbsolute(root)) throw new Error('desktop release store: root must be absolute')
  positiveId.parse(runId)
  positiveId.parse(attempt)
  return join(root, runId, attempt)
}

/**
 * Copy an explicit file inventory, verify the copies, then expose one complete v2 attempt atomically.
 * @param root Persistent releases root owned by this runner.
 * @param source Packaging identity and selected public settings.
 * @param paths Complete artifact and completion-record paths; directory trees are not accepted.
 * @param buildIdentity Packaging and signing identity; defaults the builder fields from source.
 * @returns Published attempt directory. An existing attempt is never replaced.
 */
export async function retainDesktopRelease(
  root: string,
  source: DesktopRetainedSource,
  paths: readonly string[],
  buildIdentity?: DesktopRetainedBuildIdentity,
): Promise<string> {
  sourceSchema.parse(source)
  const resolvedBuildIdentity: DesktopRetainedBuildIdentity = buildIdentity ?? {
    builderRunner: source.runnerName,
    builderRunId: source.runId,
    builderAttempt: source.attempt,
    workflowSha: source.workflowCommit,
  }
  buildIdentitySchema.parse(resolvedBuildIdentity)
  const destination = retainedDesktopPath(root, source.runId, source.attempt)
  const names = paths.map(path => filename.parse(basename(path)))
  if (names.length === 0 || new Set(names).size !== names.length) throw new Error('desktop release store: empty or duplicate file inventory')
  await mkdir(root, { recursive: true, mode: 0o700 })
  await directory(root)
  const parent = join(root, source.runId)
  await mkdir(parent, { recursive: true, mode: 0o700 })
  await directory(parent)
  const claim = join(parent, `${source.attempt}.lock`)
  await mkdir(claim, { mode: 0o700 })
  let staging: string | undefined
  try {
    try {
      await lstat(destination)
      throw new Error('desktop release store: attempt already exists')
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    }
    staging = await mkdtemp(join(parent, '.retaining-'))
    const files: DesktopRetainedFileV2[] = []
    for (const path of paths) {
      const name = basename(path)
      if (name === 'manifest.json') throw new Error('desktop release store: manifest filename is reserved')
      const before = await fingerprintDesktopFile(path)
      const copied = join(staging, name)
      await copyFile(path, copied, constants.COPYFILE_EXCL)
      const after = await fingerprintDesktopFile(copied)
      if (before.size !== after.size || before.sha256 !== after.sha256 || before.sha512 !== after.sha512) {
        throw new Error('desktop release store: source changed during retention')
      }
      files.push({ name, ...after })
    }
    const manifest: DesktopRetainedManifestV2 = {
      schemaVersion: 2,
      source,
      files,
      buildIdentity: resolvedBuildIdentity,
    }
    manifestSchemaV2.parse(manifest)
    await writeFile(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600, flush: true })
    await rename(staging, destination)
    staging = undefined
    return destination
  } finally {
    if (staging !== undefined) await rm(staging, { recursive: true, force: true })
    await rm(claim, { recursive: true })
  }
}

/**
 * Read and validate manifest identity without requiring unrelated retained files.
 * @param root Persistent releases root.
 * @param runId Expected source run ID.
 * @param attempt Expected source attempt.
 * @returns Parsed inventory; consumers must verify the files they use against their recorded digests.
 */
export async function readRetainedDesktopManifest(root: string, runId: string, attempt: string): Promise<DesktopRetainedManifest> {
  const path = retainedDesktopPath(root, runId, attempt)
  await directory(root)
  await directory(join(root, runId))
  await directory(path)
  const manifestPath = join(path, 'manifest.json')
  if (!(await lstat(manifestPath)).isFile() || (await lstat(manifestPath)).isSymbolicLink()) throw new Error('desktop release store: invalid manifest file')
  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')))
  if (manifest.source.runId !== runId || manifest.source.attempt !== attempt) throw new Error('desktop release store: attempt identity mismatch')
  if (new Set(manifest.files.map(file => file.name)).size !== manifest.files.length) throw new Error('desktop release store: duplicate file inventory')
  return manifest
}

/**
 * Verify every retained file against its immutable build manifest.
 * @param root Persistent releases directory.
 * @param runId Original packaging run.
 * @param attempt Original packaging attempt, unchanged by archival reruns.
 * @returns Manifest after all retained files pass size and hash verification.
 */
export async function verifyRetainedDesktopRelease(root: string, runId: string, attempt: string): Promise<DesktopRetainedManifest> {
  const manifest = await readRetainedDesktopManifest(root, runId, attempt)
  const path = retainedDesktopPath(root, runId, attempt)
  for (const file of manifest.files) {
    const current = await fingerprintDesktopFile(join(path, file.name))
    if (current.size !== file.size || current.sha512 !== file.sha512
      || ('sha256' in file && current.sha256 !== file.sha256)) {
      throw new Error(`desktop release store: changed file ${file.name}`)
    }
  }
  return manifest
}

/**
 * Enforce that a retained manifest is v2, signed/notarized, and carries a valid build identity for publication.
 * Legacy v1 manifests are readable for audit only and are never eligible for publication.
 * @param manifest Verified retained manifest.
 * @returns Narrowed v2 manifest.
 */
export function assertPublishableDesktopManifest(manifest: DesktopRetainedManifest): DesktopRetainedManifestV2 {
  if (manifest.schemaVersion !== 2) {
    throw new Error('desktop release store: legacy schemaVersion 1 manifest is read-only and not eligible for publication')
  }
  const diagnostic = desktopPublishQualificationError(manifest.source.qualification)
  if (diagnostic) throw new Error(diagnostic)
  const expectedQualification = manifest.source.target === 'win-x64' ? 'signed' : 'notarized'
  if (manifest.source.qualification !== expectedQualification) {
    throw new Error('desktop publish: package qualification does not match its platform')
  }
  if (manifest.source.target === 'win-x64' && !manifest.buildIdentity.signer) {
    throw new Error('desktop release store: signed Windows manifest requires signer identity')
  }
  return manifest
}
