import { render, screen, waitFor } from '@testing-library/react';
import {
  buildSession,
  mockResolveInvite,
  mockUseCandidateSession,
  resetCandidateSessionUnitMocks,
  routerMock,
} from './CandidateSessionPage.unit.testlib';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';

describe('CandidateSessionPage unit flow', () => {
  beforeEach(() => {
    resetCandidateSessionUnitMocks();
  });

  it('shows error when invite token is missing', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    render(<CandidateSessionPage token="" />);

    expect(
      await screen.findByText(/Invite link unavailable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Go to Home/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument();
  });

  it('redirects to login on 401 bootstrap errors', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 401 });

    render(<CandidateSessionPage token="invite-token" />);
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?'),
      ),
    );
  });

  it('handles 403 errors by showing access denied view', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 403 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it.each([400, 404, 409])(
    'shows invite-unavailable guidance for status %s',
    async (status) => {
      mockUseCandidateSession.mockReturnValue(buildSession());
      mockResolveInvite.mockRejectedValueOnce({ status });

      render(<CandidateSessionPage token="invite-token" />);
      expect(
        await screen.findByText(/Invite link unavailable/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Go to Home/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument();
    },
  );

  it('shows expired invite state for 410', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 410 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(await screen.findByText(/Invite expired/i)).toBeInTheDocument();
  });

  it('shows error view for non-auth bootstrap failures', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 500 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(await screen.findByText('Unable to load trial')).toBeInTheDocument();
  });
});
