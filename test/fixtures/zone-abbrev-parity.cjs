/**
 * (instant, zone) → expected short-zone-abbrev parity table.
 *
 * This repo and the already.events worker repo each run an INDEPENDENT `Intl`
 * self-check over THIS SAME table (there: `workers/embed/test/fixtures/
 * zone-abbrev-parity.ts`). The two repos can't import each other, so the rows
 * are kept identical by convention: if you add/edit/remove a row here, make
 * the same edit in the sibling table in the same change.
 *
 * ── THE SHAPE OF THE LITERAL BELOW IS LOAD-BEARING ───────────────────────────
 * already.events' `scripts/copy-already-cal.js` fetches THIS FILE from
 * `main` at vendor-bump time and regex-parses the array literal
 * (`scripts/zone-abbrev-parity.js`) to detect the two tables drifting apart.
 * That parser requires:
 *   - an array literal assigned to the name ZONE_ABBREV_CASES, terminated
 *     by a closing bracket + semicolon
 *   - rows of the form { instant: ..., zone: ..., abbrev: ... }
 *   - DOUBLE-quoted strings, in that field order (instant, zone, abbrev)
 *
 * (Those bullets deliberately avoid spelling out the assignment verbatim: the
 * parser's array-literal regex is non-greedy and would otherwise latch onto
 * the example in this very comment and parse zero rows.)
 *
 * CRITICALLY, the drift check FAILS OPEN: renaming the const, reordering the
 * fields, switching to single quotes, or moving/renaming this file does NOT
 * fail the sibling's bump. The parse error only downgrades the check to a
 * WARNING and the vendor bump proceeds unverified — so the tables can silently
 * drift for as long as nobody notices the warning. Coordinate any reshape of
 * this literal (or of this file's path) with a matching change to
 * already.events' `copy-already-cal.js` in the same window.
 *
 * The rows deliberately cover three DIFFERENT abbreviation SHAPES, because
 * each renders differently in the ` · {time} {abbrev}` suffix:
 *   - three-letter CLDR names (EDT/EST/CDT/UTC)
 *   - whole-hour GMT offsets (`GMT+12`) — not every zone has a three-letter
 *     CLDR short name; many render as a raw offset instead
 *   - sub-hour GMT offsets (`GMT+5:30`), which carry a colon and are the
 *     widest label the suffix has to accommodate
 * Keep at least one of each so a parity check can't pass on US-only
 * (or whole-hour-only) assumptions.
 */
const ZONE_ABBREV_CASES = [
  { instant: "2026-07-15T15:00:00Z", zone: "America/New_York", abbrev: "EDT" },
  { instant: "2026-01-15T15:00:00Z", zone: "America/New_York", abbrev: "EST" },
  { instant: "2026-07-15T15:00:00Z", zone: "America/Chicago", abbrev: "CDT" },
  { instant: "2026-07-15T15:00:00Z", zone: "UTC", abbrev: "UTC" },
  {
    instant: "2026-07-15T15:00:00Z",
    zone: "Pacific/Auckland",
    abbrev: "GMT+12",
  },
  { instant: "2026-07-15T15:00:00Z", zone: "Asia/Kolkata", abbrev: "GMT+5:30" },
];

module.exports = { ZONE_ABBREV_CASES };
