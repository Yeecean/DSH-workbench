window.__ModuleLoader__.load({
  id: '@local/dsh-wsl-exec',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const MOUNT = '/wsl-exec'
    const DESKTOP = 'dsh-app:'

    const COPY = {
      zh: {
        label: 'WSL 环境',
        hintRunning: 'Linux 环境运行中，点击进入',
        hintIdle: '点击进入 WSL 环境（会自动启动 Linux Host）',
        hintStarting: 'Linux 环境正在启动…',
        hintFailed: 'Linux 环境启动失败，点击查看',
      },
      en: {
        label: 'WSL environment',
        hintRunning: 'Linux environment is running — click to enter',
        hintIdle: 'Click to enter the WSL environment (starts the Linux Host)',
        hintStarting: 'The Linux environment is starting…',
        hintFailed: 'The Linux environment failed to start — click to inspect',
      },
    }

    const strings = () => {
      const language = (document.documentElement.lang || navigator.language || 'zh').toLowerCase()
      return language.startsWith('zh') ? COPY.zh : COPY.en
    }

    /** 16px outline glyph: a terminal slab with a prompt caret, so the row reads as "a shell elsewhere". */
    function WslIcon({ size }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, focusable: false,
      }, [
        h('rect', { key: 'a', x: 1.6, y: 2.6, width: 12.8, height: 10.8, rx: 2.4 }),
        h('path', { key: 'b', d: 'M4.8 6.4 6.9 8.2 4.8 10' }),
        h('path', { key: 'c', d: 'M8.4 10.2h2.9' }),
      ])
    }

    const DOT = {
      running: 'var(--dsw-alias-state-success-primary, #22c55e)',
      starting: 'var(--dsw-alias-state-warn-primary, #f59e0b)',
      failed: 'var(--dsw-alias-state-error-primary, #ec1313)',
    }

    const STYLES = `
.dsh-wsl-exec-nav{-webkit-appearance:none;appearance:none;flex:none;display:flex;align-items:center;gap:8px;width:calc(100% + 8px);height:34px;margin:4px -4px;padding:6px 2px 6px 10px;box-sizing:border-box;border:none;border-radius:12px;background:transparent;box-shadow:none;color:var(--dsw-alias-label-primary,#0f1115);cursor:pointer;font:inherit;font-size:14px;line-height:22px;overflow:hidden}
.dsh-wsl-exec-nav:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.dsh-wsl-exec-nav-rail{width:36px;height:36px;margin:8px 0 10px;justify-content:center;gap:0;padding:0;border-radius:50%}
.dsh-wsl-exec-nav-label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dsh-wsl-exec-nav-glyph{position:relative;display:flex;flex:none;align-items:center;justify-content:center}
.dsh-wsl-exec-nav-dot{position:absolute;right:-2px;bottom:-1px;width:6px;height:6px;border-radius:50%;box-shadow:0 0 0 2px var(--dsw-alias-bg-base,#fff)}
`

    function WslExecNavButton({ wide }) {
      const copy = strings()
      const [state, setState] = React.useState('unknown')
      // Empty until the Host reports its entry: navigating to a guessed path would
      // land on a 404, so the button stays inert until the endpoint answers.
      const [entry, setEntry] = React.useState('')

      React.useEffect(() => {
        if (!location.protocol.startsWith(DESKTOP)) return undefined
        let live = true
        const read = async () => {
          try {
            const response = await fetch(`${MOUNT}/__status`, { cache: 'no-store' })
            if (!response.ok) return
            const data = await response.json()
            const environment = Array.isArray(data?.environments) ? data.environments[0] : undefined
            if (!live || environment === undefined) return
            setState(typeof environment.state === 'string' ? environment.state : 'unknown')
            if (typeof environment.entry === 'string' && environment.entry !== '') setEntry(environment.entry)
          } catch {
            /* the Host may be reloading; the next tick retries */
          }
        }
        void read()
        const timer = setInterval(() => {
          if (document.visibilityState === 'visible') void read()
        }, 15000)
        return () => { live = false; clearInterval(timer) }
      }, [])

      if (!location.protocol.startsWith(DESKTOP)) return null

      const title = state === 'running' ? copy.hintRunning
        : state === 'starting' ? copy.hintStarting
          : state === 'failed' ? copy.hintFailed
            : copy.hintIdle
      const dot = DOT[state]

      return h(React.Fragment, null, [
        h('style', { key: 'style' }, STYLES),
        h('button', {
          key: 'button',
          type: 'button',
          className: wide ? 'dsh-wsl-exec-nav' : 'dsh-wsl-exec-nav dsh-wsl-exec-nav-rail',
          title,
          'aria-label': copy.label,
          disabled: entry === '',
          onClick: () => { if (entry !== '') location.assign(`dsh-app://app${entry}`) },
        }, [
          h('span', { key: 'glyph', className: 'dsh-wsl-exec-nav-glyph' }, [
            h(WslIcon, { key: 'icon', size: wide ? 16 : 18 }),
            dot === undefined ? null : h('span', {
              key: 'dot',
              className: 'dsh-wsl-exec-nav-dot',
              style: { background: dot },
            }),
          ]),
          wide ? h('span', { key: 'label', className: 'dsh-wsl-exec-nav-label' }, copy.label) : null,
        ]),
      ])
    }

    const apply = (ctx) => {
      const slots = ctx.slots ?? (typeof ctx.get === 'function' ? ctx.get('slots') : undefined)
      if (slots === undefined || slots === null) return
      slots.inject('sidebar.footer.action', () => slots.register({
        name: 'sidebar.footer.action',
        id: 'wsl-exec.environment',
      }, WslExecNavButton))
    }

    const inject = ['slots']

    return { inject, apply }
  },
})
