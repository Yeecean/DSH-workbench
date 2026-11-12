# Known issues

English | [中文](KNOWN_ISSUES.zh.md)

## Summary

The baseline investigation recorded one Desktop quit inspection timeout, one missing mandatory-update IPC handler, and two GUI test timeouts. Their causes, effects on P1, and suitability for an upstream issue remain unconfirmed. This document distinguishes that earlier observation from current source inspection.

## Table of Contents

- [Desktop quit inspection](#desktop-quit-inspection)
- [Mandatory update IPC](#mandatory-update-ipc)
- [Concurrent GUI tests](#concurrent-gui-tests)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

-----

<a id="desktop-quit-inspection"></a>
## Desktop quit inspection

**Earlier observation:** the second Desktop launch logged `desktop quit: task inspection unavailable` with a timeout; the batch was interrupted and no process remained, as recorded in the [upstream sync report](UPSTREAM_SYNC_REPORT.md#windows-desktop-evidence). This observation was not reproduced during the current source inspection.

**Source:** [host-process.ts](../../apps/desktop/src/host-process.ts#L59) sets a two-second inspection deadline and [line 289](../../apps/desktop/src/host-process.ts#L289) sends the Host control request. [quit-confirmation.ts](../../apps/desktop/src/quit-confirmation.ts#L68) treats a failed inspection as unknown and may request confirmation; [main.ts](../../apps/desktop/src/main.ts#L1524) waits for that decision before continuing normal quit. The timeout identifies a missing or late Host response, not its underlying cause.

**Status:** upstream defect, environment or lifecycle cause, P1 impact, and whether to file an issue are unconfirmed. Reproduce with a clean Desktop launch and a second launch, capture Host readiness and control-response timing, and observe the confirmation dialog and actual process exit before assigning a cause.

-----

<a id="mandatory-update-ipc"></a>
## Mandatory update IPC

**Earlier observation:** a later Desktop launch logged a missing `dsh-desktop:mandatory-status` handler, as recorded in the [upstream sync report](UPSTREAM_SYNC_REPORT.md#windows-desktop-evidence). This observation was not reproduced during the current source inspection.

**Source:** [preload-mandatory-overlay.ts](../../apps/desktop/src/preload-mandatory-overlay.ts#L69) invokes the status handler and handles a rejection; its comment identifies development without policy configuration as a possible case. [main.ts](../../apps/desktop/src/main.ts#L1553) creates the mandatory policy only when configuration exists, and [mandatory-update-window.ts](../../apps/desktop/src/mandatory-update-window.ts#L73) registers the handler when its window controller is created. These paths explain one possible missing-handler case but do not establish the cause of the observed log.

**Status:** upstream defect, expected development configuration, P1 impact, and whether to file an issue are unconfirmed. Reproduce with and without policy configuration, record handler registration and preload timing, and check the update overlay and policy behavior before deciding.

-----

<a id="concurrent-gui-tests"></a>
## Concurrent GUI tests

**Earlier observation:** the full GUI run had two five-second timeouts; their focused reruns passed, as recorded in the [upstream sync report](UPSTREAM_SYNC_REPORT.md#verification-results). This outcome was not reproduced during the current source inspection.

**Source:** [binary-rpc.host.spec.ts](../../packages/client/connection/tests/binary-rpc.host.spec.ts#L24) starts a loopback HTTP server with a dynamically assigned port. [review-tab.client.spec.tsx](../../packages/client/ui-deliverables/tests/review-tab.client.spec.tsx#L358) renders and exercises the review view. The shared symptom does not establish that the tests share a cause.

**Status:** upstream defect, resource contention, lifecycle cause, P1 impact, and whether to file an issue are unconfirmed. Capture the exact failing cases, worker count, machine load, and failure stacks in a repeated full-concurrency run; compare isolated runs before changing timeouts or filing an issue.

-----

<a id="further-exploration"></a>
## Further Exploration

- [Upstream sync report](UPSTREAM_SYNC_REPORT.md) contains the earlier verification results.
- [WSL2 feasibility](WSL2_FEASIBILITY.md) separates the Linux environment observations from unverified checks.

-----

<a id="dev-note"></a>
## Dev Note

None.
