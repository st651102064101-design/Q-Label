# Template page ellipsis hover — 2026-10-21

## Request and workflow

- User requested that hovering the three-dot action on a Template Pages card open its menu immediately, without clicking. Per the user's instruction for this prompt, no Superpowers or other skills were invoked.
- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA `README.md`, `docs/managed-code-analysis.md`, and the managed-member operation details in `docs/mcp-contracts.md`/the live REA MCP schema.

## REA application analysis

- REA upstream: `https://github.com/morluto/rea.git`; checkout revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Installed main target: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. REA `inspect_managed_artifact` returned retained identity/classification evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`; this is not feature evidence for ellipsis hover. The mixed native/managed target does not expose the requested hover event through this result.
- Candidate support assembly `D:/Programs/BtSystem.UI.dll`, SHA-256 `cd26374bcb3f75747ae8cb699fbdad7eacc4b990191918e2692baf697ba6caaa`. REA `inspect_managed_members` Evidence `ev_ee3a7862ec716913ea25798c3ba18abea2069255d840f957c0b2a6717fc44253` enumerated its full managed type/method metadata; its reported UI helpers concern database/server/message setup and do not implement the designer's template page action menu. This candidate is unmatched to the feature and was not used as behavior evidence.
- Native BarTender hover behavior for this specific ellipsis remains unverified. The implemented behavior is the user's explicit Q LABEL interaction request, not a claim of native BarTender parity.

## Change and verification

- `gui/template-pages.js`: entering the ellipsis hit target opens the existing page action menu immediately. Existing tab click, context menu, keyboard menu, and current-page selection behavior remain available.
- `test/template-pages.test.js`: regression assertion verifies hover opens the menu without changing the active page.
- `UNIT_TEST_BASIC.md`: updated the existing test inventory entry.
- Focused unit run: `node --test test/template-pages.test.js` — 11 passed, 0 failed.
- Whole-system `npm run test:basic` — 963 passed, 0 failed, 0 skipped; all three legacy scripts passed. Report: `test/basic-unit-result.json`; assertion log: `test/basic-unit-output.log`.
- Electron runtime `npx electron test/template-navbar-size-runtime.js` — timed out after 45 seconds with `window unavailable`; it did not create a BrowserWindow, so the live hover behavior was not verified in Electron.

## Remaining limitation

- The ellipsis is intentionally `aria-hidden` visual affordance; keyboard users continue to use the tab's context menu shortcuts and existing menu path. Native BarTender mouse-hover behavior has not been demonstrated by the available REA evidence.
