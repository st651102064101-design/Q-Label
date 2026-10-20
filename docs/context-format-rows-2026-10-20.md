# Context text tools — v1.053

User requests three rows in the compact context formatting panel to reduce horizontal scrolling. The panel clones the actual Ribbon controls. After forwarding handlers are attached, text controls are regrouped into three rows: font/size/B/I/U, other command buttons/colors, remaining dimensions/settings. Shape-only formatting retains its existing layout. A shared horizontal scrollbar remains for narrow menus.

Verification: the new DOM behavior regression failed first (two rows), then passed all seven context tests, including forwarded changes. Isolated Electron `npx electron test/context-format-rows-runtime.js` passed three visible rows at y=94/129/164 with widths 292/371/343px and a working Bold command. These are Q LABEL measurements, not native BarTender measurements.

REA context: workflow read; retained artifact evidence queried at `D:/QLabel-agent-work/rea-20261019/tree-source-members-evidence.json`, REA 6.7.0 `inspect_managed_members` selected `DataSource`, evidence `ev_23dd65815d68604f61f15988127ae13383b7afd3217661350ec485a44d674617`. Artifact `D:/Programs/BarTend.exe` SHA-256 rechecked as `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. Its metadata scope does not establish context font layout. This change implements the user's requested arrangement; native row geometry and parity are unverified.

Full npm run test:basic: 815 passed, 0 failed/skipped/cancelled; all three legacy stages passed. Report: test/basic-unit-result.json; assertions: test/basic-unit-output.log. No physical printing performed.
