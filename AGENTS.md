# Version policy requested by the user

For every delivered change to this application:
- Increment the displayed version by one step: v0.001, v0.002, v0.003, and so on. Store the numeric display value in package.json displayVersion.
- Keep package.json version and package-lock.json versions consistent using valid npm SemVer (v0.001 corresponds to 0.0.1, v0.002 to 0.0.2).
- Add a dated Thai entry at the top of CHANGELOG.md describing what was added, fixed, and any material verification limitations. Preserve older entries.
- Show the version in the application and include it with a concise description of the changes in the final response.
- Do not invent separate versions for historical changes before v0.001.
