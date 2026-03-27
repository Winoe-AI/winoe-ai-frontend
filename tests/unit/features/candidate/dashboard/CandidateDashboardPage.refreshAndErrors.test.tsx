import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  listCandidateInvitesMock,
  renderDashboardPage,
  resetDashboardPageMocks,
  useRouterMock,
} from './CandidateDashboardPage.testlib';

describe('CandidateDashboardPage refresh and error handling', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = resetDashboardPageMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows API error message on fetch failure', async () => {
    listCandidateInvitesMock.mockRejectedValue(new Error('Network error'));
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('refresh button reloads invite list', async () => {
    listCandidateInvitesMock.mockResolvedValue([]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText(/No invites yet/)).toBeInTheDocument();
    });
    listCandidateInvitesMock.mockClear();
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 2,
        title: 'New Sim',
        role: 'Engineer',
        status: 'not_started',
        isExpired: false,
        token: 'new-token',
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => {
      expect(screen.getByText('New Sim')).toBeInTheDocument();
    });
  });

  it('redirects to login when invite fetch is unauthorized', async () => {
    listCandidateInvitesMock.mockRejectedValue({ status: 401 });
    await renderDashboardPage();
    await waitFor(() => {
      expect(useRouterMock.replace).toHaveBeenCalled();
    });
  });
});
