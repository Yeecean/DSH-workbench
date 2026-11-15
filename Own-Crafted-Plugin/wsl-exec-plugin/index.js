/**
 * WSL execution environment — Windows Host half of `@local/dsh-wsl-exec`.
 *
 * Three small endpoints live on `ctx.webServer`: status, the desktop shell page
 * and idempotent start/stop. The Linux GUI itself is served by a private
 * loopback proxy whose root path *is* the Host running inside WSL2.
 *
 * It is deliberately not proxied through `ctx.webServer`: the desktop main
 * process cancels every WebSocket aimed at the desktop Host authority whose
 * Origin is not `dsh-app://app`, and an iframe document can never carry that
 * Origin. A separate port gives the Linux GUI its own authority.
 *
 *   GET  <mount>                         302 → shell page
 *   GET  <mount>/__status                every environment, for the client
 *   GET  <mount>/<distro>/__status       one environment, flat, plus `mount`
 *   GET  <mount>/<distro>/__shell        shell.html from this package
 *   POST <mount>/<distro>/__control/start|stop
 */

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { Agent, createServer, request as httpRequest } from 'node:http'
import { connect } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The desktop shell page shipped beside this module. */
const SHELL_PAGE = join(dirname(fileURLToPath(import.meta.url)), 'shell.html')

/** Text the Linux Host returns for any request without a valid cookie. */
const AUTH_REQUIRED = 'dsh web authentication required'

/** Single-hop headers that never survive a proxy hop in either direction. */
const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']

/** Request headers the proxy drops and then rewrites from scratch. */
const REQUEST_SCRUB = ['host', 'origin', 'referer', 'cookie', 'accept-encoding', 'expect', 'sec-fetch-site']

/**
 * Response headers the proxy drops: framing fences that would stop the page
 * rendering in the desktop iframe, and upstream session cookies the proxy
 * never replays (it injects the handshake cookie instead).
 */
const RESPONSE_SCRUB = [
  ...HOP_BY_HOP, 'x-frame-options', 'content-security-policy', 'content-security-policy-report-only',
  'cross-origin-opener-policy', 'cross-origin-embedder-policy', 'cross-origin-resource-policy',
  'strict-transport-security', 'set-cookie',
]

/** Configuration defaults; every key is overridable from the bundle row. */
const DEFAULTS = {
  distro: 'RockyLinux-9.8',
  user: 'yeecean',
  profile: 'web',
  dshCommand: '/usr/local/bin/dsh',
  linuxHost: '127.0.0.1',
  linuxPort: 4610,
  proxyPort: 45991,
  mount: '/wsl-exec',
  wsl: 'wsl.exe',
  autoStart: false,
  startTimeoutMs: 60000,
  stopTimeoutMs: 15000,
}

/** Validate a non-empty string option, honouring historical key names. */
function textOption(source, key, aliases, fallback) {
  for (const name of [key, ...aliases]) {
    const value = source[name]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(`wsl-exec: ${name} must be a non-empty string`)
    }
    return value.trim()
  }
  return fallback
}

/** Validate a TCP port option, honouring historical key names. */
function portOption(source, key, aliases, fallback) {
  for (const name of [key, ...aliases]) {
    const value = source[name]
    if (value === undefined || value === null || value === '') continue
    const port = Number(value)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new TypeError(`wsl-exec: ${name} must be a TCP port, got ${JSON.stringify(value)}`)
    }
    return port
  }
  return fallback
}

/** Validate a duration option in milliseconds. */
function durationOption(source, key, fallback) {
  const value = source[key]
  if (value === undefined || value === null || value === '') return fallback
  const duration = Number(value)
  if (!Number.isInteger(duration) || duration < 100) {
    throw new TypeError(`wsl-exec: ${key} must be a duration in ms, got ${JSON.stringify(value)}`)
  }
  return duration
}

/**
 * Normalize the bundle-row configuration into the settings the runtime uses.
 * @param config - raw row configuration, possibly undefined.
 * @returns normalized settings.
 * @throws TypeError when a value cannot be used as configured.
 */
export function normalizeConfig(config) {
  const source = config !== null && typeof config === 'object' ? config : {}
  const mounted = textOption(source, 'mount', [], DEFAULTS.mount).replace(/\/+$/u, '')
  const mount = mounted === '' ? '' : mounted.startsWith('/') ? mounted : `/${mounted}`
  if (mount === '' || mount === '/') {
    throw new TypeError('wsl-exec: mount must be a non-root path such as /wsl-exec')
  }
  const proxyPort = portOption(source, 'proxyPort', [], DEFAULTS.proxyPort)
  const linuxPort = portOption(source, 'linuxPort', ['port'], DEFAULTS.linuxPort)
  if (proxyPort === linuxPort) {
    throw new TypeError(`wsl-exec: proxyPort and linuxPort must differ, both are ${String(proxyPort)}`)
  }
  return {
    distro: textOption(source, 'distro', [], DEFAULTS.distro),
    user: textOption(source, 'user', ['linuxUser'], DEFAULTS.user),
    profile: textOption(source, 'profile', [], DEFAULTS.profile),
    dshCommand: textOption(source, 'dshCommand', ['linuxDsh'], DEFAULTS.dshCommand),
    linuxHost: textOption(source, 'linuxHost', [], DEFAULTS.linuxHost),
    linuxPort,
    proxyPort,
    mount,
    wsl: textOption(source, 'wsl', [], DEFAULTS.wsl),
    autoStart: source.autoStart === true,
    startTimeoutMs: durationOption(source, 'startTimeoutMs', DEFAULTS.startTimeoutMs),
    stopTimeoutMs: durationOption(source, 'stopTimeoutMs', DEFAULTS.stopTimeoutMs),
  }
}

/** Reduce a thrown value to one printable line, keeping the socket error code. */
function messageOf(error) {
  const parts = []
  let current = error
  for (let depth = 0; depth < 3 && current !== undefined && current !== null; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.code ?? current.message)
      current = current.cause
    } else {
      parts.push(String(current))
      break
    }
  }
  const text = parts.join(' / ') || 'unknown error'
  return text.split(/\r?\n/u)[0] ?? 'unknown error'
}

/** Quote one shell word for `bash -lc`. */
function shellQuote(value) {
  return `'${String(value).replace(/'/gu, `'\\''`)}'`
}

/** Write a JSON response with the no-store policy every control uses. */
function sendJson(res, status, body) {
  if (res.writableEnded) return
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  })
  res.end(payload)
}

/** Write a plain-text response. */
function sendText(res, status, body) {
  if (res.writableEnded) return
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  res.end(body)
}

/** Whether something already accepts TCP connections on a port. */
function portBusy(host, port) {
  return new Promise(resolve => {
    const probe = connect({ host, port })
    const settle = busy => {
      probe.destroy()
      resolve(busy)
    }
    probe.setTimeout(600, () => settle(true))
    probe.once('connect', () => settle(true))
    probe.once('error', () => settle(false))
  })
}

/** Wait until nothing listens on the port, or the budget runs out. */
async function waitForPortFree(host, port, budgetMs) {
  const deadline = Date.now() + budgetMs
  for (;;) {
    if (!(await portBusy(host, port))) return true
    if (Date.now() >= deadline) return false
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

/**
 * Build the environment supervisor and the loopback proxy in front of it.
 * @param settings - normalized plugin configuration.
 * @param log - logger with info/warn/error/debug methods.
 */
export function createRuntime(settings, log) {
  const upstreamAuthority = `${settings.linuxHost}:${settings.linuxPort}`
  const upstreamOrigin = `http://${upstreamAuthority}`
  const entry = `${settings.mount}/${settings.distro}/__shell`
  /** Mount prefixes the proxy tolerates and strips before forwarding. */
  const localPrefixes = [
    `${settings.mount}/${settings.distro}`,
    `${settings.mount}/${encodeURIComponent(settings.distro)}`,
  ]

  /** @type {'idle' | 'starting' | 'running' | 'stopping' | 'failed'} */
  let state = 'idle'
  /** @type {string | null} */
  let lastError = null
  /** @type {import('node:child_process').ChildProcess | null} */
  let child = null
  /** @type {string | null} */
  let launchUrl = null
  /** @type {string | null} */
  let cookie = null
  let cookieExpiresAt = 0
  /** Cancellation generation: a bump aborts any start still in flight. */
  let epoch = 0
  /** @type {Promise<unknown> | null} */
  let transition = null
  /** @type {'start' | 'stop' | null} */
  let transitionKind = null
  /** @type {Promise<unknown> | null} */
  let handshakeTask = null
  let disposed = false
  let origin = `http://127.0.0.1:${settings.proxyPort}`
  /** @type {import('node:http').Server | null} */
  let server = null
  /** @type {Promise<string> | null} */
  let listening = null
  const sockets = new Set()
  const tail = []
  const agent = new Agent({ keepAlive: true, maxSockets: 32 })

  /** The status payload the shell page and the client button both consume. */
  function snapshot() {
    return { distro: settings.distro, state, error: lastError, origin, entry, mount: settings.mount }
  }

  /** Whether a request may be forwarded upstream right now. */
  function ready() {
    return state === 'running' && cookie !== null
  }

  /** Remember one stderr line for a failed-start message. */
  function remember(line) {
    const trimmed = line.trim()
    if (trimmed === '') return
    tail.push(trimmed)
    if (tail.length > 20) tail.shift()
  }

  /** Diagnostic suffix built from the remembered stderr tail. */
  function tailText() {
    return tail.length === 0 ? '' : `：${tail.slice(-4).join(' | ')}`
  }

  /**
   * Map an incoming proxy path onto the Linux Host path space. A leading
   * `<mount>/<distro>` prefix is stripped so the shell page may address the
   * Linux GUI either from the proxy root or through the mount.
   */
  function localUrl(rawUrl) {
    const url = typeof rawUrl === 'string' && rawUrl !== '' ? rawUrl : '/'
    const queryAt = url.indexOf('?')
    const pathname = queryAt === -1 ? url : url.slice(0, queryAt)
    const search = queryAt === -1 ? '' : url.slice(queryAt)
    for (const prefix of localPrefixes) {
      if (pathname === prefix) return `/${search}`
      if (pathname.startsWith(`${prefix}/`)) return `${pathname.slice(prefix.length)}${search}`
    }
    return `${pathname}${search}`
  }

  /**
   * Rebuild the request headers the Linux Host must see. The Host compares
   * Host, Origin and the fetch metadata against its own listener authority,
   * and its session cookie is named after that authority, so every hop is
   * rewritten to the Linux listener.
   */
  function forwardHeaders(source) {
    /** @type {Record<string, string | string[]>} */
    const headers = {}
    for (const [name, value] of Object.entries(source)) {
      if (value === undefined) continue
      if (HOP_BY_HOP.includes(name) || REQUEST_SCRUB.includes(name)) continue
      headers[name] = value
    }
    headers.host = upstreamAuthority
    if (source.origin !== undefined) headers.origin = upstreamOrigin
    if (source.referer !== undefined) headers.referer = `${upstreamOrigin}/`
    if (source['sec-fetch-site'] !== undefined) headers['sec-fetch-site'] = 'same-origin'
    if (cookie !== null) headers.cookie = cookie
    return headers
  }

  /** Turn an upstream redirect on the Linux authority into a same-origin path. */
  function localLocation(location) {
    if (typeof location !== 'string' || !location.startsWith(upstreamOrigin)) return location
    const rest = location.slice(upstreamOrigin.length)
    return rest === '' ? '/' : rest
  }

  /**
   * Wait until the Linux port answers at all. WSL2 forwards loopback ports with
   * a delay after the Linux process binds, so the address can be printed while
   * Windows still sees a refused connection.
   * @param deadline - epoch milliseconds after which waiting gives up.
   */
  async function waitForUpstream(deadline) {
    for (;;) {
      try {
        const response = await fetch(`${upstreamOrigin}/`, { redirect: 'manual', signal: AbortSignal.timeout(2500) })
        await response.body?.cancel().catch(() => {})
        return
      } catch (error) {
        if (Date.now() >= deadline) {
          throw new Error(`握手失败（端口未就绪）：Windows 侧连不上 ${upstreamAuthority}，${messageOf(error)}`)
        }
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }
  }

  /**
   * Exchange the printed launch URL for the session cookie.
   *
   * `dsh web` prints its address just before it starts accepting connections,
   * so the port is waited for first; a refusal, a non-303 answer or a 303
   * without a cookie are reported as distinct failures.
   * @param url - the launch URL, token included.
   * @param budgetMs - how long the exchange may take.
   */
  async function handshake(url, budgetMs = settings.startTimeoutMs) {
    const deadline = Date.now() + budgetMs
    await waitForUpstream(deadline)
    const shown = url.replace(/\?.*$/u, '')
    for (;;) {
      let response
      try {
        response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
      } catch (error) {
        if (Date.now() >= deadline) throw new Error(`握手失败（请求没发出去）：${shown}，${messageOf(error)}`)
        await new Promise(resolve => setTimeout(resolve, 250))
        continue
      }
      await response.body?.cancel().catch(() => {})
      if (response.status !== 303) {
        throw new Error(`握手失败（303 未返回）：${shown} 回答 HTTP ${response.status}`)
      }
      const headers = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : []
      for (const header of headers) {
        const pair = header.split(';', 1)[0]?.trim() ?? ''
        if (!pair.includes('=')) continue
        const maxAge = /max-age=(\d+)/iu.exec(header)
        cookie = pair
        cookieExpiresAt = maxAge === null ? Date.now() + 86_400_000 : Date.now() + Number(maxAge[1]) * 1000
        return pair
      }
      throw new Error(`握手失败（无 Set-Cookie）：${shown} 回答 303 但响应里没有会话 cookie`)
    }
  }

  /** Re-run the handshake after a 401 or a near-expiry cookie, once at a time. */
  function refreshCookie() {
    if (handshakeTask !== null) return handshakeTask
    if (launchUrl === null || state !== 'running') return Promise.resolve()
    handshakeTask = handshake(launchUrl, 5000)
      .catch(error => log.warn(`重新握手失败：${messageOf(error)}`))
      .finally(() => {
        handshakeTask = null
      })
    return handshakeTask
  }

  /**
   * Detect a listener that would collide with our spawn.
   * @returns a failure message when the port is taken, or null when it is free.
   */
  async function probeUpstream() {
    try {
      const response = await fetch(`${upstreamOrigin}/`, { redirect: 'manual', signal: AbortSignal.timeout(2500) })
      const body = await response.text().catch(() => '')
      if (response.status === 401 && body.includes(AUTH_REQUIRED)) {
        return `端口 ${settings.linuxPort} 上已经有一个 DSH Host 在运行；它的登录令牌只属于启动它的进程，无法复用。请先在 WSL 里停掉它，再回到这里重试。`
      }
      return `端口 ${settings.linuxPort} 已被其他进程占用，无法启动 Linux 环境。`
    } catch {
      // Nothing answered: the port is free or WSL is not up yet. The spawn
      // below reports the real reason.
      return null
    }
  }

  /** Forward one HTTP request to the Linux Host. */
  function handleRequest(req, res) {
    if (!ready()) {
      sendJson(res, 503, { error: lastError ?? 'WSL 环境未运行', state, distro: settings.distro })
      return
    }
    if (Date.now() > cookieExpiresAt - 3_600_000) void refreshCookie()
    const target = localUrl(req.url)
    const upstream = httpRequest({
      agent,
      host: settings.linuxHost,
      port: settings.linuxPort,
      method: req.method ?? 'GET',
      path: target,
      headers: forwardHeaders(req.headers),
    }, answer => {
      /** @type {Record<string, string | string[]>} */
      const headers = {}
      for (const [name, value] of Object.entries(answer.headers)) {
        if (value === undefined) continue
        if (RESPONSE_SCRUB.includes(name)) continue
        headers[name] = value
      }
      if (headers.location !== undefined) {
        headers.location = Array.isArray(headers.location)
          ? headers.location.map(localLocation)
          : localLocation(headers.location)
      }
      if (target.includes('/plugins/')) headers['cache-control'] = 'no-store'
      if (answer.statusCode === 401) void refreshCookie()
      res.writeHead(answer.statusCode ?? 502, headers)
      res.flushHeaders()
      answer.pipe(res)
    })
    upstream.on('error', error => {
      log.warn(`代理请求失败 ${target}：${messageOf(error)}`)
      if (!res.headersSent) sendJson(res, 502, { error: `无法连接 Linux 环境：${messageOf(error)}` })
      else res.destroy()
    })
    res.on('close', () => {
      if (!res.writableFinished) upstream.destroy()
    })
    req.on('aborted', () => upstream.destroy())
    req.pipe(upstream)
  }

  /** Forward one HTTP upgrade (the `/api` WebSocket) to the Linux Host. */
  function handleUpgrade(req, socket, head) {
    let replied = false
    const fail = (status, text) => {
      if (replied || socket.destroyed) return
      replied = true
      const body = `${text}\n`
      socket.end(
        `HTTP/1.1 ${status} ${status === 503 ? 'Service Unavailable' : 'Bad Gateway'}\r\ncontent-type: text/plain; charset=utf-8\r\n`
        + `content-length: ${Buffer.byteLength(body)}\r\nconnection: close\r\n\r\n${body}`,
      )
    }
    socket.on('error', () => socket.destroy())
    if (!ready()) {
      fail(503, lastError ?? 'WSL 环境未运行')
      return
    }
    const headers = forwardHeaders(req.headers)
    headers.connection = 'Upgrade'
    headers.upgrade = 'websocket'
    const upstream = httpRequest({
      agent: false,
      host: settings.linuxHost,
      port: settings.linuxPort,
      method: 'GET',
      path: localUrl(req.url),
      headers,
    })
    upstream.on('upgrade', (answer, peer, peerHead) => {
      if (replied || socket.destroyed) {
        peer.destroy()
        return
      }
      replied = true
      const lines = ['HTTP/1.1 101 Switching Protocols']
      for (const [name, value] of Object.entries(answer.headers)) {
        if (value === undefined || name === 'connection' || name === 'upgrade') continue
        if (name === 'transfer-encoding' || name === 'content-length') continue
        lines.push(`${name}: ${Array.isArray(value) ? value.join(', ') : value}`)
      }
      lines.push('Connection: Upgrade', 'Upgrade: websocket', '', '')
      socket.write(lines.join('\r\n'))
      if (peerHead.length > 0) socket.write(peerHead)
      if (head.length > 0) peer.write(head)
      const shutdown = () => {
        peer.destroy()
        socket.destroy()
      }
      socket.on('close', shutdown)
      peer.on('close', shutdown)
      peer.on('error', shutdown)
      peer.pipe(socket).pipe(peer)
    })
    upstream.on('response', answer => {
      answer.resume()
      fail(answer.statusCode ?? 502, `Linux 环境拒绝了 WebSocket 握手（HTTP ${answer.statusCode ?? 502}）`)
    })
    upstream.on('error', error => fail(502, `无法连接 Linux 环境：${messageOf(error)}`))
    socket.once('close', () => upstream.destroy())
    upstream.end()
  }

  /** Bind the proxy to its loopback port, once. */
  function ensureServer() {
    if (listening !== null) return listening
    listening = new Promise((resolve, reject) => {
      const created = createServer(handleRequest)
      let settled = false
      created.on('connection', socket => {
        sockets.add(socket)
        socket.once('close', () => sockets.delete(socket))
      })
      created.on('upgrade', handleUpgrade)
      created.on('clientError', (error, socket) => {
        socket.destroy()
      })
      // One listener for the life of the server: an unhandled 'error' would
      // take the Host process down.
      created.on('error', error => {
        if (!settled) {
          settled = true
          listening = null
          server = null
          reject(new Error(`无法监听 127.0.0.1:${settings.proxyPort}：${messageOf(error)}`))
          return
        }
        log.warn(`代理服务器出错：${messageOf(error)}`)
      })
      server = created
      created.listen(settings.proxyPort, '127.0.0.1', () => {
        settled = true
        origin = `http://127.0.0.1:${settings.proxyPort}`
        resolve(origin)
      })
    })
    return listening
  }

  /** Drop every proxy connection and the proxy itself. */
  function closeServer() {
    const current = server
    server = null
    listening = null
    for (const socket of sockets) socket.destroy()
    sockets.clear()
    if (current !== null) {
      current.close()
      if (typeof current.closeAllConnections === 'function') current.closeAllConnections()
    }
    agent.destroy()
  }

  /** Kill the Windows-side `wsl.exe` we spawned, if any. */
  function killChild() {
    const current = child
    child = null
    if (current === null) return
    try {
      current.kill()
    } catch (error) {
      log.warn(`无法结束 wsl.exe：${messageOf(error)}`)
    }
  }

  /** The bash command line that becomes the Linux Host under `wsl.exe`. */
  function launchCommand() {
    const command = [
      'exec',
      shellQuote(settings.dshCommand),
      '--profile',
      shellQuote(settings.profile),
      '--no-open',
      '--host',
      shellQuote(settings.linuxHost),
      '--port',
      String(settings.linuxPort),
    ].join(' ')
    // `cd` takes a single argument, so the two steps need an explicit `&&`.
    return `cd "$HOME" && ${command}`
  }

  /** Kill any Linux-side `dsh` that still owns our port. */
  async function killLinuxHost() {
    // The bracket keeps the pattern from matching this very command line.
    const script = `pkill -f -- ${shellQuote(`[-]-port ${settings.linuxPort}`)} >/dev/null 2>&1 || true`
    await new Promise(resolve => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const timer = setTimeout(done, 8000)
      timer.unref?.()
      try {
        const proc = spawn(settings.wsl, ['-d', settings.distro, '-u', settings.user, '--exec', 'bash', '-lc', script], {
          stdio: 'ignore',
          windowsHide: true,
        })
        proc.once('error', done)
        proc.once('exit', () => {
          clearTimeout(timer)
          done()
        })
      } catch {
        clearTimeout(timer)
        done()
      }
    })
  }

  /**
   * Spawn the Linux Host and resolve once its session cookie is in hand.
   * @param mine - the cancellation generation this start belongs to.
   */
  function spawnAndWait(mine) {
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = error => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (error === undefined) resolve(undefined)
        else reject(error)
      }
      const timer = setTimeout(() => {
        killChild()
        finish(new Error(`等待 ${settings.startTimeoutMs} ms 仍没有看到 dsh web 的地址行${tailText()}`))
      }, settings.startTimeoutMs)
      timer.unref?.()

      const consume = (stream, sink) => {
        let buffer = ''
        stream.setEncoding('utf8')
        stream.on('data', chunk => {
          buffer += chunk
          if (buffer.length > 65_536) buffer = buffer.slice(-8192)
          let at = buffer.indexOf('\n')
          while (at !== -1) {
            const line = buffer.slice(0, at).replace(/\r$/u, '')
            buffer = buffer.slice(at + 1)
            sink(line)
            at = buffer.indexOf('\n')
          }
        })
      }

      let proc
      try {
        proc = spawn(settings.wsl, ['-d', settings.distro, '-u', settings.user, '--exec', 'bash', '-lc', launchCommand()], {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })
      } catch (error) {
        finish(new Error(`无法启动 wsl.exe：${messageOf(error)}`))
        return
      }
      child = proc
      proc.once('error', error => {
        finish(new Error(`wsl.exe 启动失败：${messageOf(error)}`))
      })
      proc.once('exit', (code, signal) => {
        if (state === 'stopping' || mine !== epoch) {
          finish(new Error('已取消'))
          return
        }
        finish(new Error(`WSL 里的 dsh 进程退出（code ${String(code ?? signal)}）${tailText()}`))
      })
      consume(proc.stdout, line => {
        if (line.trim() === '') return
        // Never echo the launch URL: it carries the process token.
        if (!line.includes('token=')) log.info(`linux: ${line}`)
        const found = /dsh web:\s+(https?:\/\/\S+)/u.exec(line)
        if (found === null || launchUrl !== null) return
        launchUrl = found[1]
        // From here the handshake owns the budget: the address is printed while
        // the port is still unreachable, and that wait is not a start timeout.
        clearTimeout(timer)
        void handshake(launchUrl).then(() => {
          if (mine !== epoch) {
            finish(new Error('已取消'))
            return
          }
          state = 'running'
          lastError = null
          finish(undefined)
        }, error => {
          // The handshake already phrased the failure; keep it verbatim.
          finish(error instanceof Error ? error : new Error(messageOf(error)))
        })
      })
      consume(proc.stderr, line => {
        remember(line)
        log.debug(`linux stderr: ${line}`)
      })
    })
  }

  /**
   * Clear whatever a previous attempt left behind: the Windows child, any Linux
   * `dsh` still holding the port, and the port itself.
   */
  async function clearStaleStart() {
    killChild()
    cookie = null
    cookieExpiresAt = 0
    launchUrl = null
    await killLinuxHost()
    await waitForPortFree(settings.linuxHost, settings.linuxPort, settings.stopTimeoutMs)
  }

  /**
   * Turn a failed start into a clean `failed` state: nothing keeps running and
   * the port is free for the next attempt.
   * @param message - the failure to report.
   */
  async function failCleanly(message) {
    try {
      await runStop()
    } catch (error) {
      log.warn(`启动失败后的清理出错：${messageOf(error)}`)
    }
    state = 'failed'
    lastError = message
  }

  /** One start attempt: proxy, port probe, spawn, handshake. */
  async function runStart(fromFailed) {
    const mine = ++epoch
    state = 'starting'
    lastError = null
    await ensureServer()
    if (mine !== epoch) return
    if (fromFailed) {
      await clearStaleStart()
      if (mine !== epoch) return
    }
    const occupied = await probeUpstream()
    if (mine !== epoch) return
    if (occupied !== null) {
      state = 'failed'
      lastError = occupied
      return
    }
    try {
      await spawnAndWait(mine)
    } catch (error) {
      // A stop took over: it owns the state, so only report the failure when
      // this attempt is still the current one.
      if (mine !== epoch) return
      await failCleanly(messageOf(error))
    }
  }

  /** One stop attempt: kill both sides, then verify the port is free. */
  async function runStop() {
    ++epoch
    state = 'stopping'
    killChild()
    agent.destroy()
    await killLinuxHost()
    const free = await waitForPortFree(settings.linuxHost, settings.linuxPort, settings.stopTimeoutMs)
    cookie = null
    cookieExpiresAt = 0
    launchUrl = null
    if (free) {
      state = 'idle'
      lastError = null
      return
    }
    state = 'failed'
    lastError = `停止后端口 ${settings.linuxPort} 仍被占用，可能有别的 DSH Host 在 WSL 里运行。`
  }

  /**
   * Run one transition, keeping the bookkeeping in sync and turning a thrown
   * error into a `failed` environment.
   */
  function beginTransition(kind, task) {
    const from = kind === 'start' ? 'starting' : 'stopping'
    transitionKind = kind
    transition = (async () => {
      try {
        await task()
      } catch (error) {
        if (state === from) {
          state = 'failed'
          lastError = messageOf(error)
        }
      } finally {
        transition = null
        transitionKind = null
      }
    })()
    return transition.then(() => snapshot())
  }

  /**
   * Start the environment. Idempotent: a running or in-flight start returns
   * the current status instead of spawning a second Host.
   * @returns the status snapshot once the transition settled.
   */
  function start() {
    if (transitionKind === 'stop') {
      const stopping = transition
      return stopping.then(() => start())
    }
    if (transitionKind === 'start') return transition.then(() => snapshot())
    if (state === 'running') return Promise.resolve(snapshot())
    // A failed environment may still have a Linux Host behind it, so a retry
    // clears that first.
    const fromFailed = state === 'failed'
    return beginTransition('start', () => runStart(fromFailed))
  }

  /**
   * Stop the environment. Idempotent: an idle environment is a no-op success.
   * @returns the status snapshot once the transition settled.
   */
  function stop() {
    if (transitionKind === 'start') {
      // Abort the in-flight start by bumping the generation and dropping the
      // child, then stop once that start settled.
      epoch += 1
      killChild()
      agent.destroy()
      const starting = transition
      return starting.then(() => stop())
    }
    if (transitionKind === 'stop') return transition.then(() => snapshot())
    if (state === 'idle' && child === null) {
      cookie = null
      return Promise.resolve(snapshot())
    }
    return beginTransition('stop', runStop)
  }

  /** Release everything this runtime owns; safe to call twice. */
  async function dispose() {
    if (disposed) return
    disposed = true
    epoch += 1
    killChild()
    agent.destroy()
    if (transition !== null) await transition.catch(() => {})
    if (child !== null || state === 'running' || state === 'starting') {
      await runStop().catch(error => log.warn(`停止失败：${messageOf(error)}`))
    }
    closeServer()
  }

  return {
    settings,
    snapshot,
    /** Mount-level status row (no `mount` key, per the client contract). */
    summary() {
      const { mount, ...rest } = snapshot()
      return rest
    },
    ensureServer,
    start,
    stop,
    dispose,
    get state() {
      return state
    },
  }
}

/** Resolve a logger, falling back to the console without a logger service. */
function loggerOf(ctx) {
  try {
    const logger = typeof ctx.logger === 'function' ? ctx.logger('wsl-exec') : undefined
    if (logger !== undefined && logger !== null && typeof logger.info === 'function') return logger
  } catch {
    // Fall through to the console below.
  }
  return {
    info: text => console.log(text),
    warn: text => console.warn(text),
    error: text => console.error(text),
    debug: () => {},
  }
}

/** Split a request path into the segments beneath the mount. */
function segmentsOf(pathname, mount) {
  const parts = pathname.split('/').filter(segment => segment !== '')
  if (parts[0] !== mount.slice(1)) return undefined
  return parts.slice(1).map(segment => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return segment
    }
  })
}

/** Serve the desktop shell page from this package. */
async function serveShell(res) {
  try {
    const html = await readFile(SHELL_PAGE, 'utf8')
    if (res.writableEnded) return
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-length': Buffer.byteLength(html),
      'cache-control': 'no-store',
    })
    res.end(html)
  } catch (error) {
    sendText(res, 503, `wsl-exec: shell.html 缺失或不可读（${SHELL_PAGE}）：${messageOf(error)}`)
  }
}

/**
 * Register the mount route on the Host web server.
 * @param ctx - plugin context carrying `webServer`.
 * @param runtime - the environment runtime.
 * @param log - logger.
 * @returns the route disposer.
 */
export function mountRoutes(ctx, runtime, log) {
  const mount = runtime.settings.mount
  return ctx.webServer.register({
    kind: 'prefix',
    path: mount,
    handler: (req, res) => {
      void (async () => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const segments = segmentsOf(url.pathname, mount)
        if (segments === undefined) {
          sendJson(res, 404, { error: 'not found' })
          return
        }
        if (segments.length === 0) {
          res.writeHead(302, { location: runtime.snapshot().entry, 'cache-control': 'no-store' })
          res.end()
          return
        }
        const [first, second, third] = segments
        if (segments.length === 1 && first === '__status') {
          sendJson(res, 200, { environments: [runtime.summary()] })
          return
        }
        if (first !== runtime.settings.distro) {
          sendJson(res, 404, { error: `unknown distro ${String(first)}` })
          return
        }
        if (segments.length === 2 && second === '__status') {
          sendJson(res, 200, runtime.snapshot())
          return
        }
        if (segments.length === 2 && second === '__shell') {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { allow: 'GET, HEAD', 'cache-control': 'no-store' })
            res.end()
            return
          }
          await serveShell(res)
          return
        }
        if (segments.length === 3 && second === '__control') {
          if (req.method !== 'POST') {
            res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' })
            res.end()
            return
          }
          if (third === 'start') {
            sendJson(res, 200, await runtime.start())
            return
          }
          if (third === 'stop') {
            sendJson(res, 200, await runtime.stop())
            return
          }
        }
        sendJson(res, 404, { error: 'not found' })
      })().catch(error => {
        log.warn(`控制端点失败：${messageOf(error)}`)
        if (!res.headersSent) sendJson(res, 500, { error: messageOf(error) })
        else res.destroy()
      })
    },
  })
}

/**
 * Mount the WSL execution environment plugin.
 * @param ctx - plugin context carrying the web server service.
 * @param config - bundle-row configuration, overlaid on {@link DEFAULTS}.
 */
export function apply(ctx, config) {
  const settings = normalizeConfig(config)
  const log = loggerOf(ctx)
  const runtime = createRuntime(settings, log)

  ctx.effect(() => {
    const disposeRoute = mountRoutes(ctx, runtime, log)
    // Bind eagerly so `origin` in the status payload is always truthful and a
    // busy proxy port surfaces as a failed environment instead of a surprise.
    void runtime.ensureServer().catch(error => {
      log.error(messageOf(error))
    })
    return () => {
      disposeRoute()
      void runtime.dispose()
    }
  }, 'wsl-exec')

  if (settings.autoStart) {
    void runtime.start().catch(error => log.warn(`自动启动失败：${messageOf(error)}`))
  }
}

export const name = '@local/dsh-wsl-exec'
export const inject = ['webServer']
