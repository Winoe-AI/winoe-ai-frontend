import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockedInviteCandidate,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './RecruiterDashboardContent.testlib';

describe('RecruiterDashboardPage toast timer behavior', () => {
  beforeEach(() => {
    resetDashboardMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('auto-dismisses success toast after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockUseDashboardData.mockReturnValue(dashboardState({ simulations: [{ id: 'sim_3', title: 'Sim 3', role: 'Backend', createdAt: '2025-12-10T10:00:00Z' }] }));
    mockedInviteCandidate.mockResolvedValueOnce({ candidateSessionId: 'cs_3', token: 'tok_789', inviteUrl: 'http://localhost:3000/candidate/session/tok_789', outcome: 'created' });
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Invite candidate' }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Jamie');
    await user.type(screen.getByLabelText(/Candidate email/i), 'jamie@example.com');
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/Invite sent for Jamie/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(screen.queryByText(/Invite sent for Jamie/i)).not.toBeInTheDocument();
  });

  it('clears previous copy timeout when copying multiple times', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mockUseDashboardData.mockReturnValue(dashboardState({ simulations: [{ id: 'sim_4', title: 'Sim 4', role: 'Backend', createdAt: '2025-12-10T10:00:00Z' }] }));
    mockedInviteCandidate.mockResolvedValueOnce({ candidateSessionId: 'cs_4', token: 'tok_999', inviteUrl: 'http://localhost:3000/candidate/session/tok_999', outcome: 'created' });
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Invite candidate' }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Chris');
    await user.type(screen.getByLabelText(/Candidate email/i), 'chris@example.com');
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    await user.click(await screen.findByRole('button', { name: /Copy invite link/i }));
    act(() => {
      jest.advanceTimersByTime(1900);
    });
    await user.click(screen.getByRole('button', { name: /Copy invite link/i }));
    expect(writeText).toHaveBeenCalledTimes(2);
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    expect(screen.getByRole('button', { name: /Copy invite link/i })).toBeInTheDocument();
  });
});
