import { act, render, screen, waitFor } from '@testing-library/react';
import { HttpError } from '@/features/candidate/session/api';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  primeErrorApiMocks,
  resolveInviteMock,
  routerMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.error.testlib';

describe('CandidateSessionPage error states - auth and invite paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeErrorApiMocks();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
  });

  it('does not gate session initialization on missing access-token state', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: { ...state.state, token: null, authStatus: 'ready' },
    });
    render(<CandidateSessionPage token="inv" />);
    await waitFor(() => expect(resolveInviteMock).toHaveBeenCalled());
    expect(screen.queryByTestId('state-message')).not.toBeInTheDocument();
  });

  it('shows invite expired state when unauthenticated', async () => {
    resolveInviteMock.mockRejectedValue(new HttpError(410));
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: { ...state.state, authStatus: 'unauthenticated' },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite has expired',
      ),
    );
    expect(
      screen.getByRole('button', { name: /Go to candidate portal/i }),
    ).toBeInTheDocument();
  });

  it('shows invalid invite state with support CTA when authenticated', async () => {
    resolveInviteMock.mockRejectedValue(new HttpError(404));
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite link is invalid',
      ),
    );
    const supportLink = screen.getByRole('link', { name: /Email support/i });
    expect(supportLink).toHaveAttribute('href', 'mailto:support@winoe.ai');
    expect(
      screen.queryByRole('button', { name: /Go to candidate portal/i }),
    ).not.toBeInTheDocument();
  });

  it('does not redirect to dashboard for invite-specific 401 invalid token responses', async () => {
    resolveInviteMock.mockRejectedValue({
      status: 401,
      details: { code: 'INVITE_INVALID' },
    });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite link is invalid',
      ),
    );
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('routes 403 invite errors to access denied guidance', async () => {
    resolveInviteMock.mockRejectedValue(new HttpError(403, 'Forbidden'));
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Access denied',
      ),
    );
    expect(
      screen.getByText(/You do not have access to this invite/i),
    ).toBeInTheDocument();
  });

  it('redirects to login when resolve fails with 401', async () => {
    resolveInviteMock.mockRejectedValue({ status: 401 });
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...baseState().state,
          authStatus: 'unauthenticated',
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?'),
      ),
    );
  });
});
