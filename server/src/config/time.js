export const RESTAURANT_TIME_ZONE = 'Africa/Kigali';
export const RESTAURANT_UTC_OFFSET = '+02:00';

export function kigaliDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: RESTAURANT_TIME_ZONE }).format(date);
}

export function kigaliInstant(date, time) {
  return new Date(`${date}T${time}:00${RESTAURANT_UTC_OFFSET}`);
}

export function addDaysToKigaliDateString(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function kigaliDayBounds(date) {
  return {
    start: kigaliInstant(date, '00:00'),
    endExclusive: kigaliInstant(addDaysToKigaliDateString(date, 1), '00:00'),
  };
}
