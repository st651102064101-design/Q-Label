# Mandatory REA workflow for BarTender compatibility

Effective: 2026-10-19, requested by the user.
Upstream: https://github.com/morluto/rea.git

## Required gate — strengthened 2026-10-20

Read and apply both REA and Superpowers at the start of every task, following
the complete gate at the top of `AGENTS.md`. Read the REA checkout README,
installed skill and relevant target reference; read Superpowers using-superpowers
and the process skills appropriate to the task. Record what was applied.

For every task, read the relevant operation contract in `../../rea/docs/mcp-contracts.md`
and inspect the active REA MCP catalog plus the selected operation's input schema.
Use that MCP operation for requested analysis when available; if unavailable,
follow the documented CLI fallback and record the exact limitation. Documentation-
only work records that no native behavior is being reconstructed; artifact
identity checks are not feature evidence.

Application analysis must pair REA with the relevant installed artifact in
`D:/Programs/` (starting with BarTend.exe and locating the implementing DLL or
resources). Verify SHA-256 and the specific feature scope before reusing evidence.
An assembly outside this folder needs an explicit relationship to this build.

**Do not proceed on the strength of unrelated or unmatched evidence.** A successful
CLI exit code with an unmatched type proves no behavior. Find the correct target
or report the precise blocker before dependent implementation. README/doctor,
identity-only inspection, screenshots and our own application tests do not replace
REA feature findings. A task record must connect native findings to changed code
and tests, with unknowns explicitly stated. Never claim native parity from these
proxies. Documentation-only tasks record that no application behavior is being
reconstructed; they still read and apply the workflows.

## Audit findings

- REA was used for Text Transforms. `bartender-text-transform-menu-2026-10-19.md`
  records REA source commit `dfe8378cf5a727e3d93d47a5986233175c6ef898`,
  CLI 6.7.0, the native artifact SHA-256, scoped native findings, and remaining gaps.
- This does not establish that REA was invoked for every previous UX/UI change.
  The recent Picture color change did not invoke REA. Earlier screenshot, DOM,
  Electron, or renderer parity checks must not be relabeled as REA analysis.
- Neither the root nor application AGENTS.md previously mandated REA per task.
- The workspace already contains `../rea`, whose origin is the upstream repository
  and whose audited revision is the commit above. The matching upstream workflow
  is now installed at `C:/Users/kkriangkai/.codex/skills/reverse-engineer-anything`.
  Installing the skill alone does not register MCP or prove a native provider works.

## Every task

1. Read the installed REA SKILL.md and the references relevant to the target.
   Use the workspace skill as fallback. Read the project AGENTS.md and
   UNIT_TEST_BASIC.md as required before editing.
2. Define the BarTender behavior to reproduce: object/source selection, tree,
   fields, SVG/icons, mouse/keyboard interactions, defaults, disabled states,
   resizing/footer, draft/Apply/OK/Cancel, and output effects as applicable.
3. Identify the selected native artifact and SHA-256. Consult the existing evidence
   index and reuse findings only when both artifact and question match.
4. Invoke the appropriate REA analysis tool or query retained evidence. If native
   behavior is unresolved, inspect the relevant resources/code and corroborate
   behavior with an isolated runtime fixture when needed. Static metadata does
   not prove clicks, pixel layout, or printing behavior.
5. Keep a task evidence record with the command/tool, REA version/revision,
   artifact path/hash, Evidence IDs or saved result path, observations, inferences,
   unknowns, implementation mapping, and relevant tests/runtime measurements.
6. Implement and verify the mapped behavior. Run the mandatory complete Basic
   Suite for application changes. Report gaps explicitly; do not call partial
   evidence 100% BarTender compatibility.
7. Commit only task files and attempt push as requested by the user. Report any
   push failure accurately.

## Tool routing

- Prefer connected REA MCP tools when they are available.
- Without MCP, use the existing CLI or the version-pinned package:
  `npx -y rea-agents@6.7.0 <command>`. Read that command's help before selecting flags.
- For a PE/CLI artifact, `inspect-managed-artifact PATH --json` identifies its
  managed deployment form without executing the target. Mixed native bodies need
  native analysis; metadata alone does not establish complete behavior.
- Read the native/artifacts reference before choosing a provider. Diagnose the
  specific missing provider rather than installing unrelated software.
- `doctor --client codex --json` is a readiness check, not feature evidence.
- No setup is required for every task. CLI operation does not prove MCP registration.
- When C: is full, use a task directory on D: for npm cache, TEMP, and evidence
  outputs. Preserve existing user artifacts; do not remove them to make space.

## Current evidence index

- Audit validation on 2026-10-19: REA 6.7.0 CLI successfully ran
  `inspect-managed-artifact D:/Programs/BarTend.exe --json`.
  Evidence `ev_09162d3c5968fc4fd8cc4ee7e52c1ae2bc21a79266ab6a2451cd942a1500ed2b`
  reports SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`,
  x86_64 PE and mixed CLR/native C++/CLI. This matches the earlier native target.
  Full output: `D:/QLabel-agent-work/rea-20261019/bartender-managed-evidence.json`.
  This validates CLI operation and target identity, not feature equivalence.
- The scoped doctor check reports Codex MCP registration missing and no configured
  native provider in that shell. CLI static managed inspection is usable; native
  decompilation requires the appropriate existing provider configuration.

- `bartender-text-transform-menu-2026-10-19.md`: Text Transform menu/capability
  recovery, artifact identities, native addresses, runtime checks, and limitations.
- Border Browser/Node pixel parity demonstrates agreement between our renderers.
  It does not prove all native BarTender Dash/Compound preset values match.

## Current routing and unresolved-work policy — audited 2026-10-20

- Current connected MCP may be stale: its Ghidra/JDK environment was absent even though Codex config contains both paths. Do not repeat empty/unrelated queries as feature analysis.
- Fresh CLI fallback: `./scripts/rea-local.ps1`. It uses existing Ghidra12.1.4 + JDK21 and the cached pinned REA6.7.0 package; no installation or target modification. A scoped doctor for --provider ghidra --client codex is healthy. Shell JAVA_HOME previously selected JDK17; the launcher explicitly uses the installed JDK21. Current MCP gets the configured environment only after reconnect/restart; CLI works now without closing the user's app.
- Native analysis works on supported DLLs: BtEnu.dll trace for Symbology and Size produced ev_e7ef3f8a13fa472cbdeb86924a42c31db52c5bdc53f5fed8a941f1b65ff76b07 with two string matches; references empty. This proves the resource text, not modal/resize/caret runtime behavior.
- BarTend.exe mixed C++/CLI remains explicitly outside Windows Ghidra P0 admission. Its managed metadata representation exceeds the hardcoded64MiB bound. These are provider capabilities, not missing installations. Do not bypass target classification or silently raise safety budgets to claim compatibility.
- Native UI unknown ledger: unk_ee7a9193ec656ca26d9b52d869bc788bc906e2a2c8f4dccb6606a1a547cd8631. Follow feature-matched native DLL/resource/managed assembly probes and retain evidence. Never resolve the unknown with only Q LABEL tests.
- Source implementation remains authorized by the user when native evidence cannot be recovered. Label it as Q LABEL behavior/custom requirement and retain the native gap.
- See rea-flow-audit-2026-10-20.md for exact findings and output paths. Ghidra readiness does not mean all BarTender features are reconstructed.

## Working external alternatives — verified 2026-10-20

The user authorized alternative tools when REA cannot answer the question. Keep REA as the first route and label external results explicitly; do not remove REA admission checks or increase its metadata budget.

- Metadata overflow: `scripts/rea-alternatives/read-metadata.ps1` uses the installed PowerShell 7 `System.Reflection.Metadata` reader without loading target code. Bounded selected method rows include original native RVAs, build-local tokens, SHA-256 and MVID. Confirm the native flag before using an RVA for disassembly.
- Mixed native bodies: standalone Ghidra 12.1.4 successfully imported the original unmodified BarTend.exe copy and decompiled `SPropertyPage.OnInitDialog`. Its CLI metadata importer produces warnings and is slow. `scripts/rea-alternatives/inspect-native.ps1` provides the faster executable-section route: validates native RVA from metadata, maps original file-backed executable bytes at their original virtual addresses, and decompiles the selected native method. This route lacks other sections/import identities and does not decode managed bodies. Neither route changes REA's Windows P0 support.
- Windows UI: use the installed Computer Use skill (`@oai/sky` via Node REPL). Real Text Properties screenshot and accessibility observations work. Activate the target before screenshot comparison: occluded captures on this machine sometimes contain the foreground app despite a correct target UIA tree. Reject mismatched captures; refresh after user input. Never silently substitute Q LABEL screenshots or alter an unsaved user document.
- Exact commands, artifact hashes, feature mapping, and remaining unknowns: `rea-alternatives-2026-10-20.md`. Tool availability resolves the investigation route, not the broad native behavior unknown or a claim of 100% compatibility.
