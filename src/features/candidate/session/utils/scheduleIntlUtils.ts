const hasIntlApi = () =>
  typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function';

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function getTimeZoneFormatter(timeZone: string) {
  const cached = dateTimeFormatCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  dateTimeFormatCache.set(timeZone, formatter);
  return formatter;
}

export function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = getTimeZoneFormatter(timeZone).formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));
  const utcTs = Date.UTC(year, month - 1, day, hour, minute, second);
  return utcTs - date.getTime();
}

export function detectBrowserTimezone(): string | null {
  if (!hasIntlApi()) return null;
  const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function isValidIanaTimezone(timezone: string): boolean {
  if (!hasIntlApi()) return false;
  const normalized = timezone.trim();
  if (!normalized) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function supportedTimezones(): string[] {
  if (!hasIntlApi()) return [];
  const candidateIntl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof candidateIntl.supportedValuesOf !== 'function') return [];
  try {
    const values = candidateIntl.supportedValuesOf('timeZone');
    return Array.isArray(values)
      ? values.filter((value) => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}
