import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockedInviteCandidate,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './RecruiterDashboardContent.testlib';

describe('RecruiterDashboardPage toast copy and dismiss', () => {
  beforeEach(() => {
    resetDashboardMocks();
    jest.useFakeTimers();
    mockUseDashboardData.mockReturnValue(dashboardState({ simulations: [{ id: 'sim_1', title: 'Sim 1', role: 'Backend', createdAt: '2025-12-10T10:00:00Z' }] }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('copies invite link from toast and dismisses notification', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mockedInviteCandidate.mockResolvedValueOnce({ candidateSessionId: 'cs_1', token: 'tok_123', inviteUrl: 'http://localhost:3000/candidate/session/tok_123', outcome: 'created' });
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Invite candidate' }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/Candidate email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    await user.click(await screen.findByRole('button', { name: /Copy invite link/i }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/candidate/session/tok_123');
    expect(await screen.findByText(/Invite sent for Jane Doe/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Dismiss notification/i }));
    expect(screen.queryByText(/Invite sent for Jane Doe/i)).not.toBeInTheDocument();
  }, 15000);

  it('dismisses success toast and clears copied indicator', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mockedInviteCandidate.mockResolvedValueOnce({ candidateSessionId: 'cs_2', token: 'tok_456', inviteUrl: 'http://localhost:3000/candidate/session/tok_456', outcome: 'created' });
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Invite candidate' }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Alex');
    await user.type(screen.getByLabelText(/Candidate email/i), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    await user.click(await screen.findByRole('button', { name: /Copy invite link/i }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/candidate/session/tok_456');
    await user.click(screen.getByRole('button', { name: /Dismiss notification/i }));
    expect(screen.queryByText(/Invite sent for Alex/i)).not.toBeInTheDocument();
  });
});
