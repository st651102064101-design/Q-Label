# Mandatory REA + Superpowers workflow

User instruction, 2026-10-20: read and actually apply REA and Superpowers on every task, especially using REA with `D:/Programs/`.

The workspace-root AGENTS.md and the application AGENTS.md now require this at task entry. The application workflow explicitly rejects unrelated evidence and unmatched type queries as feature analysis, requires correct artifact/hash/feature matching and native-finding-to-implementation mapping, and requires reporting blockers before dependent implementation. Existing prior findings are not retrospectively upgraded to feature evidence. README/doctor/identity checks are insufficient for application feature changes.

## Applied in this documentation task

- Read Superpowers `using-superpowers` and used its skill-selection workflow; applied verification-before-completion before recording test/commit outcomes.
- Read the REA checkout README, installed reverse-engineer-anything skill/native target reference and application REA workflow. Confirmed local `../rea` origin is `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; opened the official upstream page as requested.
- Exercised existing REA 6.7.0 CLI against the actual paired install: `node D:/QLabel-agent-work/npm-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs inspect-managed-artifact D:/Programs/BarTend.exe --format json`.
- Output: `D:/QLabel-agent-work/rea-20261020/mandatory-target-evidence.json`; evidence `ev_09162d3c5968fc4fd8cc4ee7e52c1ae2bc21a79266ab6a2451cd942a1500ed2b`; artifact SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- This establishes the actual target/CLI pairing only. This task changes instructions, so there is no native feature reconstruction or parity claim. No binaries, provider settings, application behavior or version changed.
- Workspace-root AGENTS.md is outside the labelforge Git repository; it is updated locally. The application gate and workflow are committed within labelforge for future use. Existing unrelated uncommitted instructions are preserved.

Verification: npm run test:basic passed 820 tests with 0 failed/skipped/cancelled; all three legacy stages passed. Report: test/basic-unit-result.json; assertions: test/basic-unit-output.log. No executable behavior or test inventory changed.
