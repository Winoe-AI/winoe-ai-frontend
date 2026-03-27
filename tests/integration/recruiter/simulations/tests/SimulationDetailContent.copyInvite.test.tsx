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
} from './SimulationDetailContent.testlib';

describe('RecruiterSimulationDetailPage - copy invite', () => {
  it('lets recruiters copy invite links from the table', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 42, inviteEmail: 'copy@example.com', candidateName: 'Copy Cat', status: 'not_started', startedAt: null, completedAt: null, hasReport: false, inviteUrl: 'https://example.com/invite/token-123', inviteEmailStatus: 'sent', inviteEmailSentAt: '2025-12-23T10:00:00.000000Z' }]);
      return textResponse('Not found', 404);
    });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn().mockResolvedValue(undefined) }, configurable: true });
    render(<RecruiterSimulationDetailPage />);
    const copyBtn = await screen.findByRole('button', { name: /copy invite link/i });
    await user.click(copyBtn);
    await waitFor(() => expect(copyBtn).toHaveTextContent(/copied/i));
  });

  it('shows copy invite button even when invite URL is missing and surfaces error', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 12, inviteEmail: 'nolink@example.com', candidateName: 'No Link', status: 'not_started', startedAt: null, completedAt: null, hasReport: false, inviteEmailStatus: 'sent', inviteEmailSentAt: '2025-12-23T10:00:00.000000Z', inviteUrl: null, inviteToken: null }]);
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    const copyBtn = await screen.findByRole('button', { name: /copy invite link/i });
    expect(copyBtn).toBeDisabled();
    expect(screen.getByText(/Invite link unavailable — resend invite or refresh/i)).toBeInTheDocument();
  });
});
