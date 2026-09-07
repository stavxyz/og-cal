const originalTZ = process.env.TZ;
process.env.TZ = "America/Chicago";

require("../setup-dom.cjs");
const {
  describe,
  it,
  before,
  beforeEach,
  afterEach,
  after,
} = require("node:test");
const assert = require("node:assert");
const { createTestEvent } = require("../helpers.cjs");

after(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

let openEventPopover, closeEventPopover, bindEventPopover;
before(async () => {
  ({ openEventPopover, closeEventPopover, bindEventPopover } = await import(
    "../../src/ui/event-popover.js"
  ));
});

let root, anchor, event;
const POPOVER = ".already-event-popover";
const find = () => root.querySelector(POPOVER);

beforeEach(() => {
  document.body.innerHTML = "";
  root = document.createElement("div");
  root.className = "already";
  document.body.appendChild(root);
  anchor = document.createElement("div");
  anchor.className = "already-month-chip";
  root.appendChild(anchor);
  event = createTestEvent({ title: "Wine Dinner" });
  window.location.hash = "";
});

afterEach(() => closeEventPopover());

describe("event popover", () => {
  it("renders the same card the grid layout produces", () => {
    openEventPopover(anchor, event, root, {});
    const pop = find();
    assert.ok(pop, "popover exists");
    assert.ok(pop.querySelector(".already-card"), "contains a layout card");
    assert.match(pop.textContent, /Wine Dinner/);
  });

  it("is parented to the .already root, not document.body", () => {
    openEventPopover(anchor, event, root, {});
    assert.equal(find().parentElement, root);
    assert.equal(document.body.querySelector(`:scope > ${POPOVER}`), null);
  });

  it("only ever has one open at a time", () => {
    openEventPopover(anchor, event, root, {});
    openEventPopover(anchor, event, root, {});
    assert.equal(root.querySelectorAll(POPOVER).length, 1);
  });

  it("clicking the card opens the event detail view", () => {
    openEventPopover(anchor, event, root, {});
    find().querySelector(".already-card").click();
    assert.match(window.location.hash, /^#event\//);
  });

  // --- every close path: the stuck-popover risk ---

  it("closes on Escape", () => {
    openEventPopover(anchor, event, root, {});
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal(find(), null);
  });

  it("closes on an outside pointerdown", () => {
    openEventPopover(anchor, event, root, {});
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    outside.dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
    assert.equal(find(), null);
  });

  it("does NOT close on a pointerdown inside the card", () => {
    openEventPopover(anchor, event, root, {});
    find().dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
    assert.ok(find(), "still open");
  });

  it("closes on scroll", () => {
    openEventPopover(anchor, event, root, {});
    window.dispatchEvent(new window.Event("scroll"));
    assert.equal(find(), null);
  });

  it("closes when the window loses focus", () => {
    openEventPopover(anchor, event, root, {});
    window.dispatchEvent(new window.Event("blur"));
    assert.equal(find(), null);
  });

  it("closes when the tab is hidden", () => {
    openEventPopover(anchor, event, root, {});
    document.dispatchEvent(new window.Event("visibilitychange"));
    assert.equal(find(), null);
  });

  // The failure mouseleave cannot catch: the anchor is destroyed by a
  // re-render while the pointer is still over it, so no pointer event ever
  // fires again on it.
  it("closes when the anchor is removed from the DOM", () => {
    openEventPopover(anchor, event, root, {});
    anchor.remove();
    closeEventPopover();
    assert.equal(find(), null);
  });

  it("closeEventPopover is safe to call when nothing is open", () => {
    closeEventPopover();
    closeEventPopover();
    assert.equal(find(), null);
  });

  it("removes its listeners on close, so a later Escape cannot throw", () => {
    openEventPopover(anchor, event, root, {});
    closeEventPopover();
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal(find(), null);
  });

  // --- binding behavior ---

  it("bindEventPopover does not open on a touch pointerdown's synthetic hover", () => {
    bindEventPopover(anchor, event, root, {});
    const e = new window.Event("pointerdown", { bubbles: true });
    e.pointerType = "touch";
    anchor.dispatchEvent(e);
    // touch opens immediately rather than via the hover delay
    assert.ok(find(), "touch tap opens the popover");
  });
});
