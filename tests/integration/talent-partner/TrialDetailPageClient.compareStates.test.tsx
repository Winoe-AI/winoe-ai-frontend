import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  within,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - compare states', () => {
  it('renders same-Trial benchmark rows and excludes unrelated candidates', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([
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
      '/api/trials/trial-1/candidates/compare': jsonResponse([
        {
          candidateSessionId: '11',
          trialId: 'trial-1',
          candidate: { name: 'Alex', email: 'a@example.com' },
          status: 'in_progress',
          winoeReportStatus: 'ready',
          overallWinoeScore: 0.71,
          recommendation: 'lean_hire',
          keyStrengths: ['Clear communication'],
          keyRisks: ['Needs more tests'],
        },
        {
          candidateSessionId: '22',
          trialId: 'trial-1',
          candidate: { name: 'Blake', email: 'b@example.com' },
          status: 'evaluated',
          winoeReportStatus: 'ready',
          overallWinoeScore: 0.84,
          recommendation: 'strong_hire',
          keyStrengths: ['Fast delivery'],
          keyRisks: [],
        },
        {
          candidateSessionId: '44',
          trialId: 'trial-1',
          candidate: { name: 'Casey', email: 'c@example.com' },
          status: 'evaluated',
          winoeReportStatus: 'ready',
          overallWinoeScore: 0.76,
          recommendation: 'lean_hire',
          keyStrengths: ['Strong analysis'],
          keyRisks: ['Needs more context switching'],
        },
        {
          candidateSessionId: '33',
          trialId: 'trial-2',
          candidate: { name: 'Cross Trial', email: 'x@example.com' },
          status: 'evaluated',
          winoeReportStatus: 'ready',
          overallWinoeScore: 0.98,
          recommendation: 'strong_hire',
          keyStrengths: ['Should be filtered'],
          keyRisks: [],
        },
      ]),
    });

    renderPage();

    expect(
      await screen.findByTestId('candidate-compare-row-22', undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('candidate-compare-row-44', undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Benchmarks')).toBeInTheDocument();
    expect(
      screen.getByText('Comparing 2 candidates for this Trial'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Limited comparison — results are more meaningful with additional candidates.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Winoe surfaces evidence from each Trial. The Talent Partner makes the hiring decision.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('candidate-compare-row-22', undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('candidate-compare-row-44', undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('candidate-compare-row-11'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('candidate-compare-row-33'),
    ).not.toBeInTheDocument();

    const row22 = screen.getByTestId('candidate-compare-row-22');
    const row44 = screen.getByTestId('candidate-compare-row-44');
    expect(within(row22).getByText('84%')).toBeInTheDocument();
    expect(
      within(row22).getByText(
        'Evidence suggests strong alignment with this Trial.',
      ),
    ).toBeInTheDocument();
    expect(within(row44).getByText('76%')).toBeInTheDocument();
    expect(
      within(row44).getByText('Evidence shows meaningful strengths.'),
    ).toBeInTheDocument();
    expect(
      within(row44).getByText('Strength: Strong analysis'),
    ).toBeInTheDocument();
    expect(
      within(row44).getByRole('link', { name: /View Winoe Report/i }),
    ).toHaveAttribute(
      'href',
      '/dashboard/trials/trial-1/candidates/44/winoe-report',
    );
  });

  it('shows talent_partner-scoped compare denial on compare 403 responses', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([
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
      '/api/trials/trial-1/candidates/compare': jsonResponse(
        { message: 'Forbidden' },
        403,
      ),
    });

    renderPage();

    expect(await screen.findByText('Benchmarks')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'You are not authorized to view Benchmarks for this trial.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });

  it('shows compare unavailable card on compare 404 responses', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([
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
      '/api/trials/trial-1/candidates/compare': jsonResponse(
        { message: 'Not found' },
        404,
      ),
    });

    renderPage();

    expect(await screen.findByText('Benchmarks')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Benchmarks unavailable for this trial right now.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(
      screen.queryByTestId('candidate-compare-row-11'),
    ).not.toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });
});
