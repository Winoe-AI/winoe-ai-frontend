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
        'Unable to load trial',
      ),
    );
    expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    expect(
      screen.queryByText('This invite link is invalid'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('This invite has expired'),
    ).not.toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    resolveInviteMock.mockResolvedValue({
      candidateSessionId: 99,
      status: 'in_progress',
      trial: { title: 'Sim', role: 'Role' },
    });
    fireEvent.click(retryButton);
    await waitFor(() => expect(resolveInviteMock).toHaveBeenCalledTimes(2));
  });

  it('handles 400 status as invalid invite', async () => {
    resolveInviteMock.mockRejectedValue({ status: 400 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite link is invalid',
      ),
    );
    expect(
      screen.getByRole('button', { name: /Email support/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Go to candidate portal/i }),
    ).not.toBeInTheDocument();
  });

  it('shows invalid invite guidance for malformed token validation errors', async () => {
    resolveInviteMock.mockRejectedValue({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: {
        code: 'VALIDATION_ERROR',
        detail: [
          {
            type: 'string_too_short',
            loc: ['path', 'token'],
            msg: 'String should have at least 1 character',
            input: 'not-a-real-token',
          },
        ],
      },
    });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite link is invalid',
      ),
    );
    expect(screen.getByTestId('state-message')).toHaveTextContent(
      'Open the latest invite email, or contact Winoe AI support for help.',
    );
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toHaveAttribute('href', 'mailto:support@winoe.ai');
    expect(
      screen.queryByRole('button', { name: /Retry/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Unable to load trial')).not.toBeInTheDocument();
  });

  it('treats a bare 410 as an expired invite', async () => {
    resolveInviteMock.mockRejectedValue({ status: 410 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite has expired',
      ),
    );
    expect(
      screen.queryByRole('button', { name: /Email support/i }),
    ).not.toBeInTheDocument();
  });

  it('handles terminated Trial responses distinctly', async () => {
    resolveInviteMock.mockRejectedValue({
      status: 410,
      details: { trialStatus: 'terminated' },
    });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This Trial is no longer available.',
      ),
    );
    expect(
      screen.getByRole('button', { name: /Go to candidate portal/i }),
    ).toBeInTheDocument();
  });

  it('handles 409 status as already claimed invite guidance', async () => {
    resolveInviteMock.mockRejectedValue({ status: 409 });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('state-message')).toHaveTextContent(
        'This invite has already been claimed',
      ),
    );
    expect(screen.getByTestId('state-message')).toHaveTextContent(
      'Sign in with the same email address to continue your existing Trial.',
    );
    expect(
      screen.getByRole('button', { name: /Continue to sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders invalid invite guidance for invite-specific 401 responses', async () => {
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
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toHaveAttribute('href', 'mailto:support@winoe.ai');
    expect(
      screen.queryByRole('button', { name: /Continue to sign in/i }),
    ).not.toBeInTheDocument();
  });
});
