import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
  within,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - scenario actions', () => {
  it('shows regenerate confirmation for locked scenarios', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': jsonResponse({
        id: 'sim-1',
        status: 'active_inviting',
        title: 'Simulation sim-1',
        templateKey: 'python-fastapi',
        scenario: {
          id: 101,
          versionIndex: 2,
          status: 'ready',
          lockedAt: '2026-03-01T12:00:00.000Z',
        },
        tasks: [
          {
            dayIndex: 1,
            title: 'Discovery',
            description: 'Define requirements.',
          },
        ],
      }),
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/backend/simulations/sim-1/scenario/regenerate': jsonResponse({
        scenarioVersionId: 102,
        jobId: 'job-1',
        status: 'generating',
      }),
    });

    renderPage();

    const regenerateBtn = await screen.findByRole('button', {
      name: /Regenerate scenario/i,
    });
    await user.click(regenerateBtn);
    const dialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) ===
          '/api/backend/simulations/sim-1/scenario/regenerate',
      ).length,
    ).toBe(0);

    await user.click(within(dialog).getByRole('button', { name: /Cancel/i }));
    await user.click(regenerateBtn);
    const confirmDialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    await user.click(
      within(confirmDialog).getByRole('button', { name: /^Regenerate$/i }),
    );

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) ===
          '/api/backend/simulations/sim-1/scenario/regenerate',
      );
      expect(calls.length).toBe(1);
    });
  });

  it('shows action error when approve request fails', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': jsonResponse({
        id: 'sim-1',
        status: 'ready_for_review',
        title: 'Simulation sim-1',
        templateKey: 'python-fastapi',
        scenario: { id: 10, versionIndex: 1, status: 'ready' },
        tasks: [
          {
            dayIndex: 1,
            title: 'Discovery',
            description: 'Define requirements.',
          },
        ],
      }),
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/backend/simulations/sim-1/scenario/10/approve': () =>
        Promise.reject('approve failed'),
    });

    renderPage();
    await user.click(
      await screen.findByRole('button', {
        name: /Approve v1 \/ Start inviting/i,
      }),
    );
    expect(await screen.findByText(/Request failed/i)).toBeInTheDocument();
  });
});
