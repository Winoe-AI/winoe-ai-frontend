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
  userEvent,
} from './TrialDetailContent.testlib';

describe('TalentPartnerTrialDetailPage - plan rendering', () => {
  it('renders tabbed Trial detail with Brief and Rubric content', async () => {
    const user = userEvent.setup();
    render(<TalentPartnerTrialDetailPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Brief' }));
    expect(
      await screen.findByRole('heading', { name: 'Project Brief', level: 3 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/MARKETPLACE_BRIEF_EXTRA/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rubric' }));
    expect(
      await screen.findByText(
        /Winoe will evaluate candidates against these dimensions/i,
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText(/Template/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tech stack/i)).not.toBeInTheDocument();
  });

  it('normalizes plan data from nested task objects', async () => {
    const user = userEvent.setup();
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
          activeScenarioVersionId: '7',
          scenario: {
            id: '7',
            versionIndex: 1,
            status: 'ready',
            storylineMd: 'Legacy storyline',
            projectBriefMd: 'Project brief summary from object.\n\nBody.',
            rubricJson: {},
            taskPromptsJson: [],
          },
          projectBriefMd: 'Project brief summary from object.\n\nBody.',
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

    await user.click(screen.getByRole('button', { name: 'Brief' }));
    expect(
      await screen.findByText(/Project brief summary from object/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rubric' }));
    expect(
      await screen.findByText(
        /Winoe will evaluate candidates against these dimensions/i,
      ),
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

  it('shows Activity tab empty state when no audit feed exists', async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole('button', { name: 'Activity' }));
    expect(
      await screen.findByText(/No Trial activity recorded yet/i),
    ).toBeInTheDocument();
  });
});
