import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  listCandidateInvitesMock,
  renderDashboardPage,
  resetDashboardPageMocks,
  setCandidateSessionState,
  useRouterMock,
} from './CandidateDashboardPage.testlib';

describe('CandidateDashboardPage navigation behavior', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = resetDashboardPageMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('navigates to invite session on continue click', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        title: 'Continue Sim',
        role: 'Developer',
        status: 'in_progress',
        isExpired: false,
        token: 'nav-token',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('Continue Sim')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(useRouterMock.push).toHaveBeenCalledWith(
      '/candidate/session/nav-token',
    );
  });

  it('routes completed invites to the completed review hub', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 2,
        title: 'Completed Sim',
        role: 'Developer',
        status: 'completed',
        isExpired: false,
        token: 'done-token',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('Completed Sim')).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Review submissions/i }),
    );
    expect(useRouterMock.push).toHaveBeenCalledWith(
      '/candidate/session/done-token/review',
    );
  });

  it('routes report-ready invites to the completed review hub', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 3,
        title: 'Report Ready Sim',
        role: 'Developer',
        status: 'completed',
        reportReady: true,
        hasReport: true,
        isExpired: false,
        token: 'report-token',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('Report Ready Sim')).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Review submissions/i }),
    );
    expect(useRouterMock.push).toHaveBeenCalledWith(
      '/candidate/session/report-token/review',
    );
  });

  it('uses fallback token when invite token is missing for same session', async () => {
    setCandidateSessionState({
      candidateSessionId: 999,
      inviteToken: 'fallback-token',
    });
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 999,
        title: 'Fallback Sim',
        role: 'Developer',
        status: 'in_progress',
        isExpired: false,
        token: null,
      },
    ]);
    await renderDashboardPage();
    const continueBtn = await screen.findByRole('button', {
      name: /Continue/i,
    });
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    expect(useRouterMock.push).toHaveBeenCalledWith(
      '/candidate/session/fallback-token',
    );
  });

  it('keeps continue disabled with no invite token and no matching fallback', async () => {
    setCandidateSessionState({
      candidateSessionId: 123,
      inviteToken: 'other-token',
    });
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 456,
        title: 'No Fallback Sim',
        role: 'Developer',
        status: 'in_progress',
        isExpired: false,
        token: null,
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('No Fallback Sim')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });
});
