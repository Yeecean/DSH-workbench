# Self-built plugin deliverable: WSL2 execution environment

English | [中文](README.zh.md)

This directory archives the self-built plugin `@local/dsh-wsl-exec`, which mounts a native Linux DSH Host inside WSL2 (RockyLinux-9.8) into the official Windows desktop without changing desktop source or `app.asar`.

## Contents

| Path | Content |
| --- | --- |
| `wsl-exec-plugin/` | Installable plugin source: Host entry, client entry, shell page, configuration, and usage notes |
| `reports/WSL2_EXEC_ENV_REPORT.md` | Delivery report: capabilities, measured evidence, two known pitfalls, and the not-done list |
| `reports/DESIGN_NOTES.md` | Design and measurement record, including the source-code basis for the desktop limits |
| `reports/EVIDENCE.md` | Summary of the actual behavior and verification evidence |
| `screenshots/` | Five screenshots from the real desktop |

## Quick install

```powershell
plugin_manager action=install_bundle target=<PLUGIN_DIR>
```

After installation, a "WSL environment" entry appears in the sidebar. The plugin defaults to `RockyLinux-9.8`, Linux port `4610`, and proxy port `45991`; change them in the `config` block of `wsl-exec-plugin/cordis.patch.yml`.

## Measured results

- A real Agent turn on the Linux side: `uname -a` returned `6.18.58.1-microsoft-standard-WSL2`, and `/etc/os-release` reported Rocky Linux 9.8.
- Proxy chain: index 200 (41120 bytes), first static asset 200 (about 1.09 MB), `/api/remote.mux` WebSocket 101.
- Interaction: reload keeps the session; stop keeps the environment stopped, and restarting keeps the session.
- Evidence screenshots are in `screenshots/`.

## Boundaries

- This directory is a delivery archive, not a pnpm workspace package, and does not participate in repository builds or releases.
- The plugin runtime requires `@deepseek-ai/dsh` installed inside WSL (0.2.2-rc.2 on this machine) and Node >= 24.9.
- See `reports/WSL2_EXEC_ENV_REPORT.md` for detailed limits and remaining issues.
