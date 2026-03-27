import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  within,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - compare states', () => {
  it('renders compare candidates rows with fit profile actions', async () => {
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
          candidateSessionId: '11',
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
        },
        {
          candidateSessionId: '22',
          inviteEmail: 'b@example.com',
          candidateName: 'Blake',
          status: 'completed',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: '2025-01-02T00:00:00Z',
          hasReport: true,
        },
      ]),
      '/api/simulations/sim-1/candidates/compare': jsonResponse([
        {
          candidateSessionId: '11',
          candidate: { name: 'Alex', email: 'a@example.com' },
          status: 'in_progress',
          fitProfileStatus: 'not_generated',
          overallFitScore: null,
          recommendation: null,
          keyStrengths: ['Clear communication'],
          keyRisks: ['Needs more tests'],
        },
        {
          candidateSessionId: '22',
          candidate: { name: 'Blake', email: 'b@example.com' },
          status: 'completed',
          fitProfileStatus: 'ready',
          overallFitScore: 0.84,
          recommendation: 'hire',
          keyStrengths: ['Fast delivery'],
          keyRisks: [],
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText('Compare candidates')).toBeInTheDocument();
    expect(
      await screen.findByTestId('candidate-compare-row-11'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('candidate-compare-row-22'),
    ).toBeInTheDocument();

    const row11 = screen.getByTestId('candidate-compare-row-11');
    expect(
      within(row11).getByRole('button', { name: /Generate Fit Profile/i }),
    ).toBeEnabled();
    expect(
      within(row11).getByRole('link', { name: /View Submissions/i }),
    ).toHaveAttribute('href', '/dashboard/simulations/sim-1/candidates/11');
    expect(
      within(row11).getByRole('link', { name: /View Fit Profile/i }),
    ).toHaveAttribute(
      'href',
      '/dashboard/simulations/sim-1/candidates/11/fit-profile',
    );

    const row22 = screen.getByTestId('candidate-compare-row-22');
    expect(within(row22).getByText('84%')).toBeInTheDocument();
    expect(within(row22).getByText('Hire')).toBeInTheDocument();
  });

  it('shows recruiter-scoped compare denial on compare 403 responses', async () => {
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
          candidateSessionId: '11',
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
        },
      ]),
      '/api/simulations/sim-1/candidates/compare': jsonResponse(
        { message: 'Forbidden' },
        403,
      ),
    });

    renderPage();

    expect(await screen.findByText('Compare candidates')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'You are not authorized to compare candidates for this simulation.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });

  it('shows compare unavailable card on compare 404 responses', async () => {
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
          candidateSessionId: '11',
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
        },
      ]),
      '/api/simulations/sim-1/candidates/compare': jsonResponse(
        { message: 'Not found' },
        404,
      ),
    });

    renderPage();

    expect(await screen.findByText('Compare candidates')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Compare candidates unavailable for this simulation right now.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(
      screen.queryByTestId('candidate-compare-row-11'),
    ).not.toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });
});
