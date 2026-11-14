import { expectDesktopArchive } from './desktop-archive-workflow-test.ts'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { parse, resolve } from 'node:path'
import yaml from 'js-yaml'
import { expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
type WorkflowInput = { type?: string; required?: boolean; default?: string; description?: string; options?: string[] }
const workflow = yaml.load(readFileSync(resolve(root, '.github/workflows/windows-package.yml'), 'utf8')) as {
  on: Record<string, { inputs: Record<string, WorkflowInput> }>
  permissions: Record<string, string>
  concurrency: { group: string; 'cancel-in-progress': boolean }
  jobs: Record<string, {
    defaults?: { run: { shell: string } }
    needs?: string | string[]
    if?: string
    environment?: string
    'runs-on': string | string[]
    env?: Record<string, string>
    outputs?: Record<string, string>
    steps: Array<{
      id?: string
      name?: string
      uses?: string
      run?: string
      if?: string
      'working-directory'?: string
      env?: Record<string, string>
      with?: Record<string, unknown>
    }>
  }>
}
const preflight = workflow.jobs['preflight-policy']!
const buildJob = workflow.jobs.build!
const signJob = workflow.jobs.sign!

it.skipIf(process.platform !== 'win32')('resets only the allocated checkout without following dependency junctions', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'windows-checkout-'))
  try {
    const parent = resolve(directory, 'runner-workspace')
    const workspace = resolve(parent, 'repository')
    const external = resolve(directory, 'external')
    mkdirSync(workspace, { recursive: true })
    mkdirSync(external)
    writeFileSync(resolve(external, 'keep.txt'), 'keep')
    symlinkSync(external, resolve(workspace, 'node_modules'), 'junction')
    const script = resolve(directory, 'reset.ps1')
    writeFileSync(script, buildJob.steps.find(step => step.name === 'Reset packaging checkout')!.run!)
    const run = (target: string) => execFileSync('pwsh', ['-NoProfile', '-File', script], {
      cwd: directory,
      env: { ...process.env, RUNNER_WORKSPACE: parent, GITHUB_WORKSPACE: target },
      stdio: 'pipe',
    })
    run(workspace)
    expect(existsSync(workspace)).toBe(true)
    expect(existsSync(resolve(workspace, 'node_modules'))).toBe(false)
    expect(readFileSync(resolve(external, 'keep.txt'), 'utf8')).toBe('keep')
    expect(() => run(external)).toThrow()
    rmSync(workspace, { recursive: true })
    symlinkSync(external, workspace, 'junction')
    expect(() => run(workspace)).toThrow()
    expect(readFileSync(resolve(external, 'keep.txt'), 'utf8')).toBe('keep')
  } finally {
    rmSync(directory, { recursive: true, force: true, maxRetries: 3 })
  }
})

it('defaults to unsigned and runs keyless preflight-policy before any self-hosted runner', () => {
  expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch'])
  expect(workflow.on.workflow_dispatch).toMatchObject({ inputs: { version_mode: { default: 'default', options: ['default', 'follow-dsh', 'build-number', 'manual'] } } })
  expect(workflow.concurrency).toEqual({ group: 'windows-desktop-package', 'cancel-in-progress': false })
  expect(workflow.permissions).toEqual({ contents: 'read' })
  expect(Object.keys(workflow.on.workflow_dispatch!.inputs).sort()).toEqual([
    'build_version', 'cache_namespace', 'compression_level', 'preset', 'signing', 'source_ref', 'test_release_id', 'update_channel', 'version_mode',
  ])
  expect(workflow.on.workflow_dispatch!.inputs.signing!.default).toBe('unsigned')
  expect(workflow.on.workflow_dispatch!.inputs.signing!.options).toEqual(['unsigned', 'signed'])
  expect(workflow.on.workflow_dispatch!.inputs.compression_level).toMatchObject({ type: 'choice', options: ['3', '7'], default: '3', required: true })
  expect(workflow.on.workflow_dispatch!.inputs.build_version!.required).toBe(false)
  expect(workflow.on.workflow_dispatch!.inputs.version_mode!.default).toBe('default')
  expect(workflow.on.workflow_dispatch!.inputs.source_ref!.default).toBe('master')
  expect(workflow.on.workflow_dispatch!.inputs.update_channel!.default).toBe('nightly')

  expect(preflight['runs-on']).toBe('ubuntu-latest')
  expect(preflight.needs).toBeUndefined()
  expect(preflight.steps[0]!.with).toMatchObject({
    ref: '${{ github.workflow_sha }}',
    'sparse-checkout': 'apps/desktop/scripts',
    'persist-credentials': false,
  })
  expect(preflight.steps.some(step => step.run?.includes('pnpm install'))).toBe(false)
  expect(preflight.steps.find(step => step.id === 'policy')?.run).toBe('node apps/desktop/scripts/windows-package-policy.mjs')
})

it('isolates keyless builder from isolated fail-closed signer and blocks unsigned from publish', () => {
  expect(buildJob.needs).toBe('preflight-policy')
  expect(buildJob.if).toBe("${{ needs.preflight-policy.outputs.allowed == 'true' && needs.preflight-policy.outputs.signing == 'unsigned' }}")
  expect(buildJob['runs-on']).toBe('dsh-win-builder')
  expect(buildJob.env?.PACKAGE_SIGNING).toBe('unsigned')
  expect(buildJob.env?.PACKAGE_WINDOWS_COMPRESSION_LEVEL).toBe('${{ inputs.compression_level }}')
  expect(buildJob.env?.PACKAGE_VERSION_MODE).toBe("${{ inputs.version_mode == 'follow-dsh' && 'product' || inputs.version_mode == 'build-number' && 'auto' || inputs.version_mode }}")
  expect(buildJob.env?.PACKAGE_SOURCE_REF).toBe('${{ inputs.source_ref }}')
  expect(buildJob.env?.DSH_DESKTOP_UPDATE_CHANNEL).toBe('${{ inputs.update_channel }}')
  expect(buildJob.env?.DSH_PACKAGING_PRESET).toBe('${{ inputs.preset }}')
  expect(JSON.stringify(buildJob.env)).not.toContain('runner.')
  expect(buildJob.steps.find(step => step.name === 'Configure persistent pnpm store')?.env?.DSH_DESKTOP_PACKAGE_CACHE_DIR)
    .toBe('${{ runner.tool_cache }}/dsh-desktop-package-cache')
  expect(buildJob.steps.find(step => step.id === 'checkout')!.with).toMatchObject({ clean: true, 'persist-credentials': false, ref: '${{ inputs.source_ref }}' })
  expect(buildJob.steps.find(step => step.uses?.startsWith('pnpm/action-setup@'))?.with?.dest)
    .toBe('${{ runner.temp }}/setup-pnpm-${{ github.run_id }}-${{ github.run_attempt }}')

  // Signer skeleton: isolated runner + Environment approval gate + no untrusted source_ref checkout + S1 fail-closed.
  expect(signJob.needs).toEqual(['preflight-policy', 'build'])
  expect(signJob.if).toBe("${{ needs.preflight-policy.outputs.allowed == 'true' && needs.preflight-policy.outputs.signing == 'signed' }}")
  expect(signJob['runs-on']).toBe('dsh-win-signer-isolated')
  expect(signJob.environment).toBe("${{ inputs.preset == 'production' && 'windows-sign-production' || 'windows-sign-test' }}")
  expect(signJob.steps.some(step => typeof step.with?.ref === 'string' && step.with.ref.includes('inputs.source_ref'))).toBe(false)
  expect(signJob.steps.some(step => step.run?.includes('pnpm install'))).toBe(false)
  expect(signJob.steps.some(step => step.run?.includes('windows-sign.cmd'))).toBe(false)
  expect(signJob.steps.at(-1)?.run).toContain('exit 1')
})

it('validates before building and always passes --unsigned to builder commands', () => {
  const settings = buildJob.steps.find(step => step.id === 'settings')!
  expect(settings.env).toEqual({ PACKAGE_BUILD_VERSION: '${{ inputs.build_version }}' })
  const commands = buildJob.steps.filter(step => step.run?.includes('package:desktop:win:x64'))
  expect(commands).toHaveLength(2)
  expect(commands[0]!.run).toContain("'--check'")
  for (const step of commands) {
    expect(step.env?.PACKAGE_VERSION).toBe('${{ steps.settings.outputs.version }}')
    expect(step.run).toContain("'--unsigned'")
    expect(step.run).toContain('exit $LASTEXITCODE')
  }
  for (const step of buildJob.steps) expect(step.run ?? '').not.toContain('${{ inputs.')
  expect(buildJob.steps.indexOf(settings)).toBeLessThan(buildJob.steps.indexOf(commands[0]!))
  expect(buildJob.steps.some(step => step.run?.includes('.env.windows'))).toBe(false)
})

it('retains failure diagnostics and uploads only unsigned debugging artifacts', () => {
  const uploads = buildJob.steps.filter(step => step.uses?.startsWith('actions/upload-artifact@'))
  expect(uploads).toHaveLength(1)
  const archive = workflow.jobs['upload-artifact']!
  const archival = expectDesktopArchive(archive, 1, 'build')
  expect(archive.needs).toEqual(['preflight-policy', 'build'])
  expect(archive.if).toBe("${{ success() && needs.preflight-policy.outputs.signing == 'unsigned' }}")
  expect(archive['runs-on']).toEqual(['self-hosted', '${{ needs.build.outputs.runner }}'])
  expect(uploads[0]!.if).toBe("always() && steps.checkout.outcome == 'success'")
  expect(uploads[0]!.with).toMatchObject({
    path: '${{ github.workspace }}/apps/desktop/.desktop-build/packaging-runs/',
    'include-hidden-files': true,
  })
  expect(archive.env?.DESKTOP_ARCHIVE_NAME).toBe('windows-x64-unsigned-${{ needs.build.outputs.version }}-${{ github.run_id }}-${{ needs.build.outputs.attempt }}.zip')
  expect(archival[0]!.with).toMatchObject({ path: '${{ steps.archive.outputs.path }}', 'if-no-files-found': 'error', archive: false, overwrite: true, name: '${{ env.DESKTOP_ARCHIVE_NAME }}' })
})

it('normalizes priority in the dependency and packaging shells before launching their children', () => {
  const command = '& "$env:PACKAGE_CI_HELPERS/windows-packaging-priority.ps1" -BestEffort'
  expect(buildJob.steps.find(entry => entry.name === 'Validate selected source and adapter support')!.run)
    .not.toContain('windows-packaging-priority.ps1')
  for (const name of ['Install locked dependencies', 'Build installer and verify packaged runtime']) {
    const step = buildJob.steps.find(entry => entry.name === name)!
    expect(step.run!.trimStart().startsWith(command + '\n')).toBe(true)
  }
})

it.skipIf(process.platform !== 'win32')('keeps the dependency store stable across run-specific pnpm homes', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'windows-package-store-'))
  try {
    const workspace = resolve(directory, 'runner', 'repo')
    const packageCache = resolve(directory, 'tool-cache', 'desktop')
    const store = resolve(parse(directory).root, '.pnpm-store')
    const step = buildJob.steps.find(entry => entry.name === 'Configure persistent pnpm store')!
    expect(buildJob.steps.indexOf(step)).toBeLessThan(buildJob.steps.findIndex(entry => entry.name === 'Install locked dependencies'))
    const script = resolve(directory, 'store.ps1')
    writeFileSync(script, "$ErrorActionPreference = 'Stop'\n" + step.run!)

    // Run all valid and invalid cases inside a single pwsh process to avoid 9x cold-start overhead.
    const harness = resolve(directory, 'harness.ps1')
    const invalidCases = ['../escape', 'Upper', 'has space', 'con', 'perf\n', 'a'.repeat(65)]
    const validCases = [
      { id: 'first', namespace: '' },
      { id: 'second', namespace: '' },
      { id: 'perf', namespace: 'perf-1' },
    ]
    writeFileSync(harness, [
      'param([string]$StoreScript, [string]$Workspace, [string]$PackageCache, [string]$Dir)',
      "$ErrorActionPreference = 'Stop'",
      'function Invoke-StoreCase([string]$Namespace, [string]$OutFile) {',
      '  $env:GITHUB_WORKSPACE = $Workspace',
      '  $env:PACKAGE_CACHE_NAMESPACE = $Namespace',
      '  $env:DSH_DESKTOP_PACKAGE_CACHE_DIR = $PackageCache',
      '  $env:GITHUB_ENV = $OutFile',
      '  & $StoreScript',
      '}',
      ...validCases.map(c => `Invoke-StoreCase ${JSON.stringify(c.namespace)} ${JSON.stringify(resolve(directory, `${c.id}.env`))}`),
      ...invalidCases.map((inv, idx) => [
        '$threw = $false',
        `try { Invoke-StoreCase ${JSON.stringify(inv)} ${JSON.stringify(resolve(directory, `invalid-${idx}.env`))} } catch { $threw = $true }`,
        `if (-not $threw) { throw "Expected failure for invalid namespace index ${idx}" }`,
      ].join('\n')),
    ].join('\n'))

    execFileSync('pwsh', [
      '-NoProfile', '-File', harness,
      '-StoreScript', script,
      '-Workspace', workspace,
      '-PackageCache', packageCache,
      '-Dir', directory,
    ], { stdio: 'pipe' })

    for (const id of ['first', 'second']) {
      expect(readFileSync(resolve(directory, `${id}.env`), 'utf8').trim().split(/\r?\n/u)).toEqual([
        `DSH_DESKTOP_PACKAGE_CACHE_DIR=${packageCache}`,
        `PNPM_CONFIG_STORE_DIR=${store}`,
      ])
    }
    expect(readFileSync(resolve(directory, 'perf.env'), 'utf8').trim().split(/\r?\n/u)).toEqual([
      `DSH_DESKTOP_PACKAGE_CACHE_DIR=${resolve(packageCache, 'perf-1')}`,
      `PNPM_CONFIG_STORE_DIR=${resolve(store, 'perf-1')}`,
    ])
  } finally {
    rmSync(directory, { recursive: true, force: true, maxRetries: 3 })
  }
})

it('pins environment helpers to the workflow commit before selecting product source', () => {
  const helper = buildJob.steps.find(step => step.name === 'Checkout workflow helpers')!
  const stage = buildJob.steps.find(step => step.name === 'Stage workflow helpers')!
  const source = buildJob.steps.find(step => step.id === 'checkout')!
  expect(helper.with).toMatchObject({ ref: '${{ github.workflow_sha }}', 'persist-credentials': false })
  expect(buildJob.steps.indexOf(helper)).toBeLessThan(buildJob.steps.indexOf(stage))
  expect(buildJob.steps.indexOf(stage)).toBeLessThan(buildJob.steps.indexOf(source))
  expect(stage.run).toContain('RUNNER_TEMP')
  expect(stage.run).toContain('windows-packaging-priority.ps1')
  expect(stage.run).toContain('windows-package-policy.mjs')
  for (const step of buildJob.steps.filter(step => step.name !== 'Stage workflow helpers')) {
    expect(step.run ?? '').not.toContain('./apps/desktop/scripts/windows-packaging-priority.ps1')
  }
})

it.skipIf(process.platform !== 'win32')('stages helpers that remain usable when product source lacks them', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'workflow-helpers-'))
  try {
    const source = resolve(directory, 'source')
    const scripts = resolve(source, 'apps/desktop/scripts')
    const temporary = resolve(directory, 'temporary')
    mkdirSync(scripts, { recursive: true })
    mkdirSync(temporary)
    for (const name of ['windows-packaging-priority.ps1', 'windows-package-policy.mjs']) {
      writeFileSync(resolve(scripts, name), readFileSync(resolve(root, 'apps/desktop/scripts', name)))
    }
    const stage = resolve(directory, 'stage.ps1')
    writeFileSync(stage, buildJob.steps.find(step => step.name === 'Stage workflow helpers')!.run!)
    const env = { ...process.env, RUNNER_TEMP: temporary, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1', GITHUB_ENV: resolve(directory, 'env') }
    execFileSync('pwsh', ['-NoProfile', '-File', stage], { cwd: source, env, stdio: 'pipe' })
    rmSync(scripts, { recursive: true })
    const helper = resolve(temporary, 'packaging-helpers-123-1/windows-packaging-priority.ps1')
    expect(execFileSync('pwsh', ['-NoProfile', '-File', helper, '-InspectOnly'], { cwd: source, stdio: 'pipe' }).toString())
      .toContain('packaging-process-priority')
    expect(() => execFileSync('pwsh', ['-NoProfile', '-File', stage], {
      cwd: source, env: { ...env, GITHUB_RUN_ATTEMPT: '2' }, stdio: 'pipe',
    })).toThrow()
  } finally {
    rmSync(directory, { recursive: true, force: true, maxRetries: 3 })
  }
})

it('archives with native PowerShell and the persistent packaging store', () => {
  const archival = workflow.jobs['upload-artifact']!
  expect(archival.defaults?.run.shell).toBe('pwsh')
  expect(archival.steps.find(step => step.name === 'Configure persistent pnpm store')?.run)
    .toBe(buildJob.steps.find(step => step.name === 'Configure persistent pnpm store')?.run)
})
