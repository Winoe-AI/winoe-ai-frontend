import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
        'Invite expired',
      ),
    );
    expect(screen.queryByRole('button', { name: /Go to sign in/i })).toBeNull();
  });

  it('shows invite error with go home action when authenticated', async () => {
    resolveInviteMock.mockRejectedValue(new HttpError(404));
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Invite link unavailable',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /Go to Home/i }));
    expect(routerMock.push).toHaveBeenCalledWith('/');
  });

  it('redirects to login when resolve fails with 401', async () => {
    resolveInviteMock.mockRejectedValue({ status: 401 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?'),
      ),
    );
  });
});
