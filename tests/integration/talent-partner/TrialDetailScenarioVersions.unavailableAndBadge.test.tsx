import {
  buildDetail,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './TrialDetailScenarioVersions.testlib';

describe('TrialDetail scenario versions - unavailable and badges', () => {
  it('shows explicit unavailable state for historical versions without canonical content on fresh load', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/trials/trial-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: null,
          scenarioVersions: [
            { id: 10, status: 'ready', lockedAt: null },
            { id: 11, versionIndex: 2, status: 'ready', lockedAt: null },
          ],
        }),
      ),
    });
    renderPage();
    const selectV2 = await screen.findByRole('button', {
      name: /Select scenario v2/i,
    });
    expect(
      await screen.findByRole('button', {
        name: /Approve v1/i,
      }),
    ).toBeInTheDocument();
    await user.click(selectV2);
    expect(await screen.findByText(/Version v2/i)).toBeInTheDocument();
    expect(
      await screen.findAllByText(/content is unavailable from the backend/i),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/^Ready for review$/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/^Content unavailable$/i).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByRole('button', { name: /Approve v1/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save edits/i })).toBeDisabled();
  });

  it('keeps page-level status badges aligned with selected generating version', async () => {
    mockFetchHandlers({
      '/api/trials/trial-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: 12,
          scenarioVersions: [
            { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
            { id: 12, versionIndex: 2, status: 'generating', lockedAt: null },
          ],
        }),
      ),
    });
    renderPage();
    expect(await screen.findByText(/Generating v2\.\.\./i)).toBeInTheDocument();
    expect(screen.queryByText(/^Ready for review$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Generating$/i).length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
