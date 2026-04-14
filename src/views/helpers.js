import { isPast, getDatePartsInTz } from '../util/dates.js';
import { setEventDetail } from '../router.js';

/** Create a DOM element with optional class name and attributes. */
export function createElement(tag, className, attrs) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

/** Bind click and keyboard handlers to navigate to an event's detail view. */
export function bindEventClick(el, event, viewName, config, { stopPropagation = false } = {}) {
  function handleClick(e) {
    if (stopPropagation) e.stopPropagation();
    if (config.onEventClick) {
      const result = config.onEventClick(event, viewName);
      if (result === false) return;
    }
    setEventDetail(event.id);
  }
  el.addEventListener('click', handleClick);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      handleClick(e);
    }
  });
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
}

/** Apply base class plus --past and --featured modifier classes to an event element. */
export function applyEventClasses(el, event, baseClass) {
  let cls = baseClass;
  if (isPast(event.start)) cls += ` ${baseClass}--past`;
  if (event.featured) cls += ` ${baseClass}--featured`;
  el.className = cls;
}

/** Create a lazy-loaded image wrapper for an event thumbnail. */
export function createEventImage(event, className) {
  const wrapper = createElement('div', className);
  const img = document.createElement('img');
  img.src = event.image;
  img.alt = event.title;
  img.setAttribute('loading', 'lazy');
  img.onerror = () => { wrapper.style.display = 'none'; };
  wrapper.appendChild(img);
  return wrapper;
}

/** Filter out events with the hidden flag. */
export function filterHidden(events) {
  return events.filter(e => !e.hidden);
}

/** Sort events so featured events come first. */
export function sortFeatured(events) {
  return [...events].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

/** Sort events so featured events come first within each date group. */
export function sortFeaturedByDate(events, timezone, locale) {
  const dateKey = (e) => {
    const p = getDatePartsInTz(e.start, timezone, locale);
    return `${p.year}-${p.month}-${p.day}`;
  };
  // Group by date preserving original order, sort featured first within each group
  const groups = new Map();
  for (const e of events) {
    const key = dateKey(e);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.values()].flatMap(group =>
    [...group].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  );
}
