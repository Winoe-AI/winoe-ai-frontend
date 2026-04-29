import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - compare retry', () => {
  it('retries compare after generic errors and refetches rows', async () => {
    const user = userEvent.setup();
    let compareCalls = 0;

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
          status: 'completed',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: '2025-01-01T01:00:00Z',
          hasReport: true,
        },
      ]),
      '/api/trials/trial-1/candidates/compare': () => {
        compareCalls += 1;
        if (compareCalls === 1) return jsonResponse({}, 500);
        return jsonResponse([
          {
            candidateSessionId: '11',
            trialId: 'trial-1',
            candidate: { name: 'Alex', email: 'a@example.com' },
            status: 'completed',
            winoeReportStatus: 'ready',
            overallWinoeScore: 0.81,
            recommendation: 'strong_hire',
            keyStrengths: ['Strong ownership'],
            keyRisks: [],
          },
        ]);
      },
    });

    renderPage();

    expect(await screen.findByText('Benchmarks')).toBeInTheDocument();
    expect(
      await screen.findByText('Request failed with status 500'),
    ).toBeInTheDocument();
    expect(compareCalls).toBe(1);

    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(
      await screen.findByTestId('candidate-compare-row-11'),
    ).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
    expect(compareCalls).toBe(2);
  });
});
