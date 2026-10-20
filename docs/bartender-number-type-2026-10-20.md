# Number Data Type — 2026-10-20, v1.048

## Scope and design

User reference: Data Sources > Data Type > Number. Reuse the approved Properties implementation scope. Keep Q LABEL surfaces and native control order: Type, Locale, grouping, leading zero, precision mode/count, negative pattern, Sample. Change valid settings immediately, retain the active numeric input, and persist on Close. Maximum disables/hides decimal-count input. Decimal sample precedes this source's transforms; output still runs the transforms for actual objects and printing.

Special Hexadecimal/Roman/Scientific remain accessible as native Locale entries, preserving the application's existing capabilities. Decimal Number is the native parity scope; scientific keeps an explicitly functioning decimal-places input rather than advertising unsupported precision modes.

## REA evidence (static, not UI execution)

REA 6.7.0, upstream https://github.com/morluto/rea at dfe8378cf5a727e3d93d47a5986233175c6ef898. Installed skill read. CLI used because no REA MCP/native decompiler is configured:

```
node D:/QLabel-agent-work/npm-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs inspect-managed-members C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll --type BarTender.Managed.DataTypes.NumberTypePage --json
node D:/QLabel-agent-work/npm-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs inspect-managed-members D:/Programs/Seagull.Data.Formatting.dll --type Seagull.Data.Formatting.NumericTypeFormatter --type Seagull.Data.Formatting.NumericTypeFormatterSettings --json
```

- Native app: D:/Programs/BarTend.exe, SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 (matching retained target identity).
- Managed UI artifact SHA256 f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389.
- Formatter artifact SHA256 af5e887ace65e07537b95e75a10740a5481f85baa667df5c6980f8bd4234737d (rechecked this task).
- UI Evidence ID ev_1bf1d3fcd0dc0071ebacec0a4f2c444fc63dd860ef1261743173f6f538636c9d, saved D:/QLabel-agent-work/rea-20261019/number-type-page-evidence.json.
- Formatter Evidence ID ev_51946b190069e9350b84060bd977790255bcd8fb2ec2c6547df88b260619f346, saved number-formatter-evidence.json in the same directory.
- Selected managed types have complete metadata coverage. Controls and handlers include UpdateControlsForLocale, UpdateNegativeNumbers, DecimalPlaces_UpdateVisible, UpdateSample; settings expose LeadingZero, GroupSeparator, Precision, DecimalPlaces and NegativePattern. Metadata is not a behavioral or pixel proof.

## Separate isolated native runtime/resource measurements

Windows PowerShell 5 subprocesses loaded the installed formatter and managed resource assembly. They did not attach to or change the user's app, show native windows, or print. Scripts retained under D:/QLabel-agent-work/rea-20261019: number-native-probe.ps1, number-locale-probe.ps1, number-capture.ps1, number-edge-capture.ps1, number-leading-capture.ps1. These are ordinary isolated native measurements, not REA output.

- English page resource precision choices: Fixed at, Limit to, Maximum; five patterns (1,234.10), -1,234.10, - 1,234.10, 1,234.10-, 1,234.10 -.
- Hidden NumberTypePage control inspection: decimal places 0..30; hex length 1..16.
- NumericTypeFormatter.GetAvailableNumberCultures returned 262 entries, including three special notations. Captured culture separators/group sizes, native digits, default decimal count and negative pattern in gui/number-format.js. CultureSupport.ShowLeadingZero(Int32) captured default leading-zero flags; all returned true on this installation.
- Formatter Precision enum FixedAt/LimitedTo/Unlimited maps to fixed/limit/maximum. Fixed pads; Limit trims and caps; Maximum preserves decimal input precision. Measured rounding is half away from zero, e.g. 1.005 -> 1.01, -1.005 -> -1.01 at 2 places.
- Committed native output fixtures: 1,200 combinations across en-US/de-DE/hi-IN/ar-SA/th-TH, 3 modes, 2 leading-zero settings, 5 signs and 8 values; plus 108 edge cases across 6 locales (adds fa-IR), native digits, no grouping, zero/negative-zero rounding, 0/30 decimal places.

## Implementation

- gui/number-format.js: captured locale catalog, exact decimal text rounding with BigInt, locale group sizes, leading zero and five negative patterns/native digits. No binary float rounding of original decimal strings.
- gui/source-types.js: shared formatter used in renderer and Node output. Number permits 0..30 decimal places; unrelated type limits remain unchanged. Existing special notation implementations retained.
- gui/source-session.js: evaluateType isolates this source's type sample before its own transforms without mutating the document.
- gui/object-data-sources-ui.js and modern CSS: native order, locale select, contextual fields, live sample, HTML input validation and compact wrapping precision row. gui/index.html loads shared formatter before SourceTypes.

## Verification and limits

Targeted tests first failed for missing controls/format behavior, then passed. test/number-format.test.js asserts all 1,308 native outputs plus validation/exact decimal precision. test/number-type-ui.test.js checks real session output, live/reopen/invalid input, special locale selection and sample before transforms. Electron test/number-type-runtime.js uses an isolated profile and validates actual live object, Sample, focus, horizontal bounds, Close/reopen, prepared preview and generated native ZPL without calling transport. Screenshot: test-results/number-type-runtime.png.

Whole Basic Suite result is recorded in test/basic-unit-result.json and test/basic-unit-output.log after execution. Unit/DOM and Electron are distinct from printer measurements.

Unknowns: no claim of 100% full BarTender or pixel parity. Not every locale's user-customized OS defaults or native interactive dropdown/keyboard state has been measured. Currency/Percentage/Fraction are outside this Number-page change. Special notations retain earlier implementations and limitations. Numeric transforms still use JavaScript Number values; exact decimal input rendering does not prove exact decimal arithmetic through arbitrary transforms. Dynamic sources requiring external prepared inputs show an explicit diagnostic when no sample input is available. No physical printer output or packaged release verified.

Final verification: npm run test:basic completed at 2026-10-20T02:51:40.191Z for v1.048: 810/810 tests passed, 0 failed/cancelled/skipped, all 3 legacy scripts passed, no undocumented test files. git diff --cached --check passed. Independent Superpowers code review identified double parsing of numeric values under Input Locale; fixed and covered by a failing-then-passing numeric/localized-string regression. A first Basic run caught a UTF-8 locale-capture error; corrected the capture and reran the complete suite. One isolated Electron recheck timed out during the full-suite run; a subsequent instrumented run passed renderer, print and screenshot checks. Its transient timeout cause is not established; it is not claimed as a smoothness benchmark.
