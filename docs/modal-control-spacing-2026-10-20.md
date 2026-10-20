# Modal control spacing — 2026-10-20

User reference2 shows a right inset rather than a close button touching the outer edge. Source root cause: .modal-window-controls margin-right:-12px!important cancels the header12px padding. Changed that margin to0, with4px inter-button gaps as shown. This supersedes earlier8px-gap-only fix, which left the negative margin intact.

Applied Superpowers using-superpowers, systematic-debugging (CSS trace), TDD (8px vs4px failure first), verification-before-completion. Read AGENTS, UNIT_TEST_BASIC, REA README/skill/native reference, retained Evidence contract and BarTender workflow. Live get_evidence_bundle schema checked and summary queried for inspect_pe_resources with installed target SHA: zero matching records. This is discovery only, not native spacing evidence. Existing managed analysis exceeds64MiB metadata budget; native UI observation unsupported on Windows and C++/CLI Ghidra analysis cannot establish native modal behavior. User authorized continuing source changes under this limitation. Exact native spacing remains unknown; this follows supplied screenshot.

Verified D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. REA https://github.com/morluto/rea.git, revision dfe8378cf5a727e3d93d47a5986233175c6ef898, version6.7.0.

Mapping: shared gui/modal-windows.js layout only. Unit test checks4px gap and zero right margin. Electron test/modal-controls-spacing-runtime.js checks actual Properties geometry before/during/after maximize, both gaps4px and right inset12px; Close works. Isolated appData, no printing. node --test test/modal-windows.test.js:12 passed.

Full npm run test:basic: 840 passed, 0 failed, 0 skipped. All legacy stages passed, inventory complete. Report test/basic-unit-result.json v1.07; git diff --check passed. Electron geometry verified both4px gaps and12px right inset in all three window states, asynchronous Close completed.
