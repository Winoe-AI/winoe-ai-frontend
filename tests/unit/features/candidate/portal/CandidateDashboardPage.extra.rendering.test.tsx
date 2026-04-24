import { screen } from '@testing-library/react';
import {
  makeInvite,
  renderDashboardInvite,
  setupDashboardExtraTest,
} from './CandidateDashboardPage.extra.testlib';

describe('CandidateDashboardPage extra rendering coverage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = setupDashboardExtraTest();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders invites without company metadata', async () => {
    await renderDashboardInvite(
      makeInvite({ title: 'No Company Sim', company: null }),
    );
    expect(screen.getByText(/Company pending/i)).toBeInTheDocument();
  });

  it.each([
    [{ progress: null }, /Progress:/],
    [{ progress: { completed: 0, total: 0 } }, /Progress:/],
    [{ lastActivityAt: 'invalid-date' }, /Last active:/],
    [{ lastActivityAt: null }, /Last active:/],
    [{ expiresAt: 'not-a-date' }, /Expires:/],
    [{ expiresAt: null }, /Expires:/],
  ])(
    'omits derived UI for invalid invite data %#',
    async (overrides, hiddenText) => {
      await renderDashboardInvite(makeInvite(overrides));
      expect(screen.queryByText(hiddenText)).not.toBeInTheDocument();
    },
  );

  it('renders current day and active status text', async () => {
    await renderDashboardInvite(
      makeInvite({
        title: 'Status Test',
        status: 'in_progress',
        progress: { completed: 1, total: 5 },
      }),
    );
    expect(screen.getByText('Day 2 open')).toBeInTheDocument();
    expect(screen.getByText(/Current day: Day 2 of 5/i)).toBeInTheDocument();
  });

  it('normalizes legacy ten-unit progress to the five-day model', async () => {
    await renderDashboardInvite(
      makeInvite({
        title: 'Legacy Progress Sim',
        status: 'in_progress',
        progress: { completed: 10, total: 10 },
      }),
    );
    expect(screen.getByText(/Progress: 5\/5/)).toBeInTheDocument();
  });

  it('pins partial legacy progress to the five-day model', async () => {
    await renderDashboardInvite(
      makeInvite({
        title: 'Partial Legacy Progress Sim',
        status: 'in_progress',
        progress: { completed: 5, total: 10 },
      }),
    );
    expect(screen.getByText(/Progress: 5\/5/)).toBeInTheDocument();
  });

  it('shows terminated state as non-active', async () => {
    await renderDashboardInvite(
      makeInvite({
        title: 'Terminated Sim',
        status: 'in_progress',
        isTerminated: true,
        terminatedAt: '2025-01-01T00:00:00Z',
      }),
    );
    expect(screen.getByText('Terminated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ended/i })).toBeDisabled();
    expect(screen.getByText(/This trial has ended/i)).toBeInTheDocument();
  });
});
