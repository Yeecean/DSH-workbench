// End-to-end probe for the dsh-wsl-exec plugin, driven against the RUNNING
// Windows desktop Host (it registers the plugin's routes on its own listener).
//
//   node verify-plugin.mjs [hostOrigin] [distro] [--start] [--stop] [--keep]
//
// The Linux GUI is served by the plugin's own loopback proxy port, reported as
// `origin` in the status payload — never by the desktop Host authority.

const origin = (process.argv[2] ?? 'http://127.0.0.1:44864').replace(/\/$/, '')
const distro = process.argv[3] ?? 'RockyLinux-9.8'
const mount = '/wsl-exec'
const base = `${mount}/${distro}`
const flags = new Set(process.argv.slice(4))

const log = (label, detail) => console.log(`${label.padEnd(32)} ${detail}`)

async function status() {
  const response = await fetch(`${origin}${mount}/__status`, { cache: 'no-store' })
  const body = await response.json()
  const environment = body?.environments?.[0] ?? {}
  log('status', `${response.status} ${JSON.stringify(environment)}`)
  return environment
}

async function control(action) {
  const response = await fetch(`${origin}${base}/__control/${action}`, { method: 'POST', cache: 'no-store' })
  const body = await response.text()
  log(`control ${action}`, `${response.status} ${body.slice(0, 200)}`)
}

async function shell() {
  const response = await fetch(`${origin}${base}/__shell`, { cache: 'no-store' })
  const body = await response.text()
  log('shell page', `${response.status} ${response.headers.get('content-type')} ${body.length}B`)
  log('  shell marker', body.includes('dsh-wsl-exec') || body.includes('WSL 环境') ? 'yes' : 'no')
}

async function page(proxy) {
  const response = await fetch(`${proxy}/`, { cache: 'no-store', redirect: 'manual' })
  const body = await response.text()
  log('linux index', `${response.status} ${response.headers.get('content-type')} ${body.length}B`)
  log('  relative base', /<base href="\.\/"/.test(body) ? 'yes' : 'no')
  log('  boot payload', body.includes('__DSH_BOOT__') ? 'yes' : 'no')
  const asset = /(?:src|href)="((?:plugins|assets)\/[^"]+)"/.exec(body)
  if (asset !== null) {
    const url = `${proxy}/${asset[1].replaceAll('&amp;', '&')}`
    const fetched = await fetch(url, { cache: 'no-store' })
    log('  first asset', `${fetched.status} ${fetched.headers.get('content-type')}`)
  }
  const api = await fetch(`${proxy}/api/remote.mux`, { cache: 'no-store' })
  log('  api http probe', `${api.status} (upgrade expected on ws, 4xx is fine)`)
  return body
}

function upgrade(proxy) {
  return new Promise((resolve) => {
    const url = new URL('/api/remote.mux', proxy)
    url.protocol = 'ws:'
    const socket = new WebSocket(url, 'dsh.v1')
    const timer = setTimeout(() => { socket.close(); resolve('timeout') }, 10000)
    socket.onopen = () => { clearTimeout(timer); socket.close(); resolve(`101 subprotocol=${socket.protocol || '(none)'}`) }
    socket.onerror = () => { clearTimeout(timer); resolve('error (non-101)') }
  })
}

let environment = await status()
if (flags.has('--start') && environment.state !== 'running') {
  await control('start')
  environment = await status()
}
await shell()
if (environment.state === 'running') {
  const proxy = environment.origin
  log('proxy origin', proxy)
  await page(proxy)
  log('ws /api/remote.mux', await upgrade(proxy))
} else {
  log('linux gui', `skipped — state is ${environment.state}`)
}
if (flags.has('--stop')) await control('stop')
