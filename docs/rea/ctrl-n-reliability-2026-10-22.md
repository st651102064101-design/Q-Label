# Ctrl+N reliability — native evidence and fix

Date: 2026-10-22. User requests a permanent fix for intermittent Ctrl+N in Q LABEL.

## Workflow and native evidence

Applied Superpowers using-superpowers, systematic-debugging, test-driven-development and verification-before-completion. Read project AGENTS/basic test policy, REA workflow, checkout README, installed REA native/artifact reference, MCP contracts (identity/catalog and retained Evidence), and PE-resource contract in binary-diagnostics.md. REA upstream is https://github.com/morluto/rea.git, revision dfe8378cf5a727e3d93d47a5986233175c6ef898.

Connected MCP binary_session reports rea-agents 6.7.0, 207 tools, catalog tools digest af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639; inspect_pe_resources is available. Its running installation's schema is path (absolute), max_file_bytes (64 MiB default, 512 MiB max), max_entries (16,384 default, 65,536 max). Used the connected operation; no CLI fallback or native process execution.

- D:/Programs/BarTend.exe SHA-256: 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
- D:/Programs/BtEnu.dll SHA-256: c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. This installed English resource DLL supplies the BarTender UI command resources.
- MCP inspect_pe_resources({path:"D:/Programs/BtEnu.dll"}) returned Evidence ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887, complete inventory of 1,468 resources.
- RT_ACCELERATOR type9/name101/lang1033, resource index1362, payload offset1049520 length472, SHA-256 999b680595677ee7159d644f6bdc2f60af714f5a67695df5163d97d1c44384a6. External read-only decoding of this REA-backed payload finds the record at1049768: flags11 (FVIRTKEY/FNOINVERT/FCONTROL), key78 (N), command7511. No Shift/Alt modifier is declared.
- RT_STRING type6/name470/lang1033, resource index1102, offset3357168 length396, SHA-256 9dc87bd3021eda20bf923fd6eb712205227865f81db7ba28fbfa16da21cfefde. External UTF-16 string-table decoding maps ID7511 to “Clears the design area and resets options to their built-in default settings.\nNew”. Resource identity/ranges/hashes are REA output; payload decoding is separately labeled external file analysis.

This matches native Ctrl+N to New. Static resources do not establish native focus handling, repeat behavior, keyboard layout handling, unsaved-document policy, or actual wizard invocation. Those parts of this fix address the user's Q LABEL bug and are verified in Q LABEL, not claimed as native runtime parity.

## Root cause and implementation mapping

The original renderer dispatched New from a bubbling document keydown handler using event.key. Canvas text and table editors stop propagation, so the command never reached that handler. With a Thai layout, key is ท while physical code is KeyN, so the old comparison also failed. The old path did not exclude Shift/Alt or held-key repeats.

- lib/new-document-shortcut.js matches native Ctrl/Cmd+N using physical KeyN and excludes Shift/Alt. Main before-input-event consumes this key, sends shortcut-new once per fresh press and suppresses repeats; consuming it prevents a second DOM dispatch.
- gui/preload.js exposes an unsubscribable onNewShortcut notification.
- gui/renderer.js routes that notification and the capture-phase DOM fallback to the existing New button, sharing the real wizard command. The fallback precedes target handlers, uses KeyN, suppresses repeats, and cannot escape an active modal. The old bubbling N branch was removed.
- New Label wizard, document persistence and other shortcuts keep their existing command paths.

## Verification

RED: the real renderer-handler regression fixture reproduced ten failing cases before the fix, including stopped bubbling, Thai layout, repeat, modifier and native subscription paths. After the fix, 13 focused tests pass, including native matcher and preload delivery/unsubscribe.

Electron `npx electron test/new-document-shortcut-runtime.js` passed 27 assertions through the actual main/preload/renderer and wizard. Real native key delivery opened once from canvas text, an actual TableTools cell editor and a property field; the consumed native key did not also reach DOM fallback. Text/cell edits survived New/Cancel. Held-key repeat after Cancel did not reopen; a fresh key did. Thai KeyN DOM fallback, active Properties blocking and repeated Home open/Cancel passed. Original fixture bytes remained unchanged. Test setup initially needed to open the startup fixture into the editor and provide the table model's errors.clip field; these were fixture issues, not production changes. Electron emitted its development CSP warning and a GPU shutdown diagnostic after the successful run; no physical printer or real user document was used.

Mandatory full `npm run test:basic` ran twice. First: 995 unit tests, 993 passed, 2 failed, zero skipped; both failures were Windows EPERM renaming temporary serial ledger files, and their focused rerun passed 11/11. Second: 996 unit tests, 987 passed, 9 failed, zero skipped; source files/tests were changing concurrently in this shared workspace (the package advanced from v1.147 to later releases during verification). All three legacy basic stages passed in both runs. Preserved logs: D:/QLabel-agent-work/ctrl-n-20261022/basic.log and basic-rerun.log, with corresponding saved JSON reports.

A focused follow-up of the changed shortcut and the three failing unit files passed 64/65 tests; the remaining failure is test/project-home.test.js, “Back must share available row width” (actual flexGrow 0 vs expected 1) in wizard footer styling outside this shortcut change. Properties and printer-resolution failures from the full run no longer reproduced. The unrelated footer assertion was not weakened and concurrent UI edits were not reverted. This task does not claim a passing whole-system suite. Ctrl+N's 13 unit tests and its 27 Electron assertions pass; the mandatory full suite remains non-green for the recorded footer failure.

An existing process can load the renderer fallback through the project's normal hot reload, but it must be relaunched to load new main/preload hooks. The user's running application is preserved; runtime checks use an isolated new process and document.
