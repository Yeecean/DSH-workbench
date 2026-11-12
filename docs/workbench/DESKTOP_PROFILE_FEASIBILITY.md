# Desktop Profile feasibility

English | [中文](DESKTOP_PROFILE_FEASIBILITY.zh.md)

## Summary

The current Desktop carrier boots an Electron-owned profile named `desktop`. A separate Harness home can give a Workbench experiment a separate instance of that profile, but does not demonstrate that Electron can select a differently named profile. The proposed Windows validation below is a plan; this review did not launch or modify a profile.

## Table of Contents

- [Profile selection](#profile-selection)
- [Bundle composition](#bundle-composition)
- [Isolation and risks](#isolation-and-risks)
- [Minimum Windows validation plan](#minimum-windows-validation-plan)
- [Decision required](#decision-required)
- [Dev Note](#dev-note)

-----

<a id="profile-selection"></a>
## Profile selection

Electron resolves `profiles/desktop` and its lock under the selected Harness home ([paths.ts:17](../../apps/desktop/src/paths.ts)). Main selects that directory and prepares the Desktop project ([main.ts:381](../../apps/desktop/src/main.ts)); its Host process receives the directory as an argument ([host-process.ts:208](../../apps/desktop/src/host-process.ts)).

The Desktop Host loads the supplied directory and passes the fixed profile name `desktop` to the shared runner ([desktop-host index.ts:19](../../apps/desktop-host/src/index.ts)). The normal CLI explicitly rejects booting the reserved Desktop profile ([args.ts:83](../../apps/cli/src/args.ts)); a named CLI profile is a separate launch path and does not establish an Electron selection mechanism.

The CLI supports custom profile selection and a shipped-template initializer ([args.ts:167](../../apps/cli/src/args.ts)); template initialization can replace the target profile directory and its existing content ([profile-boot.ts:90](../../apps/cli/src/profile-boot.ts)). Use only a fresh, disposable home for a future experiment. No evidence in this review establishes direct selection of a differently named Workbench profile by the existing Desktop carrier.

-----

<a id="bundle-composition"></a>
## Bundle composition

A profile manifest lists ordered bundles; each bundle declares one or more patch files, followed by the profile patch and launcher layers ([profile.ts:1](../../packages/boot/app-boot/src/profile.ts)). The home-level patch takes precedence over the profile layer ([profile-boot.ts:211](../../apps/cli/src/profile-boot.ts)). The Desktop Host passes no command-line patch files in its current invocation ([desktop-host index.ts:27](../../apps/desktop-host/src/index.ts)).

Desktop initializes its owned profile from the Web template ([project-manager.ts:28](../../apps/desktop/src/project-manager.ts), [project-manager.ts:172](../../apps/desktop/src/project-manager.ts)); that template selects the base and Web bundles ([bundles.ts:14](../../packages/util/official-bundles/src/bundles.ts)). Profile loading can skip unreadable, incompatible, or unsupported bundle layers and report them ([profile.ts:700](../../packages/boot/app-boot/src/profile.ts)); a running window alone does not show that the Workbench bundle loaded.

The installed Desktop command can manage its initialized reserved profile while Desktop is fully closed ([Desktop README:135](../../apps/desktop/README.md)); the Plugins page also uses the shared manager ([Desktop README:172](../../apps/desktop/README.md)). Delivery and loading of a local Workbench bundle in the isolated development profile remain unverified and need an explicit package-resolution check.

-----

<a id="isolation-and-risks"></a>
## Isolation and risks

| State | Source observation | Consequence for a prototype |
|---|---|---|
| Profile and bundles | `DSH_HOME` selects the Harness root ([home-paths index.ts:127](../../packages/util/home-paths/src/index.ts)); Desktop chooses its `profiles/desktop` child ([paths.ts:17](../../apps/desktop/src/paths.ts)). | Give each run a fresh private Harness home; its logical profile name remains `desktop`. |
| Sessions and storage | The base bundle places JSONL Sessions and JSON storage under the Harness home ([base patch:138](../../packages/bundle/base/cordis.patch.yml), [base patch:179](../../packages/bundle/base/cordis.patch.yml)). | Default data roots differ across homes; explicit configuration or external plugins can override them and must be inspected. |
| Shared skills | `DSH_AGENTS_HOME` is independent of `DSH_HOME` ([home-paths index.ts:139](../../packages/util/home-paths/src/index.ts)); the filesystem Skill provider also reads user and project locations ([skill-filesystem index.ts:257](../../packages/skill/skill-filesystem/src/index.ts)). | Use a fresh temporary Agents home and test Workspace; inspect resolved Skill paths and external plugins before launch. |
| Credentials | The credential provider can also read inherited environment and the invocation directory's `.env` ([credentials index.ts:1](../../packages/credentials/credentials-local/src/index.ts)). | A new Harness home alone is not proof of credential isolation; launch with a reviewed environment and no real provider requests. |
| Electron state | Desktop reads shell settings from Electron `userData`, independently of `DSH_HOME` ([settings-file.ts:70](../../apps/desktop/src/settings-file.ts)). | Use a separate Electron data directory for browser storage, settings, and caches; do not point it at the user's normal data. |
| Process ownership | Desktop takes a single-instance lock before profile operations ([single-instance.ts:14](../../apps/desktop/src/single-instance.ts)). | Check for existing Desktop instances and avoid assuming two carriers can run concurrently; validate safe handoff separately. |

The development launcher resolves `DSH_HOME` and `DSH_DESKTOP_USER_DATA_DIR` separately and passes the latter to Electron ([dev.ts:59](../../apps/desktop/scripts/dev.ts)). This is evidence for a development isolation mechanism, not evidence that the same environment variable controls an installed application. The launcher uses a fixed build-project directory ([dev.ts:115](../../apps/desktop/scripts/dev.ts)); preparation removes and recreates that directory ([development-project.ts:147](../../apps/desktop/scripts/development-project.ts)). The temporary homes do not isolate that operation: inspect and preserve its contents before launch and do not run conflicting preparations concurrently.

-----

<a id="minimum-windows-validation-plan"></a>
## Minimum Windows validation plan

1. Record the source commit, built artifact identity, existing Desktop process state, and effective paths. Allocate a fresh temporary Harness home, `DSH_AGENTS_HOME`, test Workspace, and separate Electron user-data directory; inspect Skill paths, inherited credential variables, and `.env` inputs without copying user secrets.
2. Prepare the approved Workbench bundle and its client artifact using the repository's supported build and package mechanisms. Inspect the isolated profile's ordered bundle list, effective profile and home patches, and resolution diagnostics; treat a skipped Workbench layer as failure.
3. Start the unmodified Windows development Desktop with the isolated directories and observe that the Host identifies the reserved `desktop` profile. Confirm the Workbench client entry loads and the original Conversation, Terminal, and Files remain reachable; a CLI-only or browser-only run does not satisfy Desktop acceptance.
4. Exercise Home-to-Conversation navigation, resize, Renderer reload, plugin removal and registration cleanup. Restart with a separate clean home and clean Electron data to check the original Desktop composition; retain evidence and inspect the selected paths before any cleanup.
5. Run a separate custom-named CLI profile composition probe if needed, and report it as CLI evidence only. Do not claim a custom-named Desktop Profile until an explicit supported selector or approved Desktop carrier change is demonstrated.

No step above was executed during this design review. Profile installation, reload behavior, isolation from all external services, and the whole Windows Desktop acceptance path remain to be measured on the prototype.

-----

<a id="decision-required"></a>
## Decision required

Approve whether P1 may use a product-specific Harness home containing the reserved `desktop` profile as its initial Desktop experiment. If the product requires a separately named Desktop Profile selected by Electron, the existing carrier selection must be extended or another supported integration established and reviewed; this document does not authorize changing the carrier.

-----

<a id="dev-note"></a>
## Dev Note

The findings above are static source observations. No prototype bundle, custom Profile boot, Windows Desktop run, or isolation test was performed in this review.
