import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - page states', () => {
  it('shows page-level not found state and skips candidates/actions on 404', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1': jsonResponse({ message: 'Not found' }, 404),
    });

    renderPage();

    expect(await screen.findByText(/Simulation not found/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Invite candidate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve .* \/ Start inviting/i })).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/simulations/sim-1/candidates');
  });

  it('shows page-level access denied state and skips candidates/actions on 403', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1': jsonResponse({ message: 'Forbidden' }, 403),
    });

    renderPage();

    expect(await screen.findByText(/You don't have access to this simulation/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Invite candidate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve .* \/ Start inviting/i })).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/simulations/sim-1/candidates');
  });
});
