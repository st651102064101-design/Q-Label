# REA evidence — Database Setup wizard icons

Date: 2026-10-21

## Skills and workflow

- Superpowers: `using-superpowers` (process gate)
- REA: `reverse-engineer-anything`, `docs/rea-bartender-workflow.md`
- MCP: `user-rea` provider (connected)

## Native artifact

| Artifact | SHA-256 |
|---|---|
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` |
| `D:/Programs/Seagull.Data.Configuration.dll` | `58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56` |

REA checkout: `https://github.com/morluto/rea.git` @ `dfe8378cf5a727e3d93d47a5986233175c6ef898`

## REA operations

1. `inspect_managed_artifact` on `Seagull.Data.Configuration.dll` → Evidence `ev_e14b3b0245b9897ad65a249c66983dbd1d48c187cbce1eb304f5378ff413be29`
2. `inspect_analysis_view` collection `resources` → embedded `Seagull.Data.Configuration.g.resources`
3. String/resource key survey in `g.resources` (e.g. `resources/images/textfilelogo32.png`, `excellogo32.png`, …) matching the Select Database Type list in the installed wizard

Prior catalog investigation: `D:/QLabel-agent-work/rea-database-20261021/REVIEW.md`

## Native finding

BarTender’s Database Setup / Select Database Type wizard binds each connection choice to a 32×32 PNG under `Seagull.Data.Configuration` `Resources/Images/*Logo32.png` (plus `Import32.png`, `MariaDB32.png`, `SAP_HANA32.png`). IBM DB2 and IBM Informix share `IBMLogo32.png`.

## Application mapping

- Extract PNG bytes with `scripts/extract-bartender-database-icons.ps1` into `gui/assets/database-types/{catalog-id}.png`
- `gui/database-type-icons.js` maps catalog ids to filenames
- `gui/database-setup.js` step 0 renders `<img width="32" height="32">` instead of generic stroke SVGs
- Tests: `test/database-type-icons.test.js`, `test/database-setup.test.js`

## Verification and gaps

- DOM/unit: PNG presence, wizard `img` src per catalog id, 32px size
- Not re-run: live Electron pixel compare against BarTender on this turn; disabled/unavailable rows still use the same artwork as native (native may gray items separately)
