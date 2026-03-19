export function formatDate(isoString, timezone, locale) {
  locale = locale || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoString));
}

export function formatDateShort(isoString, timezone, locale) {
  locale = locale || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoString));
}

export function formatTime(isoString, timezone, locale) {
  locale = locale || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function formatDatetime(isoString, timezone, locale) {
  return `${formatDate(isoString, timezone, locale)} · ${formatTime(isoString, timezone, locale)}`;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month, weekStartDay) {
  weekStartDay = weekStartDay || 0;
  const raw = new Date(year, month, 1).getDay();
  return (raw - weekStartDay + 7) % 7;
}

export function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function isPast(isoString) {
  return new Date(isoString) < new Date();
}

export function getMonthName(year, month, locale) {
  locale = locale || 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(year, month));
}

export function getDatePartsInTz(isoString, timezone, locale) {
  locale = locale || 'en-US';
  const d = new Date(isoString);
  const fmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric',
  });
  const parts = {};
  for (const { type, value } of fmt.formatToParts(d)) {
    if (type === 'year') parts.year = parseInt(value);
    if (type === 'month') parts.month = parseInt(value) - 1;
    if (type === 'day') parts.day = parseInt(value);
  }
  return parts;
}

export function getWeekDates(date, weekStartDay) {
  weekStartDay = weekStartDay || 0;
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    dates.push(current);
  }
  return dates;
}

export function getDayNames(locale, weekStartDay) {
  locale = locale || 'en-US';
  weekStartDay = weekStartDay || 0;
  const names = [];
  // Use a known Sunday (Jan 4, 2026 is a Sunday)
  const base = new Date(2026, 0, 4);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + ((weekStartDay + i) % 7));
    names.push(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d));
  }
  return names;
}
