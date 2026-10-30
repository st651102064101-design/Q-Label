# New Document Wizard fixed modal size — 2026-10-22

## Workflow and evidence

Applied Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming` (bounded change: fixed shared wizard frame; body scrolls when needed), `test-driven-development`, and `verification-before-completion`. Read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA installed skill and `native-and-artifacts.md`, plus the `inspect_pe_resources` MCP contract. Connected REA reports rea-agents 6.7.0 and catalog digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`; checked `inspect_pe_resources` schema (`path`, optional `max_file_bytes`, `max_entries`) and used the connected MCP operation. Checkout upstream/revision recorded by this workspace: `https://github.com/morluto/rea.git`, `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Local checkout was not present at the configured relative path `../rea` in this environment; applicable checkout metadata is taken from the workspace's retained REA task records.

## Feature-matched REA observation

- Main installed application: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Language resources: `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Connected operation `inspect_pe_resources` Evidence: `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`, complete PE resource inventory. Resource ID 6673 (Printer Selection page) payload file offset 1,188,312, length 438, RVA 1,195,480, SHA-256 `02a46ee403d8158107e3fa46a2600b83d312214ec5a4fb7cc9933315067aee5d`. Read-only local decode of this exact REA-identified resource reports dialog template dimensions `cx=1096`, `cy=16384`; because the unusual values do not establish a plausible display size and no native runtime observation was made, they are not used to claim pixel dimensions.
- Evidence scope: static resource inventory identifies the feature-matched Printer page resource; it does not establish the runtime size of the shared New Document Wizard at each step.

## Implementation mapping

- `gui/new-label-wizard.js`: one flex-column dialog with fixed desktop size 604×466 CSS px, constrained to viewport size; header and footer do not shrink; body owns overflow, so the frame does not resize with page content. Grid columns can shrink without intrinsic printer/stock field width forcing an 850px dialog.
- `test/wizard-preview-runtime.js`: asserts frame dimensions against image-measured 604×466 at the normal fixture viewport, identical dimensions on all seven page headings, and 576×466 in a 600px-wide fixture. The user-provided BarTender screenshot frame measured approximately 604×466 pixels; this is a screenshot measurement/design target, not an observed native client-area measurement.
- TDD: the new runtime assertion first failed against the original content-driven frame. It passes after fixed-size CSS and layout min-width corrections.

## Verification and limitations

- `npx electron --disable-gpu test/wizard-preview-runtime.js`: pass; all seven page transitions, fixed frame, preview/scroll region, footer buttons/icons and compact viewport checks.
- Full `npm run test:basic`: pass, 1,002 passed, 0 failed/cancelled/skipped; all 3 legacy checks passed; inventory gap 0. Report: `test/basic-unit-result.json`; detail log `test/basic-unit-output.log`.
- No native BarTender window was resized or opened; static PE resources cannot establish native runtime dimensions, client/window border differences, DPI scaling, or overflow behavior. Therefore the UI follows the user-provided screenshot sizing reference but native pixel parity remains unverified.
