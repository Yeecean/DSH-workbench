# WSL2 feasibility

English | [中文](WSL2_FEASIBILITY.zh.md)

## Summary

On 2026-11-12, the installed Rocky Linux WSL2 distribution could serve HTTP to Windows localhost, but no Linux Node executable was found on its PATH. A Linux DSH Host and a cross-platform Typert connection remain unverified. The HTTP probe alone does not establish DSH authentication, reconnection, or filesystem compatibility.

## Table of Contents

- [Observed environment](#observed-environment)
- [Network and transport](#network-and-transport)
- [Paths and permissions](#paths-and-permissions)
- [Outstanding checks](#outstanding-checks)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

-----

<a id="observed-environment"></a>
## Observed environment

| Check | Result |
|---|---|
| Distribution | `RockyLinux-9.8`, WSL version 2; it was stopped before the probe and was started for inspection. |
| Kernel | `6.18.40.1-microsoft-standard-WSL2`, x86_64. |
| Node | `command -v node` found no Linux executable; Windows `node.exe` was visible through the mounted Windows PATH. The repository requires Node `>=24.9.0` in [package.json](../../package.json#L8). |
| Package manager | `pnpm` resolved to a Windows npm directory, not a verified Linux installation. |
| Linux Host | Not started: the required Linux Node runtime was unavailable on PATH. Windows `node.exe` does not establish a Linux Host. |

-----

<a id="network-and-transport"></a>
## Network and transport

A temporary Python HTTP server bound to WSL `127.0.0.1:43879` returned HTTP 200 both inside WSL and from Windows `127.0.0.1:43879`; it was stopped after the probe. This verifies one loopback forwarding path at that moment, not behavior after WSL exit or restart.

The existing Gateway declares `/api/remote.mux` for streams in [stream-protocol.ts](../../packages/api/gateway/src/stream-protocol.ts#L7), and the client uses its connection service to open the socket in [client/index.ts](../../packages/api/gateway/src/client/index.ts#L157). The Host binds its configured address in [webserver/index.ts](../../packages/host/webserver/src/index.ts#L621). These source paths establish the existing transport mechanism; an actual Windows-to-WSL Typert session, authentication, reconnect, and recovery were not exercised.

-----

<a id="paths-and-permissions"></a>
## Paths and permissions

The WSL process could list `/mnt/e/GH projects`; the displayed directory mode was `drwxrwxrwx`. This observation does not prove read, write, executable, symlink, case-sensitivity, or Windows ACL behavior for individual project files.

Workspace file operations resolve the workspace root and requested path through the Host filesystem service in [workspace-files/index.ts](../../packages/api/workspace-files/src/index.ts#L452). Filesystem containment uses platform-dependent case sensitivity in [containment.ts](../../packages/fs/fs-sandbox/src/containment.ts#L61). A Linux Host therefore needs Linux-resolvable paths and separately verified permissions; a Windows path cannot be assumed to name the same resource.

-----

<a id="outstanding-checks"></a>
## Outstanding checks

- Start a Linux DSH Host with a compatible Linux Node runtime and verify its supported profile, without installing or upgrading WSL system components as part of this probe.
- Verify Windows-to-WSL Typert requests and streams with the configured authentication, then verify behavior when the Host or WSL exits and restarts.
- Exercise representative workspace paths, permissions, case behavior, symlinks, and file notifications across both filesystems.
- Confirm how the selected network configuration and proxy settings affect forwarding after a restart; the distribution was not stopped or restarted for this probe.

-----

<a id="further-exploration"></a>
## Further Exploration

- [Platform compatibility](PLATFORM_COMPATIBILITY.md) describes the Windows and WSL execution models.
- [Upstream sync report](UPSTREAM_SYNC_REPORT.md) records the Windows baseline and observed Desktop limitations.

-----

<a id="dev-note"></a>
## Dev Note

None.
