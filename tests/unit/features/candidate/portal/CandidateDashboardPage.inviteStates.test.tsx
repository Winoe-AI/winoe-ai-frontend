import { screen } from '@testing-library/react';
import {
  makeInvite,
  renderDashboardInvite,
  setupDashboardExtraTest,
} from './CandidateDashboardPage.extra.testlib';

const mockNowMs = Date.parse('2025-01-15T12:00:00Z');

jest.mock('@/shared/time/now', () => ({
  resolveNowMs: () => mockNowMs,
}));

type StateCase = {
  name: string;
  invite: ReturnType<typeof makeInvite>;
  statusLabel: string;
  currentDayLabel: string;
  actionLabel: string;
  disabled: boolean;
  visibleNotes?: RegExp[];
};

const stateCases: StateCase[] = [
  {
    name: 'invited',
    invite: makeInvite({ status: 'not_started', progress: null }),
    statusLabel: 'Invited',
    currentDayLabel: 'Day 1 of 5',
    actionLabel: 'Start trial',
    disabled: false,
  },
  {
    name: 'awaiting start date',
    invite: makeInvite({
      status: 'in_progress',
      scheduledStartAt: '2025-01-16T00:00:00Z',
      dayWindows: null,
    }),
    statusLabel: 'Awaiting start date',
    currentDayLabel: 'Day 1 of 5',
    actionLabel: 'Continue trial',
    disabled: false,
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
    statusLabel: 'Scheduled',
    currentDayLabel: 'Day 1 of 5',
    actionLabel: 'Continue trial',
    disabled: false,
  },
  {
    name: 'day open',
    invite: makeInvite({
      status: 'in_progress',
      progress: { completed: 1, total: 5 },
    }),
    statusLabel: 'Day 2 open',
    currentDayLabel: 'Day 2 of 5',
    actionLabel: 'Continue trial',
    disabled: false,
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
    statusLabel: 'Day 3 closed',
    currentDayLabel: 'Day 3 of 5',
    actionLabel: 'Continue trial',
    disabled: false,
  },
  {
    name: 'complete',
    invite: makeInvite({
      status: 'completed',
      progress: { completed: 5, total: 5 },
      completedAt: '2025-01-15T10:00:00Z',
    }),
    statusLabel: 'Complete',
    currentDayLabel: 'Day 5 of 5',
    actionLabel: 'Review submissions',
    disabled: false,
  },
  {
    name: 'report ready',
    invite: makeInvite({
      status: 'completed',
      progress: { completed: 5, total: 5 },
      reportReady: true,
      hasReport: true,
    }),
    statusLabel: 'Report ready',
    currentDayLabel: 'Day 5 of 5',
    actionLabel: 'Review submissions',
    disabled: false,
  },
  {
    name: 'terminated',
    invite: makeInvite({
      status: 'in_progress',
      terminatedAt: '2025-01-15T11:00:00Z',
      isTerminated: true,
    }),
    statusLabel: 'Terminated',
    currentDayLabel: 'Day 5 of 5',
    actionLabel: 'Ended',
    disabled: true,
    visibleNotes: [/This trial has ended/i],
  },
  {
    name: 'expired',
    invite: makeInvite({
      status: 'expired',
      isExpired: true,
    }),
    statusLabel: 'Expired',
    currentDayLabel: 'Day 1 of 5',
    actionLabel: 'Expired',
    disabled: true,
    visibleNotes: [/This invite has expired/i],
  },
];

describe('CandidateDashboardPage invite-specific states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = setupDashboardExtraTest();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it.each(stateCases)(
    'renders the $name candidate portal state',
    async ({
      invite,
      statusLabel,
      currentDayLabel,
      actionLabel,
      disabled,
      visibleNotes,
    }) => {
      await renderDashboardInvite(invite);

      expect(screen.getByText(invite.title)).toBeInTheDocument();
      expect(screen.getByText(/Company pending/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(`Talent Partner: ${invite.talentPartnerName}`),
        ),
      ).toBeInTheDocument();
      expect(screen.getAllByText(statusLabel).length).toBeGreaterThan(0);
      expect(
        screen.getByText(`Current day: ${currentDayLabel}`),
      ).toBeInTheDocument();

      const button = screen.getByRole('button', { name: actionLabel });
      if (disabled) {
        expect(button).toBeDisabled();
      } else {
        expect(button).toBeEnabled();
      }

      for (const note of visibleNotes ?? []) {
        expect(screen.getByText(note)).toBeInTheDocument();
      }
    },
  );
});
