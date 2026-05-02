import {
  TalentPartnerTrialDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  trialDetailResponse,
  trialListResponse,
  textResponse,
} from './TrialDetailContent.testlib';

describe('TalentPartnerTrialDetailPage - plan rendering', () => {
  it('renders the generated trial plan with tasks and repo status', async () => {
    render(<TalentPartnerTrialDetailPage />);
    expect(
      await screen.findByRole('heading', { name: 'Project Brief' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
    expect(
      await screen.findByText(/Project brief narrative/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Build a billing service/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Preferred language\/framework/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Python + FastAPI')).toBeInTheDocument();
    expect(await screen.findByText(/Rubric summary/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Assess API correctness, clarity/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Project brief narrative/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Clarity')).toBeInTheDocument();
    expect(
      await screen.findByText(/^Planning and Design Doc$/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Implementation Kickoff$/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Implementation Wrap-Up$/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/^Handoff \+ Demo$/i)).toBeInTheDocument();
    expect(await screen.findByText(/^Reflection Essay$/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/^Implementation Kickoff workspace$/i),
    ).toBeInTheDocument();
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
    expect(
      (await screen.findAllByText(/Not generated yet/i)).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/Template/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tech stack/i)).not.toBeInTheDocument();
  });

  it('normalizes plan data from nested task objects', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1')
        return jsonResponse({
          id: '1',
          title: 'Trial 1',
          template_key: 'node-express-ts',
          templateKey: 'node-express-ts',
          role_name: 'Backend Engineer',
          tech_stack: ['Node', 'TypeScript'],
          techStack: ['Node', 'TypeScript'],
          stack_name: 'Node + TypeScript',
          preferred_language_framework: 'Rust + Axum',
          focus_area: ['Performance', 'Reliability'],
          scenario: { summary: 'Project brief summary from object.' },
          tasks: {
            day_1: {
              title: 'Discovery',
              description: 'Review the project brief.',
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
      if (url === '/api/trials/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    expect(
      await screen.findByText(/Project brief summary from object/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Preferred language\/framework/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Rust + Axum')).toBeInTheDocument();
    expect(
      await screen.findByText('Performance, Reliability'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Review the project brief\.$/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Clear and concise notes/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Implementation Kickoff workspace$/i),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Repo provisioned/i)).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/Repo not provisioned yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('node-express-ts')).toBeNull();
    expect(screen.queryByText('Node + TypeScript')).toBeNull();
    expect(screen.queryByText('Node, TypeScript')).toBeNull();
  });

  it('shows report ready indicator when a report exists', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
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
    render(<TalentPartnerTrialDetailPage />);
    expect(await screen.findByText('Report ready')).toBeInTheDocument();
  });

  it('uses neutral copy when provisioning status is unknown', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1')
        return jsonResponse({
          id: '1',
          title: 'Trial 1',
          templateKey: 'python-fastapi',
          role: 'Backend Engineer',
          techStack: 'Python + FastAPI',
          preferredLanguageFramework: 'Python + FastAPI',
          tasks: [
            {
              dayIndex: 2,
              title: 'Implementation',
              description: 'Build the payments endpoint.',
              repoUrl: 'https://github.com/acme/template',
            },
          ],
        });
      if (url === '/api/trials/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
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
