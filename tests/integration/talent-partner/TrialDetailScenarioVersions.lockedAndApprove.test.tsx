import {
  buildDetail,
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
} from './TrialDetailScenarioVersions.testlib';

describe('TrialDetail scenario versions - lock banner and approve', () => {
  it('renders SCENARIO_LOCKED as a non-blocking banner', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/backend/trials/trial-1/scenario/10': jsonResponse(
        { detail: 'Scenario version is locked.', errorCode: 'SCENARIO_LOCKED' },
        409,
      ),
    });
    renderPage();
    const storylineArea = (await screen.findByDisplayValue(
      'Story v1',
    )) as HTMLTextAreaElement;
    await user.clear(storylineArea);
    await user.type(storylineArea, 'Try save on now-locked version');
    await user.click(
      await screen.findByRole('button', { name: /Save edits/i }),
    );
    expect(
      (
        await screen.findAllByText(
          /This version is locked because invites exist\./i,
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findByRole('button', { name: /Save edits/i })).hasAttribute(
        'disabled',
      ),
    ).toBe(true);
  });

  it('approves only the selected version id', async () => {
    const user = userEvent.setup();
    let detailCalls = 0;
    mockFetchHandlers({
      '/api/trials/trial-1': () => {
        detailCalls += 1;
        if (detailCalls === 1)
          return jsonResponse(
            buildDetail({
              status: 'ready_for_review',
              activeScenarioVersionId: 11,
              pendingScenarioVersionId: null,
              scenario: {
                id: 11,
                versionIndex: 2,
                status: 'ready',
                lockedAt: null,
                storylineMd: 'Story v2',
                taskPromptsJson: [
                  {
                    dayIndex: 1,
                    title: 'Day 1 task',
                    description: 'Implement day one API endpoint.',
                  },
                ],
                rubricJson: { dayWeights: { '1': 100 }, dimensions: [] },
              },
              scenarioVersions: [
                {
                  id: 10,
                  versionIndex: 1,
                  status: 'locked',
                  lockedAt: '2026-03-01T12:00:00.000Z',
                },
                { id: 11, versionIndex: 2, status: 'ready', lockedAt: null },
              ],
            }),
          );
        return jsonResponse(
          buildDetail({
            status: 'active_inviting',
            activeScenarioVersionId: 11,
            pendingScenarioVersionId: null,
            scenario: {
              id: 11,
              versionIndex: 2,
              status: 'ready',
              lockedAt: null,
              storylineMd: 'Story v2',
            },
            scenarioVersions: [
              {
                id: 10,
                versionIndex: 1,
                status: 'locked',
                lockedAt: '2026-03-01T12:00:00.000Z',
              },
              { id: 11, versionIndex: 2, status: 'ready', lockedAt: null },
            ],
          }),
        );
      },
      '/api/backend/trials/trial-1/scenario/11/approve': jsonResponse({
        trialId: 'trial-1',
        status: 'active_inviting',
        activeScenarioVersionId: 11,
        pendingScenarioVersionId: null,
      }),
    });
    renderPage();
    await user.click(
      await screen.findByRole('button', {
        name: /Approve v2 \/ Start inviting/i,
      }),
    );
    await waitFor(() => {
      const approveCalls = fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) === '/api/backend/trials/trial-1/scenario/11/approve',
      );
      expect(approveCalls.length).toBe(1);
    });
    const activateCalls = fetchMock.mock.calls.filter(
      (call) => getUrl(call[0]) === '/api/backend/trials/trial-1/activate',
    );
    expect(activateCalls.length).toBe(0);
  });
});
