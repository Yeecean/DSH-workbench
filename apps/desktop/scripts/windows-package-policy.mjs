/** Fail-closed source, preset, and signing authorization policy for Windows packaging. */
import { appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const RELEASE_TAG_PATTERN = /^dsh-v[0-9][0-9A-Za-z.-]*$/u
const REPOSITORY_PATTERN = /^[\w.-]+\/[\w.-]+$/u
const SHA_PATTERN = /^[a-f0-9]{40}$/iu
const INVALID_REF_PATTERN = /(?:^\/|\/$|\.\.|\/\/|@\{|[\s~^:?*[\]\\])/u

/**
 * Validate raw source_ref syntax before any checkout or API call.
 * @param {unknown} sourceRef User-supplied branch or tag name.
 * @returns {string} Trimmed valid ref name.
 */
export function validateSourceRefSyntax(sourceRef) {
  if (typeof sourceRef !== 'string') throw new Error('windows package policy: source_ref must be a string')
  const trimmed = sourceRef.trim()
  if (trimmed === '' || trimmed !== sourceRef) throw new Error('windows package policy: source_ref cannot be empty or padded')
  if (trimmed.startsWith('refs/') || trimmed === 'HEAD' || trimmed === 'FETCH_HEAD') {
    throw new Error('windows package policy: source_ref must be a branch or release tag name, not a raw ref or HEAD')
  }
  if (SHA_PATTERN.test(trimmed)) {
    throw new Error('windows package policy: raw commit SHAs are not permitted as source_ref')
  }
  if (INVALID_REF_PATTERN.test(trimmed)) {
    throw new Error('windows package policy: source_ref contains invalid git ref characters')
  }
  return trimmed
}

/**
 * Classify a validated source_ref into its trust category.
 * @param {string} sourceRef Validated ref name.
 * @param {'branch' | 'tag' | 'sha' | 'pr' | 'external' | 'unknown'} [refKind] Resolved ref kind from GitHub API.
 * @returns {'master' | 'release-tag' | 'dev-branch' | 'untrusted'} Source category.
 */
export function classifySourceRef(sourceRef, refKind = 'unknown') {
  if (refKind === 'sha' || refKind === 'pr' || refKind === 'external') return 'untrusted'
  if (refKind === 'tag') return RELEASE_TAG_PATTERN.test(sourceRef) ? 'release-tag' : 'untrusted'
  if (RELEASE_TAG_PATTERN.test(sourceRef)) return 'release-tag'
  if (sourceRef === 'master') return 'master'
  return 'dev-branch'
}

/**
 * Evaluate the P8-S1 Windows packaging authorization matrix (deny-by-default, fail-closed on signed).
 * @param {{
 *   repository?: string,
 *   expectedRepository?: string,
 *   sourceRef: string,
 *   refKind?: 'branch' | 'tag' | 'sha' | 'pr' | 'external' | 'unknown',
 *   preset: string,
 *   signing: string,
 *   updateChannel?: string,
 *   versionMode?: string,
 *   compressionLevel?: string,
 * }} input Policy evaluation inputs.
 * @returns {{ allowed: true, sourceKind: 'master' | 'release-tag' | 'dev-branch', preset: 'test', signing: 'unsigned', sourceRef: string } | { allowed: false, reason: string, sourceKind: string }}
 */
export function evaluateWindowsPackagePolicy(input) {
  if (input.repository !== undefined) {
    if (!REPOSITORY_PATTERN.test(input.repository)) {
      return { allowed: false, reason: 'windows package policy: invalid repository identifier', sourceKind: 'untrusted' }
    }
    if (input.expectedRepository !== undefined && input.repository !== input.expectedRepository) {
      return { allowed: false, reason: 'windows package policy: external or mismatched repository is not permitted', sourceKind: 'untrusted' }
    }
  }

  let sourceRef
  try {
    sourceRef = validateSourceRefSyntax(input.sourceRef)
  } catch (error) {
    return { allowed: false, reason: error instanceof Error ? error.message : String(error), sourceKind: 'untrusted' }
  }

  const sourceKind = classifySourceRef(sourceRef, input.refKind)
  if (sourceKind === 'untrusted') {
    return {
      allowed: false,
      reason: 'windows package policy: untrusted source_ref (non-whitelist tag, PR ref, SHA, or external origin is rejected)',
      sourceKind,
    }
  }

  if (input.preset !== 'test' && input.preset !== 'production') {
    return { allowed: false, reason: 'windows package policy: preset must be test or production', sourceKind }
  }

  if (input.signing !== 'unsigned' && input.signing !== 'signed') {
    return { allowed: false, reason: 'windows package policy: signing must be unsigned or signed', sourceKind }
  }

  if (input.updateChannel !== undefined && input.updateChannel !== 'nightly' && input.updateChannel !== 'stable') {
    return { allowed: false, reason: 'windows package policy: update_channel must be nightly or stable', sourceKind }
  }

  if (input.versionMode !== undefined
    && !['default', 'follow-dsh', 'build-number', 'manual', 'product', 'auto'].includes(input.versionMode)) {
    return { allowed: false, reason: 'windows package policy: invalid version_mode', sourceKind }
  }

  if (input.compressionLevel !== undefined && input.compressionLevel !== '3' && input.compressionLevel !== '7') {
    return { allowed: false, reason: 'windows package policy: compression_level must be 3 or 7', sourceKind }
  }

  if (input.signing === 'signed') {
    if (sourceKind === 'dev-branch') {
      return {
        allowed: false,
        reason: 'windows package policy: signed packaging is rejected for development branches',
        sourceKind,
      }
    }
    return {
      allowed: false,
      reason: 'windows package policy: signed packaging is disabled in P8-S1 (fail-closed) until S2 physical signer isolation, GitHub Environment approvals, and PIN-less signing are deployed',
      sourceKind,
    }
  }

  if (input.preset === 'production') {
    return {
      allowed: false,
      reason: 'windows package policy: production preset cannot be packaged as unsigned; unsigned builds are restricted to test preset for internal debugging only',
      sourceKind,
    }
  }

  return { allowed: true, sourceKind, preset: 'test', signing: 'unsigned', sourceRef }
}

/**
 * Assert that the packaging request is authorized, throwing on any policy violation.
 * @param {Parameters<typeof evaluateWindowsPackagePolicy>[0]} input Policy evaluation inputs.
 * @returns {Extract<ReturnType<typeof evaluateWindowsPackagePolicy>, { allowed: true }>}
 */
export function assertWindowsPackagePolicy(input) {
  const decision = evaluateWindowsPackagePolicy(input)
  if (!decision.allowed) throw new Error(decision.reason)
  return decision
}

/**
 * Resolve whether a source_ref is a branch or tag in the repository without checking out untrusted code.
 * @param {string} repository Owner/repo slug.
 * @param {string} sourceRef Validated branch or tag name.
 * @param {NodeJS.ProcessEnv} env Actions environment with optional GH_TOKEN / GITHUB_API_URL.
 * @returns {Promise<{ refKind: 'branch' | 'tag', resolvedSha: string }>}
 */
export async function resolveRepositorySourceRef(repository, sourceRef, env) {
  const token = env.GH_TOKEN || env.GITHUB_TOKEN
  if (!token) throw new Error('windows package policy: GH_TOKEN is required to verify source_ref in preflight')
  const apiBase = (env.GITHUB_API_URL || 'https://api.github.com').replace(/\/+$/u, '')
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }

  const headResponse = await fetch(`${apiBase}/repos/${repository}/git/ref/heads/${encodeURIComponent(sourceRef)}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (headResponse.ok) {
    const data = await headResponse.json()
    const sha = data?.object?.sha
    if (typeof sha === 'string' && SHA_PATTERN.test(sha)) return { refKind: 'branch', resolvedSha: sha.toLowerCase() }
  } else if (headResponse.status !== 404) {
    throw new Error(`windows package policy: GitHub branch lookup failed (HTTP ${headResponse.status})`)
  }

  const tagResponse = await fetch(`${apiBase}/repos/${repository}/git/ref/tags/${encodeURIComponent(sourceRef)}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (tagResponse.ok) {
    const data = await tagResponse.json()
    const obj = data?.object
    if (obj?.type === 'tag' && typeof obj.sha === 'string') {
      const annotated = await fetch(`${apiBase}/repos/${repository}/git/tags/${obj.sha}`, {
        headers,
        signal: AbortSignal.timeout(30_000),
      })
      if (!annotated.ok) throw new Error(`windows package policy: GitHub tag object lookup failed (HTTP ${annotated.status})`)
      const tagData = await annotated.json()
      const sha = tagData?.object?.sha
      if (typeof sha === 'string' && SHA_PATTERN.test(sha)) return { refKind: 'tag', resolvedSha: sha.toLowerCase() }
    }
    if (typeof obj?.sha === 'string' && SHA_PATTERN.test(obj.sha)) return { refKind: 'tag', resolvedSha: obj.sha.toLowerCase() }
  } else if (tagResponse.status !== 404) {
    throw new Error(`windows package policy: GitHub tag lookup failed (HTTP ${tagResponse.status})`)
  }

  throw new Error(`windows package policy: source_ref "${sourceRef}" does not resolve to a branch or tag in ${repository}`)
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === import.meta.filename) {
  const env = process.env
  const repository = env.GITHUB_REPOSITORY
  if (!repository) throw new Error('windows package policy: GITHUB_REPOSITORY is required')
  const sourceRef = validateSourceRefSyntax(env.PACKAGE_SOURCE_REF)
  // Fail closed on syntax/matrix before making any network calls when signing=signed or preset=production.
  assertWindowsPackagePolicy({
    repository,
    sourceRef,
    preset: env.DSH_PACKAGING_PRESET ?? '',
    signing: env.PACKAGE_SIGNING ?? '',
    updateChannel: env.DSH_DESKTOP_UPDATE_CHANNEL,
    versionMode: env.PACKAGE_VERSION_MODE,
    compressionLevel: env.PACKAGE_WINDOWS_COMPRESSION_LEVEL,
  })
  const { refKind, resolvedSha } = await resolveRepositorySourceRef(repository, sourceRef, env)
  const decision = assertWindowsPackagePolicy({
    repository,
    sourceRef,
    refKind,
    preset: env.DSH_PACKAGING_PRESET ?? '',
    signing: env.PACKAGE_SIGNING ?? '',
    updateChannel: env.DSH_DESKTOP_UPDATE_CHANNEL,
    versionMode: env.PACKAGE_VERSION_MODE,
    compressionLevel: env.PACKAGE_WINDOWS_COMPRESSION_LEVEL,
  })
  if (env.GITHUB_OUTPUT) {
    await appendFile(env.GITHUB_OUTPUT, [
      'allowed=true',
      `signing=${decision.signing}`,
      `preset=${decision.preset}`,
      `source_ref=${decision.sourceRef}`,
      `source_kind=${decision.sourceKind}`,
      `ref_kind=${refKind}`,
      `resolved_sha=${resolvedSha}`,
    ].join('\n') + '\n')
  }
  if (env.GITHUB_STEP_SUMMARY) {
    await appendFile(env.GITHUB_STEP_SUMMARY,
      `Windows packaging preflight passed: \`${decision.preset}\` / \`${decision.signing}\` from \`${decision.sourceRef}\` (${refKind} @ \`${resolvedSha}\`).\n`)
  }
}
