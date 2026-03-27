import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - compare retry', () => {
  it('retries compare after generic errors and refetches rows', async () => {
    const user = userEvent.setup();
    let compareCalls = 0;

    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        { candidateSessionId: '11', inviteEmail: 'a@example.com', candidateName: 'Alex', status: 'completed', startedAt: '2025-01-01T00:00:00Z', completedAt: '2025-01-01T01:00:00Z', hasReport: true },
      ]),
      '/api/simulations/sim-1/candidates/compare': () => {
        compareCalls += 1;
        if (compareCalls === 1) return jsonResponse({}, 500);
        return jsonResponse([
          { candidateSessionId: '11', candidate: { name: 'Alex', email: 'a@example.com' }, status: 'completed', fitProfileStatus: 'ready', overallFitScore: 0.81, recommendation: 'hire', keyStrengths: ['Strong ownership'], keyRisks: [] },
        ]);
      },
    });

    renderPage();

    expect(await screen.findByText('Compare candidates')).toBeInTheDocument();
    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument();
    expect(compareCalls).toBe(1);

    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(await screen.findByTestId('candidate-compare-row-11')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
    expect(compareCalls).toBe(2);
  });
});
