require("./setup-dom.cjs");
const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert");
const { createTestEvent } = require("./helpers.cjs");

let init;
before(async () => {
  ({ init } = await import("../src/already-cal.js"));
});

// The widget's VISIBLE event times are viewer-local (formatEventWhen), but
// setEventMeta is deliberately SOURCE-anchored so the og:/twitter: card the
// client writes matches the one the worker renders server-side — a share link
// must read the same for everyone, not "whatever zone the sharer happened to be
// in". These tests are the guard rail on that invariant: a future DRY refactor
// that routes setEventMeta through formatEventWhen would silently swing og to
// viewer-local, and only this file would notice.
//
// Ambient TZ is manipulated per test to prove the output does NOT move with it.
let originalTZ;
before(() => {
  originalTZ = process.env.TZ;
});
after(() => {
  if (originalTZ === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTZ;
  }
});

const mounted = [];
afterEach(() => {
  for (const { instance, container } of mounted.splice(0)) {
    instance?.destroy?.();
    container.remove();
  }
  // setEventMeta appends <meta property="og:*"> to document.head; clear them so
  // each test observes only its own writes.
  for (const el of document.querySelectorAll("meta[property^='og:']")) {
    el.remove();
  }
});

const tick = () => new Promise((r) => setTimeout(r, 10));

/**
 * Mount the widget straight onto the event-detail view (initialEvent), which is
 * the only path that calls setEventMeta. Returns the og:description content.
 */
async function ogDescriptionFor({ event, calendarTimezone }) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const instance = init({
    el: container,
    initialEvent: event.id,
    data: {
      events: [event],
      calendar: {
        name: "Test Cal",
        description: "",
        timezone: calendarTimezone,
      },
    },
  });
  mounted.push({ instance, container });
  await tick();
  const metaEl = document.querySelector('meta[property="og:description"]');
  return metaEl ? metaEl.getAttribute("content") : null;
}

describe("setEventMeta keeps og:/twitter: share text source-anchored", () => {
  const nyEvent = createTestEvent({
    id: "og-1",
    title: "Concert in the Park",
    location: "Central Park",
    // 20:00 UTC on Jul 15 2026 = 4:00 PM EDT in New York.
    start: "2026-07-15T20:00:00Z",
    end: "2026-07-15T22:00:00Z",
    _sourceTimeZone: "America/New_York",
  });

  it("uses the event's _sourceTimeZone time + abbrev, not the viewer's", async () => {
    process.env.TZ = "Asia/Tokyo"; // viewer is a full day-part away from EDT
    const desc = await ogDescriptionFor({
      event: nyEvent,
      calendarTimezone: "America/Chicago",
    });
    assert.ok(desc, "og:description should be written on the detail view");
    // Source zone (America/New_York) wins over the merged calendar zone.
    // The exact range connector varies with ICU version, so assert on the
    // pieces rather than the whole "4:00 - 6:00 PM EDT" string.
    assert.match(desc, /July 15, 2026/, desc);
    assert.match(desc, /4:00/, `expected the EDT wall clock, got: ${desc}`);
    assert.match(desc, /EDT/, `expected the source abbrev, got: ${desc}`);
    // Tokyo's rendering of this instant (5:00 AM on Jul 16) must NOT appear.
    assert.doesNotMatch(desc, /July 16/, desc);
    assert.doesNotMatch(desc, /5:00 AM/, desc);
    assert.doesNotMatch(desc, /JST|GMT\+9/, desc);
    // The location still rides along after the middot separator.
    assert.match(desc, /Central Park/, desc);
  });

  it("carries an offset-style source abbrev (GMT+5:30) through to og:description", async () => {
    // Every other assertion in this file uses a three-letter abbrev. Zones
    // without a CLDR short name render as a raw GMT offset instead — a longer
    // label, and one that contains a colon — so prove that shape survives the
    // og path too, not just zoneAbbrev in isolation.
    process.env.TZ = "America/Chicago";
    const desc = await ogDescriptionFor({
      event: createTestEvent({
        id: "og-offset",
        title: "Morning Standup",
        // 20:00 UTC on Jul 15 2026 = 1:30 AM on Jul 16 in Kolkata (UTC+5:30).
        start: "2026-07-15T20:00:00Z",
        end: "2026-07-15T22:00:00Z",
        _sourceTimeZone: "Asia/Kolkata",
      }),
      calendarTimezone: "America/Chicago",
    });
    assert.ok(desc, "og:description should be written on the detail view");
    assert.match(desc, /July 16, 2026/, desc);
    assert.match(desc, /1:30/, `expected the Kolkata wall clock, got: ${desc}`);
    assert.match(desc, /GMT\+5:30/, `expected the offset abbrev, got: ${desc}`);
    // The Chicago viewer's rendering (3:00 PM CDT, Jul 15) must NOT appear.
    assert.doesNotMatch(desc, /CDT/, desc);
  });

  it("produces identical text regardless of the ambient viewer zone", async () => {
    process.env.TZ = "UTC";
    const fromUTC = await ogDescriptionFor({
      event: nyEvent,
      calendarTimezone: "America/Chicago",
    });
    process.env.TZ = "Pacific/Honolulu"; // UTC-10, opposite side of the source
    const fromHonolulu = await ogDescriptionFor({
      event: nyEvent,
      calendarTimezone: "America/Chicago",
    });
    assert.strictEqual(
      fromUTC,
      fromHonolulu,
      "share text must be stable across viewers — it has to match the server card",
    );
    assert.match(fromUTC, /4:00/, fromUTC);
    assert.match(fromUTC, /EDT/, fromUTC);
  });

  it("falls back to the calendar timezone when the event has no _sourceTimeZone", async () => {
    process.env.TZ = "Asia/Tokyo";
    const desc = await ogDescriptionFor({
      event: createTestEvent({
        id: "og-2",
        title: "Calendar-zone Event",
        location: "",
        start: "2026-07-15T20:00:00Z",
        end: "2026-07-15T22:00:00Z",
      }),
      calendarTimezone: "America/Chicago",
    });
    // 20:00 UTC is 3:00 PM CDT — the merged calendar zone, not Tokyo.
    assert.match(desc, /3:00/, desc);
    assert.match(desc, /CDT/, desc);
  });

  it("degrades to the calendar zone on a malformed _sourceTimeZone", async () => {
    // Intl throws a RangeError on an unknown zone; setEventMeta runs BEFORE the
    // detail view renders, so without resolveTimeZone this blocked detail-view
    // entry entirely rather than just mislabelling the share text.
    process.env.TZ = "UTC";
    const desc = await ogDescriptionFor({
      event: createTestEvent({
        id: "og-3",
        title: "Bad Zone Event",
        location: "",
        start: "2026-07-15T20:00:00Z",
        end: "2026-07-15T22:00:00Z",
        _sourceTimeZone: "Not/AZone",
      }),
      calendarTimezone: "America/Chicago",
    });
    assert.ok(desc, "og:description should still be written");
    assert.match(desc, /3:00/, desc);
    assert.match(desc, /CDT/, desc);
  });

  it("omits the zone abbrev for all-day events", async () => {
    process.env.TZ = "Asia/Tokyo";
    const desc = await ogDescriptionFor({
      event: createTestEvent({
        id: "og-4",
        title: "Street Fair",
        location: "",
        start: "2026-07-15",
        end: "2026-07-16",
        allDay: true,
        _sourceTimeZone: "America/New_York",
      }),
      calendarTimezone: "America/Chicago",
    });
    // All-day values are absolute — the entered date, no time, no abbrev.
    assert.match(desc, /July 15, 2026/, desc);
    assert.doesNotMatch(desc, /EDT|EST/, desc);
  });
});
