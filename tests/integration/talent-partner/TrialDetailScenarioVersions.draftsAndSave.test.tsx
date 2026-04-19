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
  within,
} from './TrialDetailScenarioVersions.testlib';

describe('TrialDetail scenario versions - drafts and save', () => {
  it('tracks editor dirty state and saves PATCH payload', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/trials/trial-1/scenario/10': jsonResponse({
        scenarioVersionId: 10,
        status: 'ready',
      }),
    });
    renderPage();
    const saveButton = await screen.findByRole('button', {
      name: /Save edits/i,
    });
    expect(saveButton).toBeDisabled();
    const storylineArea = (await screen.findByDisplayValue(
      'Story v1',
    )) as HTMLTextAreaElement;
    await user.clear(storylineArea);
    await user.type(storylineArea, 'Updated storyline for version one');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save edits/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: /Save edits/i }));
    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/scenario/10',
      );
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(
        String((patchCall?.[1] as RequestInit | undefined)?.body ?? '{}'),
      ) as Record<string, unknown>;
      expect(body).toEqual({
        storylineMd: 'Updated storyline for version one',
      });
    });
  });

  it('preserves unsaved drafts when switching versions', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/trials/trial-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: null,
          scenarioVersions: [
            { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
            { id: 11, versionIndex: 2, status: 'ready', lockedAt: null },
          ],
        }),
      ),
    });
    renderPage();
    const storylineArea = (await screen.findByDisplayValue(
      'Story v1',
    )) as HTMLTextAreaElement;
    await user.clear(storylineArea);
    await user.type(storylineArea, 'Unsaved draft for v1');
    expect(storylineArea.value).toBe('Unsaved draft for v1');
    await user.click(
      screen.getByRole('button', { name: /Select scenario v2/i }),
    );
    await screen.findByText(/Version v2/i);
    await user.click(
      screen.getByRole('button', { name: /Select scenario v1/i }),
    );
    expect(
      await screen.findByDisplayValue('Unsaved draft for v1'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save edits/i })).toBeEnabled();
  });

  it('preserves unsaved drafts when regenerate switches edit context', async () => {
    const user = userEvent.setup();
    let detailCalls = 0;
    mockFetchHandlers({
      '/api/trials/trial-1': () => {
        detailCalls += 1;
        if (detailCalls === 1)
          return jsonResponse(
            buildDetail({
              status: 'ready_for_review',
              activeScenarioVersionId: 10,
              pendingScenarioVersionId: null,
              scenarioVersions: [
                { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
              ],
            }),
          );
        return jsonResponse(
          buildDetail({
            status: 'ready_for_review',
            activeScenarioVersionId: 10,
            pendingScenarioVersionId: 12,
            scenarioVersions: [
              { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
              { id: 12, versionIndex: 2, status: 'generating', lockedAt: null },
            ],
          }),
        );
      },
      '/api/trials/trial-1/scenario/regenerate': jsonResponse({
        scenarioVersionId: 12,
        jobId: 'job-regen-draft',
        status: 'generating',
      }),
      '/api/backend/jobs/job-regen-draft': jsonResponse({
        jobId: 'job-regen-draft',
        status: 'running',
      }),
    });
    renderPage();
    const storylineArea = (await screen.findByDisplayValue(
      'Story v1',
    )) as HTMLTextAreaElement;
    await user.clear(storylineArea);
    await user.type(storylineArea, 'Draft survives regenerate');
    expect(storylineArea.value).toBe('Draft survives regenerate');
    await user.click(
      screen.getByRole('button', { name: /Regenerate scenario/i }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^Regenerate$/i }),
    );
    await screen.findByText(/Generating v2\.\.\./i);
    expect(
      screen.queryByRole('button', { name: /Approve v\d+/i }),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: /Select scenario v1/i }),
    );
    expect(
      await screen.findByDisplayValue('Draft survives regenerate'),
    ).toBeInTheDocument();
  });
});
