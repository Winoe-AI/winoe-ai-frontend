import {
  RecruiterSimulationDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  simulationDetailResponse,
  simulationListResponse,
  textResponse,
  userEvent,
  waitFor,
  within,
} from './SimulationDetailContent.testlib';

describe('RecruiterSimulationDetailPage - resend invite success', () => {
  it('shows resend state and updates invite status after resending', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 99, inviteEmail: 'rate@example.com', candidateName: 'Retry Rex', status: 'not_started', startedAt: null, completedAt: null, hasReport: false, inviteEmailStatus: 'failed', inviteEmailSentAt: null, inviteEmailError: 'Email bounced' }]);
      if (url === '/api/simulations/1/candidates/99/invite/resend') {
        expect(init?.method).toBe('POST');
        return jsonResponse({ candidateSessionId: 99, inviteEmailStatus: 'sent', inviteEmailSentAt: '2025-12-24T00:00:00.000000Z', inviteEmailError: null });
      }
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    const row = await screen.findByTestId('candidate-row-99');
    await user.click(within(row).getByRole('button', { name: /resend invite/i }));
    await waitFor(() => {
      expect(screen.getByText(/Sent at/i)).toBeInTheDocument();
      expect(screen.queryByText(/Email bounced/i)).not.toBeInTheDocument();
    });
  });

  it('handles string candidateSessionId when resending invites', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: '42', inviteEmail: 'string@example.com', candidateName: 'String Id', status: 'not_started', startedAt: null, completedAt: null, hasReport: false, inviteEmailStatus: 'failed', inviteEmailSentAt: null }]);
      if (url === '/api/simulations/1/candidates/42/invite/resend') {
        expect(init?.method).toBe('POST');
        return jsonResponse({ candidateSessionId: '42', inviteEmailStatus: 'sent', inviteEmailSentAt: '2025-12-24T00:00:00.000000Z', inviteEmailError: null });
      }
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    expect(await screen.findByTestId('candidate-row-42')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /resend invite/i }));
    await waitFor(() => expect(screen.getByText(/Sent at/i)).toBeInTheDocument());
  });
});
