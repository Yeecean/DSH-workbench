/** Run built Desktop Host task protection in a private development profile without Electron or installation. */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDevelopmentProjectMetadata } from '../src/project-manager.ts'
import { removeOwnedDirectory } from '../src/owned-directory.ts'
import { DESKTOP_HOST_PROTOCOL_VERSION } from '../src/host-protocol.ts'
import { linkWorkspaceNodeModules } from './development-project.ts'

const repo = resolve(import.meta.dirname, '../../..')
const evidenceRoot = join(repo, 'apps/desktop/.desktop-build/qualification')
await mkdir(evidenceRoot, { recursive: true })
const root = await mkdtemp(join(evidenceRoot, 'host-updates-'))
const project = join(root, 'project')
const manifest = JSON.parse(await readFile(join(repo, 'apps/desktop/package.json'), 'utf8')) as { version: string }
const pnpm = JSON.parse(await readFile(join(repo, 'apps/desktop/node_modules/pnpm/package.json'), 'utf8')) as { version: string }
try {
  createDevelopmentProjectMetadata(project, {
    schemaVersion: 1, version: manifest.version, nodeVersion: process.versions.node,
    pnpmVersion: pnpm.version, hostProtocolVersion: DESKTOP_HOST_PROTOCOL_VERSION,
  })
  // Resolve pnpm dependency links to real paths so relative workspace symlinks work on Windows.
  linkWorkspaceNodeModules(repo, join(project, 'node_modules'))
  for (const requiredEntry of [
    join(project, 'node_modules/@deepseek-ai/dsh/lib/profile-boot.js'),
    join(project, 'node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js'),
  ]) {
    if (!existsSync(requiredEntry)) {
      throw new Error(`Host update qualification missing resolved entry: ${requiredEntry}`)
    }
  }
  await writeFile(join(project, 'cordis.patch.yml'), JSON.stringify([
    { id: 'webserver', config: { host: '127.0.0.1', port: 0 } },
    { id: 'llm-deepseek', disabled: true },
    { id: 'session-title-llm', disabled: true },
    { id: 'session-telemetry-otel', disabled: true },
    { id: 'desktop-product-telemetry', disabled: true },
    { id: 'agent-instructions', disabled: true },
    { id: 'agent-preset-registry', config: { default: 'standard' } },
    { insert: [{ id: 'update-qualification', name: new URL('../tests/fixtures/host-update-control.mjs', import.meta.url).href }] },
  ]))
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    /^(?:path|systemroot|windir|comspec|pathext)$/iu.test(name)))
  const child = spawn(process.execPath, [fileURLToPath(new URL('../tests/fixtures/host-update-qualification.mjs', import.meta.url)), root], {
    cwd: root, env: { ...environment, DSH_HOME: join(root, 'home'), USERPROFILE: root, HOME: root,
      TEMP: root, TMP: root, TMPDIR: root, DSH_CLIENT_VERSION: manifest.version }, stdio: 'inherit', windowsHide: true,
  })
  let timedOut = false
  const timeout = setTimeout(() => { timedOut = true; child.kill() }, 120_000)
  try {
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((done, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => { done({ code, signal }) })
    })
    if (timedOut || result.signal !== null || result.code !== 0) {
      throw new Error(`Host update qualification failed: timeout=${String(timedOut)}, signal=${String(result.signal)}, code=${String(result.code)}`)
    }
    console.log(`Host update evidence: ${root}`)
  } finally { clearTimeout(timeout) }
} finally {
  removeOwnedDirectory(project)
}
