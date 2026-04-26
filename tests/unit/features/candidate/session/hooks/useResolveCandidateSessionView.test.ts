import { resolveCandidateSessionView } from '@/features/candidate/session/hooks/controller/useResolveCandidateSessionView';

describe('resolveCandidateSessionView', () => {
  const bootstrap = {
    scheduledStartAt: '2026-04-21T13:00:00Z',
    candidateTimezone: 'America/New_York',
    dayWindows: [
      {
        dayIndex: 1,
        windowStartAt: '2026-04-21T13:00:00Z',
        windowEndAt: '2026-04-21T21:00:00Z',
      },
      {
        dayIndex: 2,
        windowStartAt: '2026-04-22T13:00:00Z',
        windowEndAt: '2026-04-22T21:00:00Z',
      },
      {
        dayIndex: 3,
        windowStartAt: '2026-04-23T13:00:00Z',
        windowEndAt: '2026-04-23T21:00:00Z',
      },
    ],
    currentDayWindow: {
      dayIndex: 2,
      windowStartAt: '2026-04-22T13:00:00Z',
      windowEndAt: '2026-04-22T21:00:00Z',
      state: 'closed' as const,
    },
  };

  it('escapes the locked shell when current task data is already loaded', () => {
    const view = resolveCandidateSessionView({
      view: 'locked',
      hasTaskData: true,
      bootstrap,
      scheduleResponseWindowCount: 3,
      clockNowMs: Date.parse('2026-04-22T22:30:00Z'),
    });

    expect(view).toBe('running');
  });

  it('keeps the locked shell when no task data is available yet', () => {
    const view = resolveCandidateSessionView({
      view: 'locked',
      hasTaskData: false,
      bootstrap,
      scheduleResponseWindowCount: 3,
      clockNowMs: Date.parse('2026-04-22T22:30:00Z'),
    });

    expect(view).toBe('locked');
  });
});
