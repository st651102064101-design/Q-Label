# Mandatory REA workflow for BarTender compatibility

Effective: 2026-10-19, requested by the user.
Upstream: https://github.com/morluto/rea.git

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
