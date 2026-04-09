import { getDaysInMonth, getFirstDayOfMonth, getMonthName, isToday, getDatePartsInTz, getDayNames } from '../util/dates.js';
import { createElement, bindEventClick, filterHidden, sortFeatured } from './helpers.js';

export function renderMonthView(container, events, timezone, currentDate, config) {
  config = config || {};
  const locale = config.locale;
  const weekStartDay = config.weekStartDay || 0;
  const maxEventsPerDay = config.maxEventsPerDay || 3;
  const i18n = config.i18n || {};
  const moreEventsTemplate = i18n.moreEvents || '+{count} more';

  events = filterHidden(events);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month, weekStartDay);
  const monthName = getMonthName(year, month, locale);
  const dayNames = getDayNames(locale, weekStartDay);

  // Group events by date in the calendar's timezone
  const eventsByDate = {};
  for (const event of events) {
    const parts = getDatePartsInTz(event.start, timezone, locale);
    const key = `${parts.year}-${parts.month}-${parts.day}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  }

  const grid = createElement('div', 'already-month');

  // Navigation
  const nav = createElement('div', 'already-month-nav');

  const prevBtn = createElement('button', 'already-month-prev', { 'aria-label': 'Previous month' });
  prevBtn.textContent = '\u2039';
  prevBtn.addEventListener('click', () => {
    renderMonthView(container, events, timezone, new Date(year, month - 1, 1), config);
  });
  nav.appendChild(prevBtn);

  const title = createElement('span', 'already-month-title');
  title.textContent = `${monthName} ${year}`;
  nav.appendChild(title);

  const nextBtn = createElement('button', 'already-month-next', { 'aria-label': 'Next month' });
  nextBtn.textContent = '\u203a';
  nextBtn.addEventListener('click', () => {
    renderMonthView(container, events, timezone, new Date(year, month + 1, 1), config);
  });
  nav.appendChild(nextBtn);

  grid.appendChild(nav);

  // Day headers
  const headerRow = createElement('div', 'already-month-header', { role: 'row' });
  for (const name of dayNames) {
    const cell = createElement('div', 'already-month-dayname');
    cell.textContent = name;
    headerRow.appendChild(cell);
  }
  grid.appendChild(headerRow);

  // Calendar body
  const body = createElement('div', 'already-month-body', { role: 'grid' });

  let row = createElement('div', 'already-month-row', { role: 'row' });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    row.appendChild(createElement('div', 'already-month-cell already-month-cell--empty', { role: 'gridcell' }));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const key = `${year}-${month}-${d}`;
    const dayEvents = sortFeatured(eventsByDate[key] || []);
    const today = isToday(cellDate);

    const cell = createElement('div', null, { role: 'gridcell' });
    cell.className = 'already-month-cell' + (today ? ' already-month-cell--today' : '') +
      (dayEvents.length ? ' already-month-cell--has-events' : '');

    const dayNum = createElement('div', 'already-month-day');
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    for (const event of dayEvents.slice(0, maxEventsPerDay)) {
      const chip = createElement('div', 'already-month-chip' + (event.featured ? ' already-month-chip--featured' : ''));
      chip.textContent = event.title;
      bindEventClick(chip, event, 'month', config, { stopPropagation: true });
      cell.appendChild(chip);
    }

    if (dayEvents.length > maxEventsPerDay) {
      const more = createElement('div', 'already-month-more');
      more.textContent = moreEventsTemplate.replace('{count}', dayEvents.length - maxEventsPerDay);
      cell.appendChild(more);
    }

    row.appendChild(cell);

    if ((firstDay + d) % 7 === 0) {
      body.appendChild(row);
      row = createElement('div', 'already-month-row', { role: 'row' });
    }
  }

  // Fill remaining cells
  const remaining = (firstDay + daysInMonth) % 7;
  if (remaining > 0) {
    for (let i = remaining; i < 7; i++) {
      row.appendChild(createElement('div', 'already-month-cell already-month-cell--empty', { role: 'gridcell' }));
    }
    body.appendChild(row);
  }

  grid.appendChild(body);
  container.innerHTML = '';
  container.appendChild(grid);
}
