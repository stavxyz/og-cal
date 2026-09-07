// Pin the zone before the Date literals below are evaluated at load time.
const originalTZ = process.env.TZ;
process.env.TZ = "America/Chicago";

require("../setup-dom.cjs");
const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const { createTestEvent } = require("../helpers.cjs");

after(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

let renderMonthView, renderWeekView;
before(async () => {
  ({ renderMonthView } = await import("../../src/views/month.js"));
  ({ renderWeekView } = await import("../../src/views/week.js"));
});

let container;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  window.location.hash = "";
});

const APRIL = new Date(2026, 3, 1);

describe("month view: clicking a day cell", () => {
  it("navigates to that day, using the local calendar date", () => {
    renderMonthView(container, [], "America/Chicago", APRIL, {});
    const cells = container.querySelectorAll(
      ".already-month-cell:not(.already-month-cell--empty)",
    );
    cells[3].click(); // 4th real day = April 4
    assert.equal(window.location.hash, "#day/2026-04-04");
  });

  it("navigates for a day with no events", () => {
    renderMonthView(container, [], "America/Chicago", APRIL, {});
    const cells = container.querySelectorAll(
      ".already-month-cell:not(.already-month-cell--empty)",
    );
    cells[0].click();
    assert.equal(window.location.hash, "#day/2026-04-01");
  });

  it("does NOT navigate from a padding cell", () => {
    renderMonthView(container, [], "America/Chicago", APRIL, {});
    const empty = container.querySelector(".already-month-cell--empty");
    if (empty) {
      empty.click();
      assert.equal(window.location.hash, "");
    }
  });

  it("does not advertise itself to assistive tech as a button", () => {
    // Deliberate: this is a pointer-only affordance, so it must not claim to
    // be keyboard-operable when it is not.
    renderMonthView(container, [], "America/Chicago", APRIL, {});
    const cell = container.querySelector(
      ".already-month-cell:not(.already-month-cell--empty)",
    );
    assert.equal(cell.getAttribute("role"), "gridcell");
    assert.equal(cell.getAttribute("tabindex"), null);
  });

  it("clicking an event chip opens the event, not the day", () => {
    const events = [createTestEvent({ start: "2026-04-04T15:00:00Z" })];
    renderMonthView(container, events, "America/Chicago", APRIL, {});
    const chip = container.querySelector(".already-month-chip");
    chip.click();
    assert.match(window.location.hash, /^#event\//);
  });
});

describe("week view: clicking a day column", () => {
  it("navigates to that day", () => {
    renderWeekView(container, [], "America/Chicago", new Date(2026, 3, 8), {});
    const col = container.querySelector(".already-week-col");
    col.click();
    assert.match(window.location.hash, /^#day\/2026-04-\d{2}$/);
  });

  it("clicking an event block opens the event, not the day", () => {
    const events = [createTestEvent({ start: "2026-04-08T15:00:00Z" })];
    renderWeekView(
      container,
      events,
      "America/Chicago",
      new Date(2026, 3, 8),
      {},
    );
    const block = container.querySelector(".already-week-event");
    block.click();
    assert.match(window.location.hash, /^#event\//);
  });
});
