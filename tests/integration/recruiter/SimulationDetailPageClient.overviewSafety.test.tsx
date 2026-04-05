import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  params,
  renderPage,
  screen,
  waitFor,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - overview safety defaults', () => {
  it('does not fetch or render submission content on simulation overview', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 33,
          inviteEmail: 'c@example.com',
          candidateName: 'Casey',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
          contentText: 'secret submission',
          testResults: { passed: true },
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText('Casey')).toBeInTheDocument();
    expect(screen.queryByText(/secret submission/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\"passed\": true/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Text answer/i)).not.toBeInTheDocument();
    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls.some((url) => url.startsWith('/api/submissions'))).toBe(
      false,
    );
  });

  it('renders safe defaults when optional fields are missing', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    });
    renderPage();
    expect(await screen.findByText('Not verified')).toBeInTheDocument();
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('handles an empty candidates response without rendering candidate rows', async () => {
    params.id = 'sim-empty';
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-empty',
          title: 'Simulation sim-empty',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-empty/candidates': jsonResponse([]),
    });
    renderPage();
    await waitFor(() => {
      const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
      expect(calledUrls).toContain('/api/simulations/sim-empty/candidates');
    });
    expect(screen.queryByText('Casey')).not.toBeInTheDocument();
  });

  it('renders error message when the backend call fails', async () => {
    params.id = 'sim-err';
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-err',
          title: 'Simulation sim-err',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-err/candidates': jsonResponse(
        { message: 'Auth failed' },
        500,
      ),
    });
    renderPage();
    expect(await screen.findByText(/Auth failed/i)).toBeInTheDocument();
  });
});
