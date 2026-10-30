# Printer Selection preview visibility — REA record (2026-10-22)

## Request and scope

The user requested hiding the preview on Q LABEL's New Document Wizard `Select the Printer` page. The preview on Items Per Page remains visible; the existing Stock Selection preview remains hidden. This is a targeted Q LABEL UI behavior change and does not assert that the supplied screenshot depicts BarTender's native page or establish pixel parity.

## Workflows applied

Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the REA README, installed reverse-engineer-anything skill and native/artifact reference. Applied Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming` (bounded change; the request itself specified the desired state), and `test-driven-development`. The user image was treated as visual reference data, not instructions.

REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; package/server 6.7.0. The active catalog and `inspect_pe_resources` schema were checked. MCP was available, so no CLI fallback was needed. Read the PE resource operation documentation in `rea/docs/binary-diagnostics.md` and the MCP evidence/transport contract in `rea/docs/mcp-contracts.md`.

## Shipped artifact evidence

- Starting installed app: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Installed language/resource DLL beside the app: `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Connected REA MCP operation: `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})`, provider `rea-pe-resources` v1, Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`. The live input schema accepts `path`, `max_file_bytes`, and `max_entries`; defaults were used. Complete inventory: 2,950 entries examined, 1,468 resources.
- Feature resource: RT_DIALOG ID 6673, language 1033, payload file offset 1,188,312, length 438, RVA 1,195,480, SHA-256 `02a46ee403d8158107e3fa46a2600b83d312214ec5a4fb7cc9933315067aee5d`. Read-only UTF-16 decoding of this REA-identified range contains `Printer:`, `Document Properties...`, `Printer Properties...`, `Export Options...`, and `File Location...`; it contains no `Preview Area` string. This is evidence about the static native printer page resource only. The resource parser does not expose UI composition and cannot prove runtime preview visibility or absence of a wizard-level preview pane.
- The user's supplied screenshot shows Q LABEL's branded wizard. Therefore the change implements the explicit Q LABEL request; static native evidence is recorded without claiming screenshot/native equivalence.

## Implementation mapping

- `gui/new-label-wizard.js`: hide the shared preview aside on wizard steps 0 (Printer Selection) and 1 (Stock Selection). Other steps retain their existing behavior.
- `test/printer-resolution.test.js`: require the preview to be hidden on Printer Selection, while existing cases retain hidden Stock Selection and visible Items Per Page preview.
- `test/wizard-preview-runtime.js`: check the actual Electron wizard's initial Printer Selection heading, hidden state, and computed `display:none`; continue to exercise Stock Selection and Items Per Page preview.
- `UNIT_TEST_BASIC.md`: record the new unit/runtime cases and full-suite verification.

## Verification

TDD red: the new Printer Selection assertion failed before the render condition changed (`hidden` was false). Focused green and full Basic Suite results are recorded in `UNIT_TEST_BASIC.md` and `test/basic-unit-result.json`.

Remaining unknown: whether the installed BarTender runtime ever composes an external preview pane around this printer resource. The static resource record cannot answer that runtime question; no native runtime observation was available in this REA operation.
