# View Icons, Sticky Header, and Pagination — Design Spec

**Date**: 2026-04-13
**Scope**: Three features delivered in one PR, built sequentially: icons, sticky, pagination.

---

## Feature 1: View Selector Icons

### Summary

Each view tab (Month, Week, Day, Grid, List) gets an inline SVG icon to the left of its text label. Style is minimal geometric, stroke-based, 16x16.

### Implementation

- A `VIEW_ICONS` constant in `src/ui/view-selector.js` maps view names to SVG element creation functions.
- Each SVG: `width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"`, `aria-hidden="true"`.
- `renderViewSelector` prepends the icon SVG to each tab button before the text.

### Icon Designs

- **Month**: Grid with horizontal header bar, two vertical dividers, one horizontal divider — represents a calendar grid.
- **Week**: Three tall vertical columns — represents day columns.
- **Day**: Single tall rectangle with three horizontal lines inside — represents an agenda.
- **Grid**: Four equal squares in a 2x2 layout — represents a card grid.
- **List**: Three horizontal lines — represents a list.

### CSS Changes

- `.already-view-tab`: Add `display: inline-flex; align-items: center; gap: 0.35rem;` so icon and label sit side by side.
- SVG inherits `currentColor` from the tab, so active/hover states work automatically.

### Config

No new config params. Icons are always rendered.

---

## Feature 2: Sticky Header

### Summary

The header container, view selector container, and tag filter container use `position: sticky` to remain visible while scrolling. Fully configurable via a `sticky` config param.

### Config

```js
sticky: true | false | {
  header: boolean,       // .already-header-container — default true
  viewSelector: boolean, // .already-selector-container — default true
  tagFilter: boolean,    // .already-tag-filter-container — default true
}
```

- `sticky: true` (default) — all three sections stick.
- `sticky: false` — nothing sticks.
- `sticky: { header: false, viewSelector: true, tagFilter: true }` — granular control.

### Implementation

- In `init()`, after creating the layout containers, resolve `config.sticky` into a normalized object `{ header: bool, viewSelector: bool, tagFilter: bool }`.
- Apply the class `already-sticky` to each enabled container.
- After the initial render, measure the rendered height of each preceding sticky container and set `top` via CSS custom properties or inline styles, so sticky elements stack correctly below each other.
- On window resize, recalculate sticky `top` values (heights may change).
- Add `--already-background` (or `--already-surface`) as the background on sticky containers so scrolling content doesn't bleed through.

### CSS Changes

```css
.already-header-container.already-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--already-background);
}
.already-selector-container.already-sticky {
  position: sticky;
  z-index: 9;
  background: var(--already-background);
}
.already-tag-filter-container.already-sticky {
  position: sticky;
  z-index: 8;
  background: var(--already-background);
}
```

The `top` value for selector and tag filter is set dynamically via JS based on the measured heights of the sticky elements above them.

### Edge Cases

- **Detail view**: Selector is cleared on detail view. Sticky classes remain on the container (harmless since it's empty), or can be removed during detail rendering for cleanliness.
- **No header**: When `showHeader: false`, the header container is not rendered. Selector gets `top: 0`.
- **Resize**: A resize observer or `resize` event listener recalculates `top` offsets.

### DEFAULTS Update

Add to `DEFAULTS`:
```js
sticky: true,
```

---

## Feature 3: Pagination for Grid & List Views

### Summary

Grid and list views show a configurable number of events per page (default 10) with "Load more" and "Show earlier" buttons. Month, week, and day views are unaffected.

### Config

```js
pageSize: 10,  // number of events per page in grid/list views
```

### i18n

New keys in `I18N_DEFAULTS`:
```js
loadMore: 'Load more',
showEarlier: 'Show earlier',
```

### State

In `already-cal.js`, add pagination state:
```js
let paginationState = { futureCount: 0, pastCount: 0 };
```

- `futureCount`: Number of additional events loaded beyond the initial page.
- `pastCount`: Number of additional past events loaded beyond the initial page.
- Reset to `{ futureCount: 0, pastCount: 0 }` on: view switch, past toggle, tag filter change.

### Event Slicing Logic

`getFilteredEvents()` remains unchanged — returns all matching events.

A new function `paginateEvents(events, config)` is called only for grid/list views:

**When `showPast` is off (default)**:
- Events are sorted chronologically (soonest first) — this is the existing behavior.
- Slice: `events.slice(0, config.pageSize + paginationState.futureCount)`.
- "Load more" button shown when `slicedEvents.length < events.length`.
- Button text: `"Load more"` with remaining count, e.g., `"Load more (15 remaining)"`.

**When `showPast` is on**:
- Events are sorted chronologically (oldest first) — existing behavior.
- Split into past and future at the current time boundary.
- Past events (reverse chronological): `pastEvents.slice(0, config.pageSize + paginationState.pastCount)`.
- Future events: `futureEvents.slice(0, config.pageSize + paginationState.futureCount)`.
- "Show earlier" button shown above past events when more past events exist.
- "Load more" button shown below future events when more future events exist.

### UI

- **"Load more" button**: Appended after the grid/list container. Class: `already-load-more`. Styled similarly to `.already-past-toggle`.
- **"Show earlier" button**: Prepended before the grid/list container. Class: `already-show-earlier`. Same styling.
- Both buttons show remaining count: `"Load more (N remaining)"`.
- When no more events exist in a direction, the corresponding button is not rendered.
- Clicking either button increments the corresponding counter and re-renders the view.

### Rendering Flow

In `renderView()`, for grid/list views:
1. Get all filtered events via `getFilteredEvents()`.
2. Call `paginateEvents(events, config)` which returns `{ visible, hasMoreFuture, hasMorePast, remainingFuture, remainingPast }`.
3. Pass `visible` to `renderGridView` / `renderListView`.
4. Render "show earlier" button if `hasMorePast`.
5. Render "load more" button if `hasMoreFuture`.

### Scroll Anchoring

After a "load more" click, the view re-renders with more events. To avoid disorienting jumps:
- Before re-render, capture `scrollY` and the `offsetTop` of the last visible event element.
- After re-render, find the same event element (by `data-event-id`) and set `window.scrollTo(0, element.offsetTop - savedRelativeOffset)`.
- "Show earlier" prepends events above, which would push content down. Same anchoring approach: capture the first visible event's position, re-render, restore scroll to keep it in place.

### Month/Week/Day

Completely unaffected. They receive the full event array and use their own date-based navigation.

### DEFAULTS Update

Add to `DEFAULTS`:
```js
pageSize: 10,
```

---

## Files Affected

### New Files
- None

### Modified Files
- `src/ui/view-selector.js` — Add SVG icons to tab buttons
- `src/already-cal.js` — Sticky setup, pagination state, pagination logic, new defaults
- `already-cal.css` — Sticky styles, icon flex layout, load more / show earlier button styles

### Test Files
- `test/ui/view-selector.test.js` — Icon rendering tests
- `test/ui/sticky.test.js` — Sticky class application, config parsing
- `test/pagination.test.js` — Event slicing, button rendering, state reset

---

## Architecture Notes

- **Icons**: Pure presentation change, no state.
- **Sticky**: CSS + minimal JS for height measurement. Config-driven.
- **Pagination**: State lives in `already-cal.js` alongside existing `showPast` state. Grid/list renderers are unaware of pagination — they receive a pre-sliced array. The pagination UI (buttons) is rendered by `already-cal.js` around the view container, similar to how `renderPastToggle` works.

This keeps the view renderers simple and the pagination logic centralized.
