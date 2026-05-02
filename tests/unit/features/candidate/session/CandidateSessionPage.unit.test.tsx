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
      await screen.findByText(/This invite link is invalid/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toHaveAttribute('href', 'mailto:support@winoe.ai');
    expect(
      screen.queryByText(/Go to candidate portal/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument();
  });

  it('redirects to login on 401 bootstrap errors', async () => {
    mockUseCandidateSession.mockReturnValue(
      buildSession({ authStatus: 'unauthenticated' }),
    );
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

  it.each([400, 404])(
    'shows invalid invite guidance for status %s',
    async (status) => {
      mockUseCandidateSession.mockReturnValue(buildSession());
      mockResolveInvite.mockRejectedValueOnce({ status });

      render(<CandidateSessionPage token="invite-token" />);
      expect(
        await screen.findByText(/This invite link is invalid/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument();
    },
  );

  it('routes already-claimed invite errors into sign-in recovery guidance', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 409 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(
      await screen.findByText(/already been claimed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue to sign in/i }),
    ).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('shows expired invite state for 410', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 410 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(
      await screen.findByText(/This invite has expired/i),
    ).toBeInTheDocument();
  });

  it('shows error view for non-auth bootstrap failures', async () => {
    mockUseCandidateSession.mockReturnValue(buildSession());
    mockResolveInvite.mockRejectedValueOnce({ status: 500 });

    render(<CandidateSessionPage token="invite-token" />);
    expect(await screen.findByText('Unable to load trial')).toBeInTheDocument();
  });
});
