import type { CandidateInvite } from '@/features/candidate/session/api';
import {
  deriveCandidateInviteState,
  filterCandidateInvitesForViewer,
  inviteMatchesSignedInEmail,
  normalizeCandidateInviteEmail,
  normalizeTrialProgress,
  isReviewRouteInvite,
} from '@/features/candidate/portal/utils/candidateInviteViewModel';

const FIXED_NOW_MS = Date.parse('2025-01-15T12:00:00Z');

const makeInvite = (
  overrides: Partial<CandidateInvite> = {},
): CandidateInvite =>
  ({
    candidateSessionId: 1,
    token: 'invite-token',
    title: 'Trial',
    role: 'Developer',
    company: 'Winoe',
    talentPartnerName: 'Taylor Partner',
    talentPartnerEmail: 'taylor.partner@winoe.ai',
    status: 'in_progress',
    progress: null,
    scheduledStartAt: null,
    candidateTimezone: null,
    dayWindows: null,
    currentDayWindow: null,
    scheduleLockedAt: null,
    completedAt: null,
    reportReady: null,
    hasReport: null,
    terminatedAt: null,
    isTerminated: false,
    expiresAt: null,
    lastActivityAt: null,
    isExpired: false,
    candidateEmail: 'candidate@example.com',
    inviteEmail: 'candidate@example.com',
    ...overrides,
  }) as CandidateInvite;

describe('candidateInviteViewModel', () => {
  it('normalizes legacy ten-unit progress into the five-day model', () => {
    expect(normalizeTrialProgress({ completed: 10, total: 10 })).toEqual({
      completed: 5,
      total: 5,
    });
  });

  it('pins partial legacy progress to the five-day model', () => {
    expect(normalizeTrialProgress({ completed: 5, total: 10 })).toEqual({
      completed: 5,
      total: 5,
    });
  });

  it('suppresses invalid zero progress totals', () => {
    expect(normalizeTrialProgress({ completed: 0, total: 0 })).toBeNull();
  });

  it('matches the signed-in email against canonical invite email fields', () => {
    const invite = makeInvite({
      candidateEmail: 'candidate@example.com',
      inviteEmail: 'candidate@example.com',
    });

    expect(inviteMatchesSignedInEmail(invite, 'candidate@example.com')).toBe(
      true,
    );
    expect(normalizeCandidateInviteEmail(invite)).toBe('candidate@example.com');
  });

  it('filters out invites that do not belong to the signed-in candidate', () => {
    const invites = [
      makeInvite({
        candidateSessionId: 1,
        title: 'My Trial',
        candidateEmail: 'candidate@example.com',
        inviteEmail: 'candidate@example.com',
      }),
      makeInvite({
        candidateSessionId: 2,
        title: 'Other Trial',
        candidateEmail: 'other@example.com',
        inviteEmail: 'other@example.com',
      }),
    ];

    expect(
      filterCandidateInvitesForViewer(invites, 'candidate@example.com'),
    ).toHaveLength(1);
    expect(
      filterCandidateInvitesForViewer(invites, 'candidate@example.com')[0]
        .title,
    ).toBe('My Trial');
  });

  it('keeps invites conservatively when email fields are missing', () => {
    const invite = makeInvite({
      candidateEmail: null,
      inviteEmail: null,
    });

    expect(inviteMatchesSignedInEmail(invite, 'candidate@example.com')).toBe(
      true,
    );
    expect(
      filterCandidateInvitesForViewer([invite], 'candidate@example.com'),
    ).toHaveLength(1);
  });

  it('does not filter candidate invites when the signed-in email is absent', () => {
    const invites = [
      makeInvite({
        candidateSessionId: 1,
        title: 'My Trial',
        candidateEmail: 'candidate@example.com',
        inviteEmail: 'candidate@example.com',
      }),
      makeInvite({
        candidateSessionId: 2,
        title: 'Other Trial',
        candidateEmail: 'other@example.com',
        inviteEmail: 'other@example.com',
      }),
    ];

    expect(filterCandidateInvitesForViewer(invites, null)).toHaveLength(2);
  });

  it('deduplicates repeated candidate session rows', () => {
    const invites = [
      makeInvite({
        candidateSessionId: 7,
        title: 'Duplicate Trial',
      }),
      makeInvite({
        candidateSessionId: 7,
        title: 'Duplicate Trial Copy',
      }),
    ];

    expect(filterCandidateInvitesForViewer(invites, null)).toHaveLength(1);
    expect(filterCandidateInvitesForViewer(invites, null)[0].title).toBe(
      'Duplicate Trial',
    );
  });

  it.each([
    {
      name: 'invited',
      invite: makeInvite({ status: 'not_started', progress: null }),
      expected: {
        state: 'invited',
        statusLabel: 'Invited',
        currentDayLabel: 'Day 1 of 5',
        actionLabel: 'Start trial',
        actionDisabled: false,
      },
    },
    {
      name: 'awaiting start date',
      invite: makeInvite({
        status: 'in_progress',
        scheduledStartAt: '2025-01-16T00:00:00Z',
        dayWindows: null,
      }),
      expected: {
        state: 'awaiting_start_date',
        statusLabel: 'Awaiting start date',
        currentDayLabel: 'Day 1 of 5',
        actionLabel: 'Continue trial',
        actionDisabled: false,
      },
    },
    {
      name: 'scheduled',
      invite: makeInvite({
        status: 'in_progress',
        scheduledStartAt: '2025-01-14T00:00:00Z',
        dayWindows: [
          {
            dayIndex: 1,
            windowStartAt: '2025-01-16T00:00:00Z',
            windowEndAt: '2025-01-16T23:59:59Z',
          },
        ],
      }),
      expected: {
        state: 'scheduled',
        statusLabel: 'Scheduled',
        currentDayLabel: 'Day 1 of 5',
        actionLabel: 'Continue trial',
        actionDisabled: false,
      },
    },
    {
      name: 'day open',
      invite: makeInvite({
        status: 'in_progress',
        progress: { completed: 1, total: 5 },
      }),
      expected: {
        state: 'day_open',
        statusLabel: 'Day 2 open',
        currentDayLabel: 'Day 2 of 5',
        actionLabel: 'Continue trial',
        actionDisabled: false,
      },
    },
    {
      name: 'day closed',
      invite: makeInvite({
        status: 'in_progress',
        currentDayWindow: {
          dayIndex: 3,
          windowStartAt: '2025-01-15T09:00:00Z',
          windowEndAt: '2025-01-15T17:00:00Z',
          state: 'closed',
        },
      }),
      expected: {
        state: 'day_closed',
        statusLabel: 'Day 3 closed',
        currentDayLabel: 'Day 3 of 5',
        actionLabel: 'Continue trial',
        actionDisabled: false,
      },
    },
    {
      name: 'complete',
      invite: makeInvite({
        status: 'completed',
        progress: { completed: 5, total: 5 },
        completedAt: '2025-01-15T10:00:00Z',
      }),
      expected: {
        state: 'complete',
        statusLabel: 'Complete',
        currentDayLabel: 'Day 5 of 5',
        actionLabel: 'Review submissions',
        actionDisabled: false,
      },
    },
    {
      name: 'report ready',
      invite: makeInvite({
        status: 'completed',
        progress: { completed: 5, total: 5 },
        reportReady: true,
        hasReport: true,
      }),
      expected: {
        state: 'report_ready',
        statusLabel: 'Report ready',
        currentDayLabel: 'Day 5 of 5',
        actionLabel: 'Review submissions',
        actionDisabled: false,
      },
    },
    {
      name: 'terminated',
      invite: makeInvite({
        status: 'in_progress',
        terminatedAt: '2025-01-15T11:00:00Z',
        isTerminated: true,
      }),
      expected: {
        state: 'terminated',
        statusLabel: 'Terminated',
        currentDayLabel: 'Day 5 of 5',
        actionLabel: 'Ended',
        actionDisabled: true,
      },
    },
    {
      name: 'expired',
      invite: makeInvite({
        status: 'expired',
        isExpired: true,
      }),
      expected: {
        state: 'expired',
        statusLabel: 'Expired',
        currentDayLabel: 'Day 1 of 5',
        actionLabel: 'Expired',
        actionDisabled: true,
      },
    },
  ])('derives the $name trial state', ({ invite, expected }) => {
    expect(deriveCandidateInviteState(invite, FIXED_NOW_MS)).toMatchObject(
      expected,
    );
  });

  it('treats completed and report-ready invites as review-routable, but not terminated ones', () => {
    expect(
      isReviewRouteInvite(
        makeInvite({
          status: 'completed',
          completedAt: '2025-01-15T10:00:00Z',
        }),
      ),
    ).toBe(true);
    expect(
      isReviewRouteInvite(
        makeInvite({
          status: 'completed',
          reportReady: true,
          hasReport: true,
        }),
      ),
    ).toBe(true);
    expect(
      isReviewRouteInvite(
        makeInvite({
          status: 'in_progress',
          terminatedAt: '2025-01-15T11:00:00Z',
          isTerminated: true,
        }),
      ),
    ).toBe(false);
  });
});
