import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockedInviteCandidate,
  mockedListTrialCandidates,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './TalentPartnerDashboardContent.testlib';

describe('TalentPartnerDashboardPage invite flow', () => {
  beforeEach(() => {
    resetDashboardMocks();
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [
          {
            id: 'sim_1',
            title: 'Sim 1',
            role: 'Backend',
            createdAt: '2025-12-10T10:00:00Z',
          },
        ],
      }),
    );
  });

  it('does not pre-check invited emails when opening modal', async () => {
    const user = userEvent.setup();
    mockedInviteCandidate.mockResolvedValueOnce({
      candidateSessionId: 'cs_1',
      token: 'tok_123',
      inviteUrl: 'http://localhost:3000/candidate/session/tok_123',
      outcome: 'created',
    });
    renderDashboard();
    await user.click(
      await screen.findByRole('button', { name: 'Invite candidate' }),
    );
    await waitFor(() =>
      expect(mockedListTrialCandidates).not.toHaveBeenCalled(),
    );
    await user.type(screen.getByLabelText(/Candidate name/i), 'Jane Doe');
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'jane@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    await waitFor(() =>
      expect(mockedListTrialCandidates).not.toHaveBeenCalled(),
    );
    await waitFor(() => expect(mockedInviteCandidate).toHaveBeenCalledTimes(1));
  });

  it('invites candidate and shows created/resent messaging', async () => {
    const user = userEvent.setup();
    mockedInviteCandidate.mockResolvedValueOnce({
      candidateSessionId: 'cs_1',
      token: 'tok_123',
      inviteUrl: 'http://localhost:3000/candidate/session/tok_123',
      outcome: 'created',
    });
    renderDashboard();
    await user.click(
      await screen.findByRole('button', { name: 'Invite candidate' }),
    );
    await user.type(screen.getByLabelText(/Candidate name/i), 'Jane Doe');
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'jane@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(
      await screen.findByText('Invite sent for Jane Doe (jane@example.com).'),
    ).toBeInTheDocument();
    expect(mockedInviteCandidate).toHaveBeenCalledWith(
      'sim_1',
      'Jane Doe',
      'jane@example.com',
    );

    mockedInviteCandidate.mockResolvedValueOnce({
      candidateSessionId: 'cs_2',
      token: 'tok_456',
      inviteUrl: 'http://localhost:3000/candidate/session/tok_456',
      outcome: 'resent',
    });
    await user.click(
      await screen.findByRole('button', { name: 'Invite candidate' }),
    );
    await user.clear(screen.getByLabelText(/Candidate name/i));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Alex');
    await user.clear(screen.getByLabelText(/Candidate email/i));
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'alex@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(
      await screen.findByText(/Invite resent for Alex/i),
    ).toBeInTheDocument();
  });

  it('shows invite error when backend fails', async () => {
    mockedInviteCandidate.mockRejectedValueOnce({ message: 'Invite failed' });
    renderDashboard();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Invite candidate' }),
    );
    fireEvent.change(screen.getByLabelText(/Candidate name/i), {
      target: { value: 'Joe' },
    });
    fireEvent.change(screen.getByLabelText(/Candidate email/i), {
      target: { value: 'joe@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send invite/i }));
    await waitFor(() => expect(mockedInviteCandidate).toHaveBeenCalled());
    expect(screen.getAllByText(/Invite failed/).length).toBeGreaterThanOrEqual(
      1,
    );
  });
});
