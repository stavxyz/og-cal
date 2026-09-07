import { safeRenderCard } from "../layouts/helpers.js";
import { getLayout } from "../layouts/registry.js";
import { setEventDetail } from "../router.js";
import { THEME_DEFAULTS } from "../theme.js";

/**
 * The event card, shown on hover (pointer) or tap (touch) from the month and
 * week views.
 *
 * The card is built by the same `getLayout()` + `safeRenderCard()` call the
 * grid view makes, so it is the same component rather than a copy that drifts
 * when a layout changes.
 *
 * ONE popover exists at a time, owned by this module. Every exit runs through
 * `closeEventPopover()`, which cancels both timers and unbinds every listener.
 * A hover popover's real failure mode is getting stuck: `mouseleave` never
 * fires if the anchor is destroyed underneath the pointer, which happens on
 * every re-render (month nav, tag filter, data refresh). So the widget calls
 * `closeEventPopover()` from `renderView()` and `destroy()`, and the listeners
 * below cover the rest: scroll, window blur, tab hide, Escape, and an outside
 * pointerdown.
 */

const OPEN_DELAY_MS = 150;
const CLOSE_GRACE_MS = 120;

let active = null;
let openTimer = null;
let closeTimer = null;

function clearTimers() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

/** Close the open popover, if any. Safe to call when nothing is open. */
export function closeEventPopover() {
  clearTimers();
  if (!active) return;
  const { el, detach, previousFocus } = active;
  active = null;
  detach();
  el.remove();
  // Only pull focus back if it is still inside the card we are removing;
  // otherwise the user has already moved on and we would steal it.
  if (previousFocus?.focus && el.contains(document.activeElement)) {
    previousFocus.focus();
  }
}

/**
 * Open the popover for `event`, anchored to `anchorEl`, inside `root`.
 *
 * Parented to the `.already` root rather than document.body so it inherits the
 * theme's custom properties and stays inside the embed's stacking context.
 */
export function openEventPopover(anchorEl, event, root, config) {
  closeEventPopover();
  config = config || {};
  const theme = config._theme || THEME_DEFAULTS;

  const el = document.createElement("div");
  el.className = "already-event-popover";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", event.title || "Event");

  const card = safeRenderCard(getLayout(theme.layout), event, {
    orientation: theme.orientation,
    imagePosition: theme.imagePosition,
    index: 0,
    timezone: config.timezone,
    locale: config.locale,
    config,
  });
  card.classList.add("already-event-popover__card");
  // The cue that a second click opens the detail view: pointer cursor, a lift
  // on hover, and a chevron. All three live in CSS on this class.
  card.addEventListener("click", () => {
    const id = event.id;
    closeEventPopover();
    setEventDetail(id);
  });
  el.appendChild(card);

  position(el, anchorEl, root);
  root.appendChild(el);

  const onKeydown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeEventPopover();
    }
  };
  const onPointerDown = (e) => {
    if (el.contains(e.target) || anchorEl.contains(e.target)) return;
    closeEventPopover();
  };
  // Scroll moves the anchor out from under an absolutely positioned card, and
  // blur/visibilitychange mean the pointer left without a mouseleave.
  const onDismiss = () => closeEventPopover();

  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("visibilitychange", onDismiss);
  window.addEventListener("scroll", onDismiss, true);
  window.addEventListener("blur", onDismiss);

  el.addEventListener("mouseenter", clearTimers);
  el.addEventListener("mouseleave", scheduleClose);

  active = {
    el,
    anchorEl,
    previousFocus: document.activeElement,
    detach() {
      document.removeEventListener("keydown", onKeydown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("visibilitychange", onDismiss);
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("blur", onDismiss);
    },
  };
  return el;
}

/**
 * Place the card next to its anchor, flipping when it would overflow `root`.
 * Falls back to a static position when layout metrics are unavailable, which
 * is the case in jsdom where every rect is zero.
 */
function position(el, anchorEl, root) {
  el.style.position = "absolute";
  const rootRect = root.getBoundingClientRect?.();
  const anchorRect = anchorEl.getBoundingClientRect?.();
  if (!rootRect || !anchorRect || !rootRect.width) return;

  const top = anchorRect.bottom - rootRect.top;
  let left = anchorRect.left - rootRect.left;
  // Keep the card inside the root's right edge. POPOVER_WIDTH mirrors the
  // width set in CSS; reading it back would force a second layout pass.
  const POPOVER_WIDTH = 300;
  if (left + POPOVER_WIDTH > rootRect.width) {
    left = Math.max(0, rootRect.width - POPOVER_WIDTH);
  }
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
}

function scheduleClose() {
  clearTimers();
  closeTimer = setTimeout(closeEventPopover, CLOSE_GRACE_MS);
}

/**
 * Bind hover and tap on an event label so it shows the card.
 *
 * Touch is handled on `pointerdown` and opens immediately; the hover path is
 * suppressed for it, because iOS synthesises mouseenter after a tap and would
 * otherwise run both.
 */
export function bindEventPopover(anchorEl, event, root, config) {
  anchorEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    clearTimers();
    if (active?.anchorEl === anchorEl) return; // second tap falls through to the card
    openEventPopover(anchorEl, event, root, config);
  });

  anchorEl.addEventListener("mouseenter", (e) => {
    if (e.pointerType === "touch") return;
    clearTimers();
    openTimer = setTimeout(() => {
      openEventPopover(anchorEl, event, root, config);
    }, OPEN_DELAY_MS);
  });

  anchorEl.addEventListener("mouseleave", () => {
    // Cancels a pending open too, so sweeping across a month never leaves a
    // ghost popover opening behind the pointer.
    scheduleClose();
  });
}
