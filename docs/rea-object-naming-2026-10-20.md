# Object naming — 2026-10-20

## Scope and user-defined behavior

The user requested one generated name sequence shared across object kinds:
`object 1`, `object 2`, `object 3`, and so on. Deleting an object compacts the
remaining generated names and makes the lowest number available again. A repeated
custom name must be rejected with the modern Q LABEL alert. This explicit product
requirement is the implementation authority; it is not represented as verified
BarTender parity.

## Superpowers workflow

- Read and applied `using-superpowers`, `brainstorming`,
  `systematic-debugging`, and `test-driven-development`.
- Treated this as a bounded change to the existing object-name allocator. The
  user request supplied the naming and duplicate-alert behavior. Added regression
  assertions first; they failed against the prior per-type allocator.

## REA analysis

- REA checkout upstream: `https://github.com/morluto/rea.git`.
- REA checkout revision: `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- REA CLI/package: `rea-agents 6.7.0`.
- Operation contract: `../../rea/docs/mcp-contracts.md`; selected MCP schema:
  `mcp__rea__trace_feature(query, case_sensitive?)`.
- Requested feature query: `Object name`.
- MCP operation returned `provider_unavailable` before producing Evidence.
  Ghidra's Windows route rejects the managed PE target; Hopper is unsupported on
  Windows; IDA and Kuna are not configured, and Kuna does not admit PE targets.
- `mcp__rea__inspect_managed_artifact` on `D:/Programs/BarTend.exe` produced
  metadata identity Evidence `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610`
  (summary view `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`).
  It classifies the image as mixed CLR/native C++/CLI, x86_64, with a complete
  managed metadata root; this does not identify the object-naming implementation.
- `mcp__rea__inspect_managed_members` was also tried on that exact executable.
  Evidence `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`
  (summary view `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`)
  reports metadata unavailable because its representation exceeds 64 MiB at
  offset 7,953,088. No type/member findings were produced, so the implementing
  native type/resource and behavior remain unknown.
- CLI fallback, after checking `rea trace` usage in the REA docs:
  `npx -y rea-agents@6.7.0 trace D:/Programs/BarTend.exe --query="Object name" --provider auto --format json`.
  It returned the same `provider_unavailable` diagnostics; no native Evidence ID
  was produced. No provider/configuration was installed or changed.

## Installed artifact identity

| Artifact | SHA-256 | Feature evidence |
| --- | --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` | Identity checked; native object-naming behavior unavailable |
| `D:/Programs/BtEnu.dll` | `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b` | Identity checked; no feature finding |

Hashes identify the installed build and do not count as feature evidence. The
task-relevant behavior could not be traced to a DLL or resource because both
native provider routing and managed-member inspection were unavailable.

## Implementation mapping

- `gui/object-names.js`: allocate the first free `object N` globally, migrate
  legacy generated `text N`/`barcode N`/`picture N` defaults, retain custom names,
  compact generated names after deletion, and repair duplicate generated defaults.
- Existing `gui/object-properties.js` validation remains responsible for
  rejecting a user's duplicate name and showing the modern alert.
- `test/object-names.test.js`: migration, every object type, copy, deletion and
  number reuse, duplicate/empty validation, modern alert, and renderer deletion.
- `test/object-properties-pages.test.js`: duplicate live edit opens the modern
  alert and does not overwrite the existing name.
- Electron runtime checks: `test/object-properties-tree-runtime.js` checks the
  displayed sequence and tree/canvas selection; `test/layer-hide-runtime.js`
  checks label-based Hide/Show controls against the new generated name.

## Verification and limitations

Focused object-name/Properties unit run: 22 passed, 0 failed. `npm run
test:basic`: 833 passed, 0 failed, 0 skipped; all 3 legacy stages passed.
Electron `npx electron test/object-properties-tree-runtime.js` passed tree/canvas
name agreement and selection; `npx electron test/layer-hide-runtime.js` passed
Hide/Show controls using the new generated object name. Runtime checks used
isolated profiles; no real document was altered and no print job was sent.
Full Basic Suite results: `test/basic-unit-result.json` and
`test/basic-unit-output.log`.

Native BarTender naming, uniqueness rules, deletion renumbering, and its alert
appearance remain unverified because the matching REA provider is unavailable on
this Windows installation. Q LABEL follows the requested custom behavior.
