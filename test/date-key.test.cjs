// Pin the zone BEFORE anything else: the Date literals below are evaluated at
// load time, so a `before` hook would leave them anchored to the runner's zone.
// Kiritimati is UTC+14, the extreme case where toISOString() reports the
// PREVIOUS day for most of the local day.
const originalTZ = process.env.TZ;
process.env.TZ = "Pacific/Kiritimati";

require("./setup-dom.cjs");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");

after(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

let toDateKey;
before(async () => {
  ({ toDateKey } = await import("../src/util/dates.js"));
});

describe("toDateKey", () => {
  it("uses the local calendar day, not UTC", () => {
    // Local midnight in UTC+14 is 10:00 UTC the PREVIOUS day.
    const d = new Date(2026, 3, 4);
    assert.equal(d.toISOString().slice(0, 10), "2026-04-03");
    assert.equal(toDateKey(d), "2026-04-04");
  });

  it("zero-pads month and day", () => {
    assert.equal(toDateKey(new Date(2026, 0, 5)), "2026-01-05");
    assert.equal(toDateKey(new Date(2026, 11, 25)), "2026-12-25");
  });

  it("round-trips through the router's #day/ hash format", () => {
    const key = toDateKey(new Date(2026, 3, 4));
    assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
  });
});
