# Q LABEL project instructions

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
