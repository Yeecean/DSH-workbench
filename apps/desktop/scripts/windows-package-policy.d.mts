export const RELEASE_TAG_PATTERN: RegExp
export function validateSourceRefSyntax(sourceRef: unknown): string
export function classifySourceRef(
  sourceRef: string,
  refKind?: 'branch' | 'tag' | 'sha' | 'pr' | 'external' | 'unknown',
): 'master' | 'release-tag' | 'dev-branch' | 'untrusted'
export function evaluateWindowsPackagePolicy(input: {
  repository?: string
  expectedRepository?: string
  sourceRef: string
  refKind?: 'branch' | 'tag' | 'sha' | 'pr' | 'external' | 'unknown'
  preset: string
  signing: string
  updateChannel?: string
  versionMode?: string
  compressionLevel?: string
}): { allowed: true; sourceKind: 'master' | 'release-tag' | 'dev-branch'; preset: 'test'; signing: 'unsigned'; sourceRef: string } | { allowed: false; reason: string; sourceKind: string }
export function assertWindowsPackagePolicy(input: Parameters<typeof evaluateWindowsPackagePolicy>[0]): {
  allowed: true
  sourceKind: 'master' | 'release-tag' | 'dev-branch'
  preset: 'test'
  signing: 'unsigned'
  sourceRef: string
}
export function resolveRepositorySourceRef(
  repository: string,
  sourceRef: string,
  env: NodeJS.ProcessEnv,
): Promise<{ refKind: 'branch' | 'tag'; resolvedSha: string }>
