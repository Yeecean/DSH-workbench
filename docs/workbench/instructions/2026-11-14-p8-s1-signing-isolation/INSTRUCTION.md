# P8-S1 · Windows release-chain security remediation instruction

English | [中文](INSTRUCTION.zh.md)

> Status: **Ready for implementation / not executed**
>
> Date: 2026-11-14
>
> Scope: P8 release security remediation S1 (code, static checks, simulated acceptance); **S2 hardware-signing integration and a real release are out of scope**.
>
> Target repo: Yeecean/DSH-workbench
>
> Baseline: `workbench-p1-work-code-ux-spec` (the authoring-time HEAD commit is recorded in Git history; re-check the remote HEAD before executing)
>
> Documentation PR: [#1](https://github.com/Yeecean/DSH-workbench/pull/1) (the PR this instruction lives in; confirm it is already merged, or inherit the documentation from that PR branch — do not lose the archive)
>
> Follow-up report: `workbench-reports/2026-11-14-p8-s1-signing-isolation/WORK_REPORT.md` (**created at execution time**; the path date may follow the actual execution date, and keep the index in sync).

## 0. Direct task for the executing agent

Complete P8-S1 inside the current **DSH Workbench original architecture**: eliminate the potential crossover between unreviewed source code and the Windows hardware-signing environment, and turn Windows Packaging into **unsigned by default, a trusted-authorization policy checked up front, ordinary builds and signing permission domains kept apart, artifact integrity and build-identity tracking, and strict rejection of unqualified artifacts at the release end**. Also fix the determinism problems of the related CI tests.

This round **allows implementing code and tests, but does not allow actually invoking hardware signing, touching the EV Token/PIN, production COS, existing host installations, real OTA, or release permission configuration**. Until real physical signing isolation, GitHub protected-source/Environment approval, and a CLI-PIN-free implementation exist, **every signed execution path must fail closed (refuse to execute)**; the future signing flow may only be verified with simulated objects/fake artifacts. Do not claim that signing isolation is already in effect merely because “the Workflow YAML declares an environment”.

This task is the **release-blocker fix** identified by the previous review; it is not a redesign of the Agent Runtime, the UI, or P7 WSL. Do not replace the project architecture because of external products such as Open Cowork, Claude, or Codex.

### Related design and factual basis

- [Original architecture](../../WORKBENCH_ARCHITECTURE.md), [P0–P8 roadmap](../../DEVELOPMENT_ROADMAP.md), [documentation guideline](../../DOCUMENTATION_GUIDE.md).
- [Previous round's signing/installer/updater report](../../../../workbench-reports/2026-11-14-round2-signing-installer-updater/WORK_REPORT.md), focus on `2.1–2.5`; **its proposals are design recommendations, not implemented results**.
- Current state (verified while authoring): `.github/workflows/windows-package.yml` defaults `signing` to `signed`, `package` uses the self-hosted Runner `dsh-win-package-trial`, and `test` is open to any development branch in the repository; `apps/desktop/scripts/windows-sign.cmd` still writes the Token PIN into SignTool command arguments; `apps/desktop/scripts/desktop-release-store.ts` uses `schemaVersion: 1` and records only SHA-512; `scripts/windows-package-workflow.spec.ts` has assertions that depend on the old workflow shape, plus the former PowerShell timeouts. **These are code-baseline facts, not results of this round.**

## 1. Work boundaries and prohibitions (check these first)

1. After `git fetch`, confirm the target development branch, the worktree state, and the current SHA. Create `feature/p8-s1-windows-release-security` from the real development branch; do not start from an outdated `main`; do not overwrite, clean, or reset the existing untracked files of the user.
2. Quickly read the existing `AGENTS.md`, `docs/architecture.md`, the relevant designs under `docs/workbench/`, and the build/signing scripts. Write down an **actual call chain**: `windows-package.yml` → environment and packaging adaptation → artifact storage → `desktop-publish.yml` / upload verification; record the Runners, credentials, artifacts, and code sources that each node can reach.
3. If the plan requires changing the Agent Loop, Session, Host/Client RPC, or the Renderer security boundary, stop that part immediately and submit an ADR for review. By default this round **must not change those contracts**.
4. **Absolutely forbidden**: real PIN, certificate private key, or EV Token operations; production or test COS writes; creating `apps/desktop/.env.windows` in the repository; installing/uninstalling the production client; running a real signing workflow; touching, reusing, or cleaning the existing machine-level caches, install directories, or credential directories of the user; disabling existing security checks in order to “make the tests pass”.
5. Do not push/merge directly to `master` or the development mainline; all code goes on a feature branch and a PR awaiting review. Attach the concrete SHAs and verification data when submitting the report.

## 2. Implement the source and authorization policy first (S1-A)

It is recommended to extract a unit-testable pure function/script, for example `apps/desktop/scripts/windows-package-policy.mjs`, shared by the workflow preflight validation and the local helper validation, so that the YAML, `prepare-windows-ci.mjs`, and the Release Store do not end up with different rules.

### 2.1 Reject-first combination matrix

| Source | test + unsigned | test + signed | production + unsigned | production + signed |
| --- | --- | --- | --- | --- |
| Any development branch | **Allow credential-free builds only** | **Reject** | **Reject** | **Reject** |
| Trusted, protected master | **Allow credential-free builds only** | Only possibly admitted once all S2 gates are ready; S1 **rejects** | Recommend rejecting | Only possibly admitted once all S2 gates are ready; S1 **rejects** |
| Explicitly allowed protected release tag | Allow credential-free builds per the existing version rules | S1 **rejects** | Reject | S1 **rejects** |
| SHA, PR ref, non-allowlisted tag, external repository, or unclear source | **Reject** | **Reject** | **Reject** | **Reject** |

**Key constraint:** “the string equals master” does not prove that the branch is protected; the user-selectable `source_ref`, `preset`, and `signing` do not amount to trusted authorization either. The S2 admission conditions must combine GitHub protected refs/rulesets, the authorizing identity, the approval environment, and an immutable commit identity. **The repository has not previously verified that the protection rules of master are enabled**; if they are not configured, record it as an administrator-side blocker and never quietly assume the configuration exists. S1 should take the stricter “reject signed in every case” instead of temporarily admitting it on the basis of an insufficient check.

### 2.2 Workflow preflight gate

- Change the default signing input of `.github/workflows/windows-package.yml` to `unsigned`, and state explicitly in the wording that unsigned is for debugging only and carries no release eligibility.
- Add a `preflight-policy` job that **does not depend on a Windows self-hosted machine and must not access signing/COS credentials**; validate user input, ref format, repository, source identity, tag/version association, and permissions before any build job may be scheduled.
- Do not start a Runner that holds Token permissions, run `pnpm install`, or execute unverified source code before the policy check.
- Do not use untrusted PR/source branches to execute signing policy scripts; policy code must come from a reviewed trusted workflow revision. Beware that the workflow execution ref and the source `source_ref` are two independent trust subjects; the mere presence of a `github.workflow_sha` field does not make a script trusted.
- Check the **duplicate validation** in `prepare-windows-ci.mjs`, `desktop-release-store.ts`, `retain-desktop-ci.ts`, and the related release preflight scripts: signed metadata and unsigned artifacts must not be disguised by parameters, relabeled, or able to bypass the preflight interception.
- Report failures with explicit but non-disclosing errors, and terminate before any job that holds credentials.

## 3. Separate the build and signing permission domains (S1-B)

Split the current `package` combination of “install dependencies from arbitrary source code and sign on the same machine” into a **key-free build** and an **isolated signing interface**, while preserving the existing packaging environment selection, version, channel, test Release ID, and archiving semantics:

1. **Builder**: runs only the allowed unsigned compilation/NSIS packaging, using an account/Runner that has no EV Token, PIN, or COS write credentials. Do not automatically treat `dsh-win-package-trial` as a “key-free” machine; verify its permissions and cache boundaries first. If no trusted key-free Windows Runner is available, you may complete the offline scripts and the simulated verification and mark the run state `BLOCKED`.
2. **Signer (S1 implements only a reviewable interface/job skeleton)**: a separate dedicated Runner label, workspace, account, and cache; it must not check out the optional `source_ref`, and must not run its `pnpm install`, postinstall, or any other script. **This round does not schedule a real Signer job, and the signed path must be explicitly rejected.** Only later, in S2, may it open once approvals and hardware credential protection are ready.
3. **Artifact handover**: the Builder outputs immutable unsigned artifacts plus a manifest; before signing, recompute the byte digests, the size, and the source commit; the uploaded manifest reporting itself as “already signed” must not be used as the basis for authorization. Forbid overwritable artifact names that cause confusion across runs, attempts, or sources.
4. **Controlled scripts**: future Signer scripts must come from a verified protected source and a fixed SHA. The policy/scripts used for execution, the artifact bytes, and the build-identity evidence must be bound to the same approved release intent. Do not confuse a user-editable workflow/helper with trusted code.
5. Keep unsigned artifacts usable for **strictly isolated** tests, but with no reachable path to `desktop-publish.yml` / the production update feed.

Include the new Mermaid data/trust boundary diagram in the PR, and explain item by item the relationship between the runtime accounts, Runner labels, machine isolation, cache ACLs, and the signing configuration directory. Without real-environment evidence, always write “design/to be deployed”, never “isolated”.

## 4. Do not touch the PIN in S1: disable insecure signing paths

It is known that `apps/desktop/scripts/windows-sign.cmd` currently carries the plaintext PIN through the `/kc` argument. **Do not trial-run it in S1 just to save time**, and do not claim that the process command-line leak is fixed by masking logs, clearing environment variables, or hiding shell echo.

- Statically verify in the security policy and the tests that no S1-reachable job can trigger `windows-sign.cmd` or any other real signing entry point.
- Record the script as a **legacy risk for a dedicated S2 remediation**. If this round does need to modify that file, the modification must strictly keep signed fail-closed and add anti-regression tests proving no plaintext PIN in argv/environment/logs; do not submit a replacement implementation that claims to be “usable in production without hardware verification”.
- Only S2 reviews the Native Signer / CSP session approach and hardware verification; it requires a separate explicit authorization and must check Windows process-creation auditing, certificate thumbprints, Authenticode state, and timestamp behavior.

## 5. Artifact Manifest v2 and release hard blocking (S1-C)

Handle `apps/desktop/scripts/desktop-release-store.ts`, `desktop-upload-plan.ts`, and their direct/indirect consumers. Prefer implementing the shared testable integrity verification once, instead of writing a separate hash logic for each path.

### 5.1 Data contract

- Newly written controlled Release Store records use an explicitly versioned `schemaVersion: 2`. Each file records `name`, `size`, `sha256` (64 lowercase hex characters), and the current `sha512` (Base64); the build-identity record and the build/signing attestation record must be explicitly bound to the file digests.
- The build-identity record includes at least the repository, the reviewed source ref, the resolved commit SHA, the workflow SHA, the run ID/attempt, preset/channel/target/version, and the Builder identity; future signing must additionally carry a trusted Signer, a controlled environment, the certificate thumbprint, and the signing time. **User-fillable fields must not disguise unsigned as signed.**
- Handling of v1 needs an explicit split: existing historical reports may be read/audited, but **they must not be automatically upgraded to release eligibility while v2 build identity and signing eligibility are missing**. If historical deployments must still be supported, state the conversion/migration constraints and tests explicitly; never silently reinterpret.
- At the signing/release boundary, re-read and verify SHA-256, SHA-512, size, target files, build identity, and signer identity; verify before signing/releasing and abort immediately on any mismatch.
- The SHA-512 verification of the update metadata in `desktop-upload-plan.ts` should be **kept**; additionally compare it against the SHA-256/size in the trusted Release Store manifest, instead of requiring the third-party update protocol to be changed to SHA-256 only.
- Paths that must verify real signatures may, in S1, only test the **trusted simulated verifier** and the rejection paths; S2 will then verify Windows Authenticode real-machine evidence. State explicitly that a production release needs dual hashes + Authenticode + the expected certificate thumbprint + a complete build-identity chain.

### 5.2 Release gate

- Review the `route / prepare / publish / upload-website-installer` of `.github/workflows/desktop-publish.yml` together with `preflight-desktop-publish.mjs` and `publish-desktop-ci.ts`; ensure that unsigned artifacts, missing fields/wrong hashes, wrong build identity, wrong run/attempt, and a forged signing state are rejected before sensitive release credentials are read or anything is uploaded.
- Do not check only “the package name contains signed” or the input `qualification=signed`; eligibility must come from the trusted store and be verified against the actual artifacts.
- The current protection configuration of `master` is unconfirmed, so **do not** treat “only master may start the workflow” as a complete release authorization loop. The report must list the items that need an administrator — GitHub protection rules, environment reviewers, the actual Runner permissions, and the certificate policy; do not change repository administration settings automatically.

## 6. Tests and regression acceptance (S1-D)

### 6.1 Tests that must be added/changed

- `scripts/windows-package-workflow.spec.ts`: adapt to the multi-job structure and do not keep the outdated assertions about `jobs.package` / default signed; test the whole combination matrix, the preflight dependency order, the separation of the key-free Runner and the signer, the environment gates, signed fail-closed, and unsigned having no release path.
- `scripts/desktop-publish-workflow.spec.ts`: reject artifacts without a qualified manifest and unauthorized sources; keep the existing package run/attempt and approved-environment constraints.
- `apps/desktop/tests/desktop-release-store.spec.ts`: v2 normal read/write, v1 read-only without release eligibility, same-size tampering, digest mismatch, sourceRef/commit/workflow/attempt mismatch, duplicates/path traversal, partial copy failure, and atomicity.
- `apps/desktop/tests/desktop-upload-plan.spec.ts` and the related release tests: verify SHA-256/SHA-512/size together, and reject missing signing evidence, missing hashes, a forged signing state, and unsigned uploads.
- `apps/desktop/tests/windows-sign.spec.ts`: this round verifies only the disabled path and the security assertions and does not need a real Token; if the signing script is not modified, the tests should honestly reflect that the legacy hole is not misreported as “fixed” in this round.
- Fix the 5000 ms-class timeouts in the previous round's `scripts/windows-package-workflow.spec.ts` caused by repeated Windows `pwsh` cold starts: prefer reducing the number of process starts and splitting deterministic pure-logic tests from OS integration tests; **do not handle it by only raising the timeout, skipping, or deleting security assertions**.

### 6.2 Actual checks

Run these in a controlled environment that has the project dependencies (adjust the concrete commands and workspace to the existing project scripts):

~~~sh
git diff --check
pnpm exec vitest run scripts/windows-package-workflow.spec.ts scripts/desktop-publish-workflow.spec.ts
pnpm exec vitest run apps/desktop/tests/desktop-release-store.spec.ts apps/desktop/tests/desktop-upload-plan.spec.ts apps/desktop/tests/windows-sign.spec.ts
pnpm run typecheck
~~~

Then run Lint, the build, and the related full regression set for the actually affected packages. For the targeted PowerShell cases, rerun several times in a Windows environment and record each duration/failure; a conditional skip on non-Windows does not count as a pass. For all real signing-related flows, explicitly write `NOT_RUN — S2 / unauthorized`.

**Minimum negative-case matrix:** development branch + signed; master + signed (S1 still rejects); production + unsigned; forged tag/ref; tampered installer; changing only the qualification in the manifest; mismatched run/attempt; missing/wrong dual hashes; no approval environment/no dedicated signing machine. The expectation for every negative case must be “**rejected, with no credential-side effects**”.

## 7. Commit cadence, delivery, and stop conditions

It is recommended to split the work into 3–5 commits by logic (a recommendation only; adjust to the actual changes):

1. `test/security`: source authorization matrix + fail-closed signing policy tests.
2. `ci`: Preflight and key-free build, isolated Signer skeleton; keep the original version/channel/archiving contract.
3. `security/release`: Manifest v2 + integrity and build-identity verification + release path blocking.
4. `test`: cross-platform/Windows regression, resolve the PowerShell timeouts (only if actually fixed).
5. `docs`: trust boundary diagram, operational preconditions, work report, and indexes.

After execution you must create the same-round `WORK_REPORT.md` **in the repository**, containing:
- The baseline, the feature branch, the PR URL, and the full SHA of every actual commit (if it cannot be filled inside its own commit, mark it `PENDING` and update it in the next commit/PR).
- The file change list, the before/after state of each security risk, and the unfinished S2 items.
- Every test command, platform, actual exit code, and pass/fail/skip counts; the local/CI evidence paths and retention period, never fabricated.
- Whether the **real configuration has been verified** — GitHub Environment, branch protection, Runner OS account/Token ACLs, and so on; write `BLOCKED / NOT_VERIFIED` when it has not.
- Split the final conclusion into: **S1 code remediation status**, **whether a real signed run is allowed** (default NO), and **whether a release is allowed** (default NO).

Update the [instruction index](../README.md) and the [report index](../../../../workbench-reports/README.md) (check the actual relative paths); mark only genuinely completed items as complete. Commit and push the feature branch, open a PR awaiting review, and **do not merge, sign, upload, or trigger a release yourself**.

### Cases that require an immediate stop and report

If any of the following occurs, do not relax the rules on your own: verification needs a real Token/PIN, production upload credentials, Runner administrator rights, or GitHub administration rights; untrusted code must be run on the signing host; the user environment holds existing data that the installer or cleanup scripts would modify; the original architecture contract conflicts with the S1 design; a verifiable signing identity cannot be established. You may keep the completed security code and tests, and you must mark the blockers truthfully.

## 8. Definition of Done for this round

- **Code acceptance**: matches the matrix above, unsigned by default; untrusted source cannot trigger any execution environment that holds signing credentials; all signed requests in S1 are rejected.
- **Integrity acceptance**: v2 dual hashing and build-identity verification cover saving, reading, and pre-upload checks, legacy data gains no false release eligibility, and every negative case is rejected.
- **Test acceptance**: the affected Lint/typecheck/tests are re-run on the actual platform with the reports retained, failures and skips listed separately; passing must not come from weakening assertions.
- **Delivery acceptance**: an independent PR, complete Commit/work report indexes, the risk list, and the subsequent S2 authorization preconditions are all in place.
- **Security conclusion**: **the end of S1 ≠ permission to sign or release officially**; the signed gate may change only after the subsequent S2 and real deployment approvals pass.
