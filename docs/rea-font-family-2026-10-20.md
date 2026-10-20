# System font picker — REA evidence and implementation record

Date: 2026-10-20
Request: expand the Font family picker to the installed Windows fonts and show
each font name in its own face.
Native parity status: **not verified**. This implementation follows the user's
approved installed-font behavior; it does not claim an exact BarTender list.

## Applied workflows

- Superpowers `using-superpowers`, `brainstorming`, and
  `test-driven-development` were read and applied. The user approved the bounded
  design to enumerate all installed Windows fonts and preview each option using
  its own font face.
- Read the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, REA workflow, REA checkout
  README, installed REA skill v42, and the managed-member section of the REA
  native/artifacts reference and MCP contracts.
- REA checkout upstream: `https://github.com/morluto/rea.git`, revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`.

## REA analysis and blocker

- Active server: REA MCP `rea-agents` 6.7.0.
- Installed artifact: `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Attempted REA MCP operation: `inspect_managed_members` with `detail: "summary"`.
  Evidence view `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`
  links to producer evidence `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`.
- REA reports `resource-limit`: managed metadata exceeded the 67,108,864-byte
  representation budget, so no members or feature behavior were admitted.
  `binary_session` also reports the native `search_strings` provider missing and
  native UI capture unsupported on this Windows host. No BarTender font-picker
  behavior was inferred from these unavailable sources.
- The user-provided screenshots are treated as design input, not REA evidence.

## Implementation mapping

- `lib/font-families.js` enumerates Windows `InstalledFontCollection` through
  PowerShell, normalizes and naturally sorts family names, retains the bundled
  font choices, and falls back safely if enumeration is unavailable.
- `gui/main.js` and `gui/preload.js` expose the cached system list to the renderer.
- `gui/font-family-picker.js`, loaded after the formatting toolbar in
  `gui/index.html`, populates the picker from the installed list, preserves a
  saved family even if it is not installed, and applies the family face to each
  option and to the closed picker. A mutation observer also covers later picker
  creation and option insertion.
- `test/font-family-catalog.test.js` covers normalization, system-list merging,
  fallback, populated options and per-family face styling. Electron
  `test/font-family-catalog-runtime.js` verifies the actual Windows IPC path and
  the rendered list in an isolated app profile.

## Verification and remaining unknowns

- `npm run test:basic`: 827 passed, 0 failed, 0 skipped; three additional basic
  scripts passed. Report: `test/basic-unit-result.json`.
- `npx electron test/font-family-catalog-runtime.js`: passed with 331 installed
  families on this workstation; no print transport was used.
- `git diff --check`: passed.
- Exact BarTender family ordering, hidden-font inclusion, and native dropdown
  sample rendering remain unknown because REA could not inspect the relevant
  native members or UI on this host.
