import {
  act,
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

describe('TrialDetail scenario versions - regenerate lifecycle', () => {
  it('regenerate shows generating state for new version', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    let detailCalls = 0;
    mockFetchHandlers({
      '/api/trials/trial-1': () => {
        detailCalls += 1;
        if (detailCalls === 1)
          return jsonResponse(
            buildDetail({
              status: 'active_inviting',
              scenario: {
                status: 'locked',
                lockedAt: '2026-03-01T12:00:00.000Z',
              },
              scenarioVersions: [
                {
                  id: 10,
                  versionIndex: 1,
                  status: 'locked',
                  lockedAt: '2026-03-01T12:00:00.000Z',
                },
              ],
            }),
          );
        return jsonResponse(
          buildDetail({
            status: 'ready_for_review',
            pendingScenarioVersionId: 12,
            scenarioVersions: [
              {
                id: 10,
                versionIndex: 1,
                status: 'locked',
                lockedAt: '2026-03-01T12:00:00.000Z',
              },
              { id: 12, versionIndex: 2, status: 'ready', lockedAt: null },
            ],
          }),
        );
      },
      '/api/backend/trials/trial-1/scenario/regenerate': jsonResponse({
        scenarioVersionId: 12,
        jobId: 'job-regen-1',
        status: 'generating',
      }),
      '/api/backend/jobs/job-regen-1': jsonResponse({
        jobId: 'job-regen-1',
        status: 'succeeded',
      }),
    });
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: /Regenerate scenario/i }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^Regenerate$/i }),
    );
    expect(await screen.findByText(/Generating v2\.\.\./i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2200);
    });
    await waitFor(() =>
      expect(
        screen.queryByText(/Generating v2\.\.\./i),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findAllByText(/local draft data from this session/i),
    ).not.toHaveLength(0);
    expect(detailCalls).toBeGreaterThanOrEqual(2);
    jest.useRealTimers();
  });

  it('reconciles terminal regenerate job to non-generating local-only state without reload', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
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
            ],
          }),
        );
      },
      '/api/backend/trials/trial-1/scenario/regenerate': jsonResponse({
        scenarioVersionId: 12,
        jobId: 'job-regen-terminal',
        status: 'generating',
      }),
      '/api/backend/jobs/job-regen-terminal': jsonResponse({
        jobId: 'job-regen-terminal',
        status: 'completed',
      }),
    });
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: /Regenerate scenario/i }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^Regenerate$/i }),
    );
    expect(await screen.findByText(/Generating v2\.\.\./i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2200);
    });
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          (call) => getUrl(call[0]) === '/api/backend/jobs/job-regen-terminal',
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(
        screen.queryByText(/Generating v2\.\.\./i),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findAllByText(/local draft data from this session/i),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/^Ready for review$/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/^Local draft only$/i).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByRole('button', { name: /Approve .* \/ Start inviting/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        /Invites stay disabled until the trial is active inviting\./i,
      ),
    ).toBeInTheDocument();
    expect(detailCalls).toBeGreaterThanOrEqual(2);
    jest.useRealTimers();
  });
});
