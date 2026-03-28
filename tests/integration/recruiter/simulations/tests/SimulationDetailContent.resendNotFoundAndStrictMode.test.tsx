import {
  RecruiterSimulationDetailPage,
  React,
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

describe('RecruiterSimulationDetailPage - resend not found and strict mode', () => {
  it('shows friendly not found error and refreshes on 404 resend', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);
        if (url === '/api/simulations') return simulationListResponse();
        if (url === '/api/simulations/1') return simulationDetailResponse();
        if (url === '/api/simulations/1/candidates')
          return jsonResponse([
            {
              candidateSessionId: 88,
              inviteEmail: 'gone@example.com',
              candidateName: 'Missing',
              status: 'not_started',
              startedAt: null,
              completedAt: null,
              hasReport: false,
              inviteEmailStatus: 'failed',
              inviteEmailSentAt: null,
            },
          ]);
        if (url === '/api/simulations/1/candidates/88/invite/resend') {
          expect(init?.method).toBe('POST');
          return jsonResponse({ message: 'not found' }, 404);
        }
        return textResponse('Not found', 404);
      },
    );
    render(<RecruiterSimulationDetailPage />);
    await user.click(
      await screen.findByRole('button', { name: /resend invite/i }),
    );
    await waitFor(
      () =>
        expect(
          screen.getByText('Candidate not found — refreshing list.'),
        ).toBeInTheDocument(),
      { timeout: 8000 },
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/simulations/1/candidates',
        expect.anything(),
      ),
    );
  });

  it('does not get stuck loading under StrictMode navigation', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 2,
            inviteEmail: 'strict@example.com',
            candidateName: 'Strict Mode',
            status: 'in_progress',
            startedAt: '2025-12-23T18:57:00.000000Z',
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('Not found', 404);
    });
    render(
      <React.StrictMode>
        <RecruiterSimulationDetailPage />
      </React.StrictMode>,
    );
    expect(await screen.findByText('Strict Mode')).toBeInTheDocument();
  });
});
