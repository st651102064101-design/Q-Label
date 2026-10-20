# Q LABEL project instructions

# Required REA + Superpowers gate for every task (2026-10-20)

- At the start of every task, read the installed Superpowers `using-superpowers/SKILL.md`, select the relevant process skills, read them, and apply their steps. Use the current session's skill catalog to locate the installed version. A mention of the plugin without following its workflow does not count.
- At the start of every task, read `../rea/README.md`, the installed `reverse-engineer-anything/SKILL.md`, the target-specific REA references, and `docs/rea-bartender-workflow.md`. The REA checkout must identify its upstream as https://github.com/morluto/rea.git; record the checkout revision and actual CLI/provider version used.
- For every application UX/UI, behavior, tool, renderer or BarTender compatibility task, pair REA with the relevant shipped artifacts under `D:/Programs/`. Start with `D:/Programs/BarTend.exe` and identify the DLL/resources that implement the requested feature. A related assembly outside that directory may be inspected when its relationship to this installed build is recorded.
- Before dependent implementation, run relevant REA feature analysis or query matching retained feature evidence after checking the artifact SHA-256 and scope. Identify the native control, method, resource or behavior and map findings to the proposed application change.
- Reading documentation, listing files, hashing an EXE, running doctor/setup, unrelated evidence, and an unmatched type query do NOT satisfy feature analysis. If a type is unmatched, find the correct type/artifact/provider; do not treat an empty result as feature evidence.
- If the required native evidence cannot be obtained, report the exact blocker and the unsupported question before dependent implementation. Do not silently replace native analysis with screenshots or our own application's tests, or describe a user-requested custom behavior as confirmed BarTender parity.
- Keep a task evidence record: skills read/applied, REA command/tool and version, artifact paths/hashes, evidence IDs/output paths, actual native findings, implementation mapping, verification and remaining unknowns. Reuse is allowed only for the same feature and matching artifact, not as a token REA invocation.
- Instruction/documentation-only tasks still read and apply both workflows; record that no native application behavior is being reconstructed rather than inventing feature analysis.
- Preserve `D:/Programs/`, the REA checkout, and the user's open applications/documents. Do not reinstall providers or change MCP configuration without the applicable authorization.


# Mandatory REA workflow for BarTender compatibility

User requirement, effective 2026-10-19: use https://github.com/morluto/rea.git
for every UX/UI or behavior task intended to match BarTender.
- Before changing code, read `docs/rea-bartender-workflow.md` and the installed
  `C:/Users/kkriangkai/.codex/skills/reverse-engineer-anything/SKILL.md`.
  If that skill is unavailable, read the workspace copy at
  `../rea/.agents/skills/reverse-engineer-anything/SKILL.md` and its relevant references.
- Identify the native BarTender feature and artifact before implementation.
  Use REA to inspect the relevant artifact or query matching retained REA evidence.
  Reuse existing evidence only after checking artifact identity and scope; do not
  repeat identical expensive analysis merely to claim tool use.
- Record the REA command/tool, artifact identity, evidence references, native
  behavior, implementation mapping, verification, and unknowns in the task's
  evidence document. Ordinary shell inspection and screenshots must be labeled
  separately from REA output. A README read or doctor call alone is not feature analysis.
- Match selection, click/keyboard behavior, enabled/disabled states, defaults,
  dialog Apply/OK/Cancel, layout/tree structure, and preview/print effects where relevant.
- If REA or a provider is unavailable, report the exact blocker and supported
  evidence. Do not silently skip REA or claim unverified BarTender equivalence.
- Use the supported CLI fallback when MCP tools are absent. Do not rerun setup
  or install analysis engines for every task. Preserve the user's open app and files.

# Application release policy

For every delivered change to this application:
- Increment the displayed version by one step: v0.001, v0.002, v0.003, and so on. Store the numeric display value in package.json displayVersion.
- Keep package.json version and package-lock.json versions consistent using valid npm SemVer (v0.001 corresponds to 0.0.1, v0.002 to 0.0.2).
- Add a dated Thai entry at the top of CHANGELOG.md describing what was added, fixed, and any material verification limitations. Preserve older entries.
- Show the version in the application and include it with a concise description of the changes in the final response.
- Do not invent separate versions for historical changes before v0.001.
