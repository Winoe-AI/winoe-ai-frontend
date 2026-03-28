import { screen, waitFor } from '@testing-library/react';
import {
  listCandidateInvitesMock,
  renderDashboardPage,
  resetDashboardPageMocks,
} from './CandidateDashboardPage.testlib';

describe('CandidateDashboardPage invite-specific states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = resetDashboardPageMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders expired invite warning and disables continue', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        title: 'Expired Simulation',
        role: 'Developer',
        status: 'in_progress',
        isExpired: true,
        token: 'expired-token',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('Expired Simulation')).toBeInTheDocument();
    });
    expect(screen.getByText(/This invite has expired/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('shows unavailable-link warning when token is missing', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 2,
        title: 'No Token Sim',
        role: 'Developer',
        status: 'in_progress',
        isExpired: false,
        token: null,
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText(/Invite link unavailable/)).toBeInTheDocument();
    });
  });

  it('shows start button label for not-started invites', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 3,
        title: 'New Sim',
        role: 'Developer',
        status: 'not_started',
        isExpired: false,
        token: 'start-token',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Start simulation/i }),
      ).toBeInTheDocument();
    });
  });
});
