import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/api';

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 17;

const hasIntlApi = () =>
  typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function';

function parseDateInput(dateInput: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  )
    return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

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

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = getTimeZoneFormatter(timeZone);
  const parts = formatter.formatToParts(date);
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

export function localDateAtHourToUtcIso(params: {
  dateInput: string;
  timezone: string;
  hour?: number;
  minute?: number;
}) {
  const { dateInput, timezone, hour = DEFAULT_START_HOUR, minute = 0 } = params;
  const parsed = parseDateInput(dateInput);
  if (!parsed) throw new Error('Invalid date format.');
  if (!isValidIanaTimezone(timezone)) throw new Error('Invalid timezone.');

  const utcGuess = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    hour,
    minute,
    0,
    0,
  );
  const initialOffset = getTimeZoneOffsetMs(timezone, new Date(utcGuess));
  let utcTs = utcGuess - initialOffset;
  const adjustedOffset = getTimeZoneOffsetMs(timezone, new Date(utcTs));
  if (adjustedOffset !== initialOffset) utcTs = utcGuess - adjustedOffset;
  return new Date(utcTs).toISOString().replace('.000Z', 'Z');
}

export function isScheduleDateInPast(params: {
  dateInput: string;
  timezone: string;
  nowMs?: number;
}) {
  const { dateInput, timezone, nowMs = Date.now() } = params;
  const scheduledStartAt = localDateAtHourToUtcIso({
    dateInput,
    timezone,
    hour: DEFAULT_START_HOUR,
  });
  const targetMs = Date.parse(scheduledStartAt);
  return Number.isFinite(targetMs) && targetMs < nowMs;
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

export type SchedulePreviewWindow = CandidateDayWindow;

export function buildSchedulePreview(params: {
  dateInput: string;
  timezone: string;
  totalDays?: number;
}): SchedulePreviewWindow[] {
  const { dateInput, timezone, totalDays = 5 } = params;
  const parsed = parseDateInput(dateInput);
  if (!parsed) return [];
  const seed = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const windows: SchedulePreviewWindow[] = [];
  for (let idx = 0; idx < totalDays; idx += 1) {
    const next = new Date(seed.getTime());
    next.setUTCDate(seed.getUTCDate() + idx);
    const yyyy = String(next.getUTCFullYear());
    const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(next.getUTCDate()).padStart(2, '0');
    const nextDateInput = `${yyyy}-${mm}-${dd}`;
    windows.push({
      dayIndex: idx + 1,
      windowStartAt: localDateAtHourToUtcIso({
        dateInput: nextDateInput,
        timezone,
        hour: DEFAULT_START_HOUR,
      }),
      windowEndAt: localDateAtHourToUtcIso({
        dateInput: nextDateInput,
        timezone,
        hour: DEFAULT_END_HOUR,
      }),
    });
  }
  return windows;
}

export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

export function countdownFromUtc(
  targetUtcIso: string | null | undefined,
  nowMs = Date.now(),
): CountdownParts {
  if (!targetUtcIso) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: true,
    };
  }
  const targetMs = Date.parse(targetUtcIso);
  if (!Number.isFinite(targetMs)) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: true,
    };
  }
  const remaining = Math.max(0, targetMs - nowMs);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return {
    totalMs: remaining,
    days,
    hours,
    minutes,
    seconds,
    complete: remaining <= 0,
  };
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.complete) return 'Starting now';
  const hours = String(parts.hours).padStart(2, '0');
  const minutes = String(parts.minutes).padStart(2, '0');
  const seconds = String(parts.seconds).padStart(2, '0');
  return `${parts.days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function normalizeDayWindows(
  dayWindows: CandidateDayWindow[] | undefined | null,
): CandidateDayWindow[] {
  if (!Array.isArray(dayWindows)) return [];
  return [...dayWindows].sort((a, b) => a.dayIndex - b.dayIndex);
}

export function firstWindowStartAt(
  params:
    | {
        scheduledStartAt?: string | null;
        dayWindows?: CandidateDayWindow[] | null;
        currentDayWindow?: CandidateCurrentDayWindow | null;
      }
    | null
    | undefined,
) {
  if (!params) return null;
  const currentStart = params.currentDayWindow?.windowStartAt;
  if (currentStart) return currentStart;
  const windows = normalizeDayWindows(params.dayWindows);
  if (windows[0]?.windowStartAt) return windows[0].windowStartAt;
  return params.scheduledStartAt ?? null;
}

type ScheduleFields = {
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[] | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export function hasScheduleConfigured(
  bootstrap: ScheduleFields | null | undefined,
): boolean {
  if (!bootstrap) return false;
  if (!bootstrap.scheduledStartAt || !bootstrap.candidateTimezone) return false;
  return normalizeDayWindows(bootstrap.dayWindows).length > 0;
}

export function isScheduleLocked(
  bootstrap: ScheduleFields | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!hasScheduleConfigured(bootstrap)) return false;
  const target = firstWindowStartAt(bootstrap);
  if (!target) return false;
  const targetMs = Date.parse(target);
  if (!Number.isFinite(targetMs)) return false;
  return nowMs < targetMs;
}
