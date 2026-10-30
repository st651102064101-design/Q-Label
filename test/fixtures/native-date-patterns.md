# Native extended date pattern fixture

Generated 2026-10-18 by calling the installed BarTender 12.1.0
`Seagull.Data.Formatting.DateTimeTypeFormatter.Format(DateTime,string)` directly.
DLL SHA256: `AF5E887ACE65E07537B95E75A10740A5481F85BAA667DF5C6980F8BD4234737D`.
Settings.CultureID = 1033 (en-US), no UTC conversion; dates are civil midnight.
Ten year-boundary/leap-day dates ×28 patterns =280 observations.

Covers Julian day-of-year j, ISO weekday u/week V/week-year v, Sunday weekday w,
Sunday/Monday week counts U/W, native W repetition behavior, uppercase Y year
widths, Canadian two-letter month cc, quoted literals and escaped j. The JSON
contains observations only; vendor DLLs and decompiled implementation are not
production dependencies. Q LABEL computes these calendar values independently
from the selected timezone's Gregorian civil date.

Does not establish all patterns, input parsing, @standard patterns, calendar or
locale combinations, legacy format IDs, native object defaults or hardware output.
