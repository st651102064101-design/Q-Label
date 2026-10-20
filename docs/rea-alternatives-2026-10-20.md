# REA blockers: working external routes — 2026-10-20

## Scope and workflow

User request: make investigation usable despite mixed C++/CLI admission, managed representation budget, and Windows UI observer limitations. This change adds investigation tooling and instructions; it does not modify Q LABEL application behavior or its v1.074 release number. No native behavior is reconstructed in the application in this task.

Applied Superpowers using-superpowers, systematic-debugging and verification-before-completion: identify causes, reproduce the constrained routes, test independent alternatives, preserve remaining unknowns. Read REA README, mcp-contracts (managed members/native UI), Windows Ghidra P0, installed REA skill, project gate/test policy, and Computer Use skill/guidance/confirmations/API. Live MCP catalog includes `inspect_managed_members` (path/type_names/detail) and `observe_native_ui` (pid/window_id/accessibility/screenshot/max_nodes); the latter explicitly requires an active Mach-O target. Neither offers a supported Windows mixed/UI override.

REA checkout: https://github.com/morluto/rea.git at `dfe8378cf5a727e3d93d47a5986233175c6ef898`, CLI 6.7.0. Existing feature-matched REA evidence retained: managed overflow `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`; native DLL resource evidence and unknown ledger in `rea-flow-audit-2026-10-20.md`. No repeated unrelated query was substituted for feature evidence. Connected MCP has stale provider environment; fresh `scripts/rea-local.ps1` remains the REA CLI route. The new results below are **external**, not canonical REA Evidence IDs.

## Target identity

- Original: `D:/Programs/BarTend.exe`
- SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`
- Original copy: `D:/QLabel-agent-work/rea-alternatives-20261020/BarTend.exe`, same verified SHA-256.
- Metadata MVID: `ca045b3f-f077-4eb2-959f-78487b4d60d1`.
- External Ghidra 12.1.4, Temurin JDK21.0.12.1+1, PowerShell7.6.5 System.Reflection.Metadata reader. These tools were already installed; no providers were reinstalled or REA gates changed.

## 1. Metadata without representation expansion

From the labelforge directory, using PowerShell 7:

```powershell
pwsh -NoProfile -File scripts/rea-alternatives/read-metadata.ps1 `
  -ArtifactPath D:/Programs/BarTend.exe `
  -NamePattern 'SPropertyPage.*OnInitDialog|ModifyPropertyPage.*LiveUpdateCancel' `
  -OutputPath D:/QLabel-agent-work/rea-alternatives-20261020/metadata.json
```

Observed: **2,434 type definitions; 17,648 method definitions; metadata binary 3,137,996 bytes**. The 64MiB REA failure concerns expanded representation, not the original metadata byte count. Lazy enumeration emits at most `Limit` selected rows (default100, maximum1000), reports total matched/truncation, and never loads/executes the target assembly.

| Exact native method | Build-local token | RVA | Original VA |
| --- | --- | ---: | --- |
| `<Module>::SPropertyPage.OnInitDialog` | `0x06002e28` | 8453024 | `0x14080fba0` |
| `<Module>::ModifyPropertyPage.LiveUpdateCancel` | `0x06002ee1` | 5421072 | `0x14052b810` |

Both have native implementation flag133. Mapping is to Properties initialization/cancel investigation, not an arbitrary address. This reader does not decode CIL bodies/signatures/call graphs or repair REA's internal budget.

## 2. Native decompilation despite mixed admission

### Full PE route (succeeded, slow and warning-heavy)

```powershell
$env:JAVA_HOME='D:/QLabel-agent-work/tools/temurin-21/jdk-21.0.12.1+1'
& D:/QLabel-agent-work/tools/ghidra-12.1.4/ghidra_12.1.4_PUBLIC/support/analyzeHeadless.bat `
  D:/QLabel-agent-work/rea-alternatives-20261020 NativeMethods `
  -import D:/QLabel-agent-work/rea-alternatives-20261020/BarTend.exe `
  -processor x86:LE:64:default -cspec windows -noanalysis `
  -scriptPath scripts/rea-alternatives `
  -postScript InspectNativeMethod.java 8453024 `
  D:/QLabel-agent-work/rea-alternatives-20261020/native-method.json
```

Exit0, import/save succeeded, `decompileCompleted:true` at `0x14080fba0`, 2,331 characters of pseudocode. Output shows calls to `GetWindowRect`, `CDialog_OnInitDialog`, `CWnd_GetWindowTextW`, `CWnd_SetWindowTextW`, child-window enumeration via `GetWindow`, and `PostMessageW(...,0x4ef,0,0)`. This supports an initialization/child-caption processing path; it does not establish the meaning of custom message0x4ef or complete dialog semantics. Ghidra emitted CLI signature/custom-attribute markup errors, unknown calling convention/unreachable-block warnings, and unresolved imported libraries. They remain in `ghidra.log`; successful native decompilation does not mean complete mixed-language recovery. Reuse the existing project with `-process BarTend.exe` for follow-up rather than importing it each time.

### Fast executable-section route (also succeeded)

```powershell
pwsh -NoProfile -File scripts/rea-alternatives/inspect-native.ps1 `
  -ArtifactPath D:/Programs/BarTend.exe -NativeRva 5421072 `
  -WorkDirectory D:/QLabel-agent-work/rea-alternatives-20261020/section-cancel
```

The directory must be new on every run. Wrapper validates AMD64, metadata-declared native RVA, file-backed executable section; extracts original bytes read-only; records source/section hashes and mapping; imports with BinaryLoader at original section VA; disassembles/decompiles only the selected function. It restores caller JAVA_HOME and requires a successful JSON decompilation report, not just process exit0.

Actual outputs under `section-init/` and `section-cancel/`: `mapping.json`, `native-method.json`, `ghidra.log`, local Ghidra projects. Both selected methods decompiled successfully. `LiveUpdateCancel` at `0x14052b810` is an indirect dispatch through a pointer at object offset0x1c8/vtable offset0x28, with an unresolved indirect-jump warning. No claim about what the callee restores until that target is traced. Section-only output lacks imports/globals/other sections; original PE image base is in mapping.json (Ghidra raw program imageBase0 is not the PE base). The first section-init experimental report used field `rva` for an absolute input; mapping.json is authoritative. Current script explicitly labels inputAddressMode/inputAddress to prevent that ambiguity.

## 3. Windows observation through Computer Use

External `@oai/sky` via Node REPL works on the actual running BarTender Designer. Discovered app `D:\Programs\BarTend.exe`, main window67130, process25368, unsaved `bartender.btw*`.

Observed real main window screenshot and UIA tree; main toolbar includes Snap to Object or Ruler/Snap to Grid/Show Grid. Reversible right-click on Text1 → Properties opened **Text Properties**. Foreground screenshot showed the single-object tree Text1 with Font, Text Format, Auto Fit, Border, Position, Error Handling, Data Sources→0001, two view buttons, and Data Source/Data Type/Transforms tabs. This is feature-matched Windows runtime evidence in the tool transcript, separate from REA output. The single/all toggle was **not** exercised or newly proven in this task.

Important observed failure: an occluded target capture sometimes returned the foreground Codex/other-app pixels while UIA described BarTender. Activating BarTender and refreshing produced the correct native screenshot, including a bounded Properties image. Reject screenshots whose visible app/title does not match the selected target. Subsequent user input caused the tool to reject a pending click; no retry was issued against stale coordinates. No typing, data editing, save, print or document close was performed. User applications and unsaved document remain open; unrelated foreground content is not retained as feature evidence.

Repeat recipe: read the Computer Use skill, initialize `sky`, `list_apps`/`list_windows`, select the observed BarTender window, `activate_window`, then `get_window_state`. Inspect target screenshot/UIA before any reversible action; one action then refresh. Record actual native observations and restore view settings when testing controls. Do not hardcode this session's handles/indexes in future sessions.

## Verification and remaining work

- `test/rea-alternatives.test.js`: actual metadata parser bounded rows/hash/tokens/unmatched/truncation, and refusal to overwrite an existing evidence directory. Uses installed PowerShell7 metadata assembly as fixture; no target code executed.
- Actual BarTend integration: metadata report, two native decompilation paths, and foreground Properties observation described above. Not a unit test or application behavior change.
- Required complete `npm run test:basic` result: see `test/basic-unit-result.json` and `test/basic-unit-output.log` from this task; final counts recorded in delivery.
- Original executable hash remains unchanged; REA source/config preserved. Broad unknown `unk_ee7a9193ec656ca26d9b52d869bc788bc906e2a2c8f4dccb6606a1a547cd8631` remains open. Tool routing is now usable; full BarTender parity, printing, every managed body, dialog rollback and timing behavior still require feature-specific evidence.
