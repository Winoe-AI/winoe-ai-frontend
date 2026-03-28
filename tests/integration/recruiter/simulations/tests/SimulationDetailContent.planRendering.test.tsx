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
} from './SimulationDetailContent.testlib';

describe('RecruiterSimulationDetailPage - plan rendering', () => {
  it('renders the generated simulation plan with tasks and repo status', async () => {
    render(<RecruiterSimulationDetailPage />);
    expect(
      await screen.findByText(/5-day simulation plan/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
    expect(await screen.findByText('Python + FastAPI')).toBeInTheDocument();
    expect(
      await screen.findByText(/Build a billing service/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Kickoff')).toBeInTheDocument();
    expect(await screen.findByText('Clarity')).toBeInTheDocument();
    expect(await screen.findByText(/Day 2 workspace/i)).toBeInTheDocument();
    expect(await screen.findByText(/Repo provisioned/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Repo not provisioned yet/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/AI Evaluation: Disabled/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/AI Evaluation: Enabled/i).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText(/Day 4/i)).toBeInTheDocument();
    expect(await screen.findByText(/Day 5/i)).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Not generated yet/i)).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('normalizes plan data from nested task objects', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1')
        return jsonResponse({
          id: '1',
          title: 'Simulation 1',
          template_key: 'python-fastapi',
          role_name: 'Backend Engineer',
          tech_stack: ['Python', 'FastAPI'],
          focus_area: ['Performance', 'Reliability'],
          scenario: { summary: 'Scenario summary from object.' },
          tasks: {
            day_1: {
              title: 'Discovery',
              description: 'Review the requirements.',
              rubric: { summary: 'Clear and concise notes.' },
            },
            day_2: {
              day: '2',
              title: 'Build',
              description: 'Ship the API.',
              pre_provisioned: 'true',
              repo_url: 'https://github.com/acme/day2',
            },
            day_3: {
              day_index: '3',
              title: 'Debug',
              description: 'Fix regressions.',
              pre_provisioned: 'false',
            },
          },
        });
      if (url === '/api/simulations/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    expect(
      await screen.findByText(/Scenario summary from object/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Python, FastAPI')).toBeInTheDocument();
    expect(
      await screen.findByText('Performance, Reliability'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Discovery')).toBeInTheDocument();
    expect(
      await screen.findByText(/Clear and concise notes/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Day 2 workspace/i)).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Repo provisioned/i)).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/Repo not provisioned yet/i),
    ).toBeInTheDocument();
  });

  it('shows report ready indicator when a report exists', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 24,
            inviteEmail: 'ready@example.com',
            candidateName: 'Ready Report',
            status: 'completed',
            startedAt: '2025-12-23T10:00:00.000000Z',
            completedAt: '2025-12-23T12:00:00.000000Z',
            reportId: 'r1',
          },
        ]);
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    expect(await screen.findByText('Report ready')).toBeInTheDocument();
  });

  it('uses neutral copy when provisioning status is unknown', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1')
        return jsonResponse({
          id: '1',
          title: 'Simulation 1',
          templateKey: 'python-fastapi',
          role: 'Backend Engineer',
          techStack: 'Python + FastAPI',
          tasks: [
            {
              dayIndex: 2,
              title: 'Implementation',
              description: 'Build the payments endpoint.',
              repoUrl: 'https://github.com/acme/template',
            },
          ],
        });
      if (url === '/api/simulations/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });
    render(<RecruiterSimulationDetailPage />);
    expect(
      await screen.findByText(
        /Provisioning happens per-candidate after invite/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Repo provisioned/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Repo not provisioned yet/i),
    ).not.toBeInTheDocument();
    expect(await screen.findByText(/Repository link/i)).toBeInTheDocument();
  });
});
