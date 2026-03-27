import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateSessionPage,
  buildState,
  primeErrorApiMocks,
  resolveInviteMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.error.testlib';

describe('CandidateSessionPage error states - invite error variants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeErrorApiMocks();
  });

  it('shows access denied view when resolve fails with 403', async () => {
    resolveInviteMock.mockRejectedValue({ status: 403 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Access denied',
      ),
    );
  });

  it('shows generic error with retry action for non-invite errors', async () => {
    resolveInviteMock.mockRejectedValue({
      status: 500,
      message: 'Server error',
    });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Unable to load simulation',
      ),
    );
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    resolveInviteMock.mockResolvedValue({
      candidateSessionId: 99,
      status: 'in_progress',
      simulation: { title: 'Sim', role: 'Role' },
    });
    fireEvent.click(retryButton);
    await waitFor(() => expect(resolveInviteMock).toHaveBeenCalledTimes(2));
  });

  it('handles 400 status as invite unavailable', async () => {
    resolveInviteMock.mockRejectedValue({ status: 400 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Invite link unavailable',
      ),
    );
  });

  it('handles 409 status as invite unavailable', async () => {
    resolveInviteMock.mockRejectedValue({ status: 409 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'Invite link unavailable',
      ),
    );
  });
});
