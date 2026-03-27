import type { CandidateDayWindow } from '@/features/candidate/api';
import { getTimeZoneOffsetMs, isValidIanaTimezone } from './scheduleIntl';

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 17;

function parseDateInput(dateInput: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
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
  const utcGuess = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour, minute, 0, 0);
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
  const scheduledStartAt = localDateAtHourToUtcIso({ dateInput, timezone, hour: DEFAULT_START_HOUR });
  const targetMs = Date.parse(scheduledStartAt);
  return Number.isFinite(targetMs) && targetMs < nowMs;
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
      windowStartAt: localDateAtHourToUtcIso({ dateInput: nextDateInput, timezone, hour: DEFAULT_START_HOUR }),
      windowEndAt: localDateAtHourToUtcIso({ dateInput: nextDateInput, timezone, hour: DEFAULT_END_HOUR }),
    });
  }
  return windows;
}
