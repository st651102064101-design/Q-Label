# Data Type picker implementation plan

Approved specification: make Text Properties → Data Type clickable, replace the text chevron with SVG, and show Text, Date, Time, Number, Currency, Percentage, Fraction, Binary, Picture in that order with a distinct SVG per option. Keep Q LABEL styling and existing source editing transactions. User approved the summary with “ทำเลย”.

Architecture: retain the existing custom combobox and its hidden select/change binding. Reproduce actual pointer targeting in Electron before changing popup placement. Prefer an in-place manual popover to escape CSS containment while preserving modal ancestry, styles and focus. Reset popover defaults and measure after showing it.

- [x] Add a real Electron pointer regression for popup alignment, hit testing, repeated open/close, icons and selection persistence; observe RED.
- [x] Fix the diagnosed popup placement and use an SVG chevron; verify pointer and keyboard selection, Escape/outside dismissal and nine visible options.
- [x] Update meaningful existing unit coverage, mandatory checklist, REA evidence, Thai changelog and aligned release versions.
- [x] Run focused unit/runtime checks and the required complete npm run test:basic suite. Record actual results and native limitations.

REA: connected Ghidra 12.1.4 on D:/Programs/BtEnu.dll, SHA256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Data Type strings: ev_e67ae9dbc16561d53c9b7abb39e46bc1c33af4f4c8f37d90386a4b3be7f7d06b; nine names: ev_9311bf43a7e78a6728493a6dd1bd55742f46b08d249d146f254b031e6a62ac37. Static names do not prove native popup coordinates or interaction. User screenshot supplies the requested ordering/layout, and SVG icons are explicitly custom.

User added unsaved-document fixes during implementation. Added a RED disk runtime (manual hot reload unexpectedly saved), then implemented draft-only Finish, first explicit Save, guards before New/Home and true discard restoration. New and existing file contents, Cancel and Save were checked in isolated Electron appData. Relevant native Save prompt evidence: ev_659d32101539523b6debce4d97cee101274a98f5425c9d3e6922e5afecaf5dfc.

Final review: one P2 native hydration callback re-dirtied discarded documents. Reproduced in the native-package runtime (RED), fixed discard hydration dirty suppression and document identity guard, then runtime and unit tests passed (GREEN). No deferred findings. Complete suite repeated after the fix.

Final verification: npm run test:basic on v1.241 passed 1,220/1,220 tests across 160 files, 0 failures/0 skips; all three legacy stages passed, no undocumented files. Report test/basic-unit-result.json, timestamp 2026-10-26T08:08:53.380Z. Focused Electron checks are recorded in the feature evidence document.
