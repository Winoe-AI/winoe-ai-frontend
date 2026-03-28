import { isValidIanaTimezone } from './scheduleIntlUtils';

export function toDateInputInTimezone(
  iso: string,
  timezone: string | null | undefined,
): string | null {
  if (!iso || !timezone || !isValidIanaTimezone(timezone)) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
