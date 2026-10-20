# REA + Superpowers gate policy update — 2026-10-20

This is a documentation-only policy change. No BarTender behavior was analyzed
or reconstructed, so this record does not claim feature evidence or native parity.

## Applied workflows

- Read and applied Superpowers `using-superpowers` v6.4.2 before workspace
  inspection. The task updates project instructions, so no implementation or
  feature-design process skill was needed.
- Read the project and unit-test instructions, REA workflow, installed REA skill
  v42, REA checkout README, and the MCP contract's Identity and discovery section.
- REA checkout: `https://github.com/morluto/rea.git`, revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`.

## MCP and installed artifact check

- Active MCP server: `rea-agents` 6.7.0; 207 tools in its live catalog.
- Selected operation: `inspect_managed_artifact`, available in this session.
  Its schema specifies a PE/CLI identity inspection and explicitly does not load,
  execute, or decompile the target.
- REA MCP evidence: `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`.
- Installed target: `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- The result confirms a managed mixed CLR/native PE identity only. It does not
  establish any feature behavior. No feature-specific REA query was appropriate
  for this instructions-only change.

## Policy change

The root and application instructions and the REA workflow now require each task
to read the relevant MCP contract, inspect the live catalog and selected tool
schema, use the matching connected MCP operation when available, and record the
CLI fallback reason when MCP is unavailable. Documentation-only tasks explicitly
record that no application behavior is being reconstructed; artifact identity
checks remain separate from feature evidence.

## Verification

`npm run test:basic` passed: 823 unit tests, 0 failed, 0 skipped; the three
additional basic scripts passed. `git diff --check` passed. The test report is
`test/basic-unit-result.json`; no app version or changelog entry was added because
this change only updates contributor instructions and workflow documentation.
