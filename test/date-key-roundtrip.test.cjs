// Zones west of UTC are where the round trip breaks, so pin one. Set before
// anything else: the Date literals below evaluate at load time.
const originalTZ = process.env.TZ;
process.env.TZ = "America/Chicago";

require("./setup-dom.cjs");
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");

after(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

let toDateKey, parseDateKey, parseHash, init;
before(async () => {
  ({ toDateKey, parseDateKey } = await import("../src/util/dates.js"));
  ({ parseHash } = await import("../src/router.js"));
  ({ init } = await import("../src/already-cal.js"));
});

// The bug this pins: toDateKey emits a LOCAL calendar key, and reading it back
// with `new Date("2026-04-04")` parses the date-only form as UTC midnight. In
// America/Chicago that is 19:00 on April 3, so clicking the April 4 cell
// rendered a day view titled April 3 holding April 3's events.
describe("day key round trip", () => {
  it("parseDateKey inverts toDateKey", () => {
    const original = new Date(2026, 3, 4);
    const back = parseDateKey(toDateKey(original));
    assert.equal(back.getFullYear(), 2026);
    assert.equal(back.getMonth(), 3);
    assert.equal(back.getDate(), 4);
  });

  it("new Date() on the key does NOT invert it, which is why parseDateKey exists", () => {
    assert.equal(new Date("2026-04-04").getDate(), 3);
    assert.equal(parseDateKey("2026-04-04").getDate(), 4);
  });

  // Goes through the real widget rather than calling parseDateKey here: the
  // bug lived in already-cal.js's `case "day"`, so a test that resolves the
  // date itself proves the helper and not the wiring.
  it("renders the clicked day through the real dispatch", async () => {
    const key = toDateKey(new Date(2026, 3, 4));
    assert.equal(key, "2026-04-04");
    assert.equal(parseHash.name, "parseHash");

    // 20:00 local on April 4 in Chicago is 01:00 UTC on April 5, so an event
    // bucketed by UTC would land on the wrong day too.
    const evening = new Date(2026, 3, 4, 20, 0).toISOString();
    const container = document.createElement("div");
    document.body.appendChild(container);
    window.location.hash = `day/${key}`;

    const instance = init({
      el: container,
      data: {
        calendar: { timezone: "America/Chicago" },
        events: [
          { id: "e1", title: "Evening Event", start: evening, end: evening },
        ],
      },
      views: ["month", "day"],
      defaultView: "month",
      // April 2026 is in the past, and the widget short-circuits to its empty
      // state before dispatching to a view when nothing is visible.
      showPastEvents: true,
    });

    try {
      // init resolves its data before the first render.
      await new Promise((r) => setTimeout(r, 300));
      const title = container.querySelector(".already-day-title").textContent;
      assert.match(title, /April 4, 2026/);
      assert.doesNotMatch(title, /April 3/);
      assert.match(container.textContent, /Evening Event/);
    } finally {
      instance.destroy();
      container.remove();
    }
  });
});
