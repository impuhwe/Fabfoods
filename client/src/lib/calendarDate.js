export const RESTAURANT_TIME_ZONE = 'Africa/Kigali';
export const RESTAURANT_TIME_ZONE_LABEL = 'Africa/Kigali (UTC+2)';

export const RESERVATION_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = String(Math.floor(index / 4)).padStart(2, '0');
  const minutes = String((index % 4) * 15).padStart(2, '0');
  const value = `${hours}:${minutes}`;
  return { value, label: value };
});

const KIGALI_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: RESTAURANT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DISPLAY_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const pad = (value) => String(value).padStart(2, '0');

export function parseDateString(value) {
  if (typeof value !== 'string') return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }

  return date;
}

export function formatDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getKigaliDateString(date = new Date()) {
  const parts = Object.fromEntries(
    KIGALI_DATE_FORMAT.formatToParts(date).map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDaysToDateString(value, days) {
  const date = parseDateString(value);
  if (!date) return '';

  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

export function isValidDateString(value) {
  return Boolean(parseDateString(value));
}

export function formatDisplayDate(value) {
  const date = parseDateString(value);
  return date ? DISPLAY_DATE_FORMAT.format(date) : '';
}

export function getKigaliDateBounds(daysAhead = 90) {
  const min = getKigaliDateString();
  return { min, max: addDaysToDateString(min, daysAhead) };
}
