import {
  countdownFromUtc,
  firstWindowStartAt,
  hasScheduleConfigured,
  isScheduleDateInPast,
  isScheduleLocked,
  localDateAtHourToUtcIso,
} from '@/features/candidate/session/utils/scheduleUtils';

describe('candidate schedule utilities', () => {
  it('converts local date at 9AM to UTC using timezone', () => {
    const utc = localDateAtHourToUtcIso({
      dateInput: '2026-03-10',
      timezone: 'America/New_York',
    });
    expect(utc).toBe('2026-03-10T13:00:00Z');
  });

  it('validates schedule date is not in the past', () => {
    const now = Date.parse('2026-03-10T12:00:00Z');
    expect(
      isScheduleDateInPast({
        dateInput: '2026-03-09',
        timezone: 'America/New_York',
        nowMs: now,
      }),
    ).toBe(true);
    expect(
      isScheduleDateInPast({
        dateInput: '2026-03-10',
        timezone: 'America/New_York',
        nowMs: now,
      }),
    ).toBe(false);
  });

  it('calculates countdown from backend UTC timestamp', () => {
    const now = Date.parse('2026-03-10T13:00:00Z');
    const countdown = countdownFromUtc('2026-03-12T14:30:10Z', now);
    expect(countdown.complete).toBe(false);
    expect(countdown.days).toBe(2);
    expect(countdown.hours).toBe(1);
    expect(countdown.minutes).toBe(30);
    expect(countdown.seconds).toBe(10);
  });

  it('selects first countdown target from day windows before scheduledStartAt', () => {
    const target = firstWindowStartAt({
      scheduledStartAt: '2026-03-10T15:00:00Z',
      dayWindows: [
        {
          dayIndex: 2,
          windowStartAt: '2026-03-11T13:00:00Z',
          windowEndAt: '2026-03-11T21:00:00Z',
        },
        {
          dayIndex: 1,
          windowStartAt: '2026-03-10T13:00:00Z',
          windowEndAt: '2026-03-10T21:00:00Z',
        },
      ],
      currentDayWindow: null,
    });
    expect(target).toBe('2026-03-10T13:00:00Z');
  });

  it('marks configured schedule as locked before first window opens', () => {
    const bootstrap = {
      candidateSessionId: 9,
      status: 'in_progress' as const,
      trial: { title: 'Sim', role: 'Backend' },
      scheduledStartAt: '2026-03-10T13:00:00Z',
      candidateTimezone: 'America/New_York',
      dayWindows: [
        {
          dayIndex: 1,
          windowStartAt: '2026-03-10T13:00:00Z',
          windowEndAt: '2026-03-10T21:00:00Z',
        },
      ],
    };
    expect(hasScheduleConfigured(bootstrap)).toBe(true);
    expect(
      isScheduleLocked(bootstrap, Date.parse('2026-03-10T12:59:59Z')),
    ).toBe(true);
    expect(
      isScheduleLocked(bootstrap, Date.parse('2026-03-10T13:00:00Z')),
    ).toBe(false);
  });
});
