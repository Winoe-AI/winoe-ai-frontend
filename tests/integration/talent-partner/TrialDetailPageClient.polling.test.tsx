import {
  act,
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  waitFor,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - scenario polling', () => {
  it('polls while generating and stops after ready_for_review', async () => {
    jest.useFakeTimers();
    let detailCalls = 0;

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': () => {
        detailCalls += 1;
        if (detailCalls === 1)
          return jsonResponse({
            id: 'trial-1',
            status: 'generating',
            title: 'Trial trial-1',
            templateKey: 'python-fastapi',
            scenario: { id: 301, versionIndex: 1, status: 'generating' },
            scenarioJob: {
              jobId: 'job-1',
              status: 'running',
              pollAfterMs: 2000,
            },
            tasks: [],
          });
        return jsonResponse({
          id: 'trial-1',
          status: 'ready_for_review',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
          scenario: { id: 301, versionIndex: 1, status: 'ready' },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/backend/jobs/job-1': jsonResponse({
        jobId: 'job-1',
        jobType: 'scenario_generation',
        status: 'running',
        pollAfterMs: 2000,
        error: null,
      }),
    });

    renderPage();
    expect(
      await screen.findByText(/Scenario generation is in progress/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2200);
    });
    await waitFor(() => {
      expect(detailCalls).toBeGreaterThanOrEqual(2);
    });
    await waitFor(() => {
      expect(
        screen.queryByText(/Scenario generation is in progress/i),
      ).not.toBeInTheDocument();
    });

    const callsAtReady = detailCalls;
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
    expect(detailCalls).toBe(callsAtReady);
    jest.useRealTimers();
  });

  it('continues polling detail when job status request fails', async () => {
    jest.useFakeTimers();
    let detailCalls = 0;

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': () => {
        detailCalls += 1;
        if (detailCalls === 1)
          return jsonResponse({
            id: 'trial-1',
            status: 'generating',
            title: 'Trial trial-1',
            templateKey: 'python-fastapi',
            scenario: { id: 301, versionIndex: 1, status: 'generating' },
            scenarioJob: {
              jobId: 'job-1',
              status: 'running',
              pollAfterMs: 2000,
            },
            tasks: [],
          });
        return jsonResponse({
          id: 'trial-1',
          status: 'ready_for_review',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
          scenario: { id: 301, versionIndex: 1, status: 'ready' },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/backend/jobs/job-1': () => {
        throw new Error('job status failed');
      },
    });

    renderPage();
    expect(
      await screen.findByText(/Scenario generation is in progress/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2200);
    });
    await waitFor(() => {
      expect(detailCalls).toBeGreaterThanOrEqual(2);
    });

    expect(
      await screen.findByRole('button', {
        name: /Approve v1 \/ Start inviting/i,
      }),
    ).toBeInTheDocument();
    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).toContain('/api/backend/jobs/job-1');
    jest.useRealTimers();
  });
});
