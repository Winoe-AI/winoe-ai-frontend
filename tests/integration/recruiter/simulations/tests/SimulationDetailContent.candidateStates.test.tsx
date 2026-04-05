import {
  RecruiterSimulationDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  simulationDetailResponse,
  textResponse,
  waitFor,
} from './SimulationDetailContent.testlib';

describe('RecruiterSimulationDetailPage - candidate state rendering', () => {
  it('renders empty state when there are no candidates', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations')
        return jsonResponse([
          { id: '1', title: 'Simulation 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });

    render(<RecruiterSimulationDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/No candidates yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeInTheDocument();
  });

  it('shows not started status, unnamed fallback, and text error fallback', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations')
        return jsonResponse([
          { id: '1', title: 'Simulation 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 9,
            inviteEmail: null,
            candidateName: null,
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('fallback error', 500);
    });

    render(<RecruiterSimulationDetailPage />);
    await waitFor(() =>
      expect(screen.getByText('Unnamed')).toBeInTheDocument(),
    );
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });
});
