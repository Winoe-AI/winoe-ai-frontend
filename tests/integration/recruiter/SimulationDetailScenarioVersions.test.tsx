import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulations/detail/RecruiterSimulationDetailPage';
import { NotificationsProvider } from '@/shared/notifications';
import { __resetCandidateCache } from '@/features/recruiter/api';
import { __resetHttpClientCache } from '@/lib/api/client';
import { jsonResponse, type MockResponse } from '../../setup/responseHelpers';

const params = { id: 'sim-1' };

jest.mock('next/navigation', () => ({
  useParams: () => params,
}));

const fetchMock = jest.fn();
const realFetch = global.fetch;

const getUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

type HandlerResponse = Response | MockResponse;
type Handler =
  | HandlerResponse
  | (() => HandlerResponse | Promise<HandlerResponse>);

function buildDetail(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'sim-1',
    status: 'ready_for_review',
    title: 'Simulation sim-1',
    templateKey: 'python-fastapi',
    activeScenarioVersionId: 10,
    pendingScenarioVersionId: null,
    scenarioVersions: [
      {
        id: 10,
        versionIndex: 1,
        status: 'ready',
        lockedAt: null,
      },
    ],
    scenario: {
      id: 10,
      versionIndex: 1,
      status: 'ready',
      lockedAt: null,
      storylineMd: 'Story v1',
      taskPromptsJson: [
        {
          dayIndex: 1,
          title: 'Day 1 task',
          description: 'Implement day one API endpoint.',
        },
      ],
      rubricJson: {
        dayWeights: { '1': 100 },
        dimensions: [],
      },
      notes: 'Base notes',
    },
    tasks: [
      {
        dayIndex: 1,
        title: 'Day 1 task',
        description: 'Implement day one API endpoint.',
      },
    ],
  };

  const merged = { ...base, ...overrides } as Record<string, unknown>;
  if ('scenario' in overrides && typeof overrides.scenario === 'object') {
    merged.scenario = {
      ...(base.scenario as Record<string, unknown>),
      ...(overrides.scenario as Record<string, unknown>),
    };
  }
  return merged;
}

const mockFetchHandlers = (handlers: Record<string, Handler>) => {
  const resolvedHandlers = {
    '/api/simulations': jsonResponse([
      {
        id: 'sim-1',
        title: 'Simulation sim-1',
        templateKey: 'python-fastapi',
      },
    ]),
    '/api/simulations/sim-1': jsonResponse(buildDetail()),
    '/api/simulations/sim-1/candidates': jsonResponse([]),
    ...handlers,
  };

  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = getUrl(input);
    const handler = resolvedHandlers[url];
    if (!handler) return jsonResponse({ message: 'Not found' }, 404);
    return typeof handler === 'function' ? handler() : handler;
  });
};

const renderPage = () =>
  render(
    <NotificationsProvider>
      <RecruiterSimulationDetailPage />
    </NotificationsProvider>,
  );

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  params.id = 'sim-1';
  __resetCandidateCache();
  __resetHttpClientCache();
  jest.useRealTimers();
});

afterAll(() => {
  global.fetch = realFetch;
});

describe('SimulationDetail scenario versions', () => {
  it('shows explicit unavailable state for historical versions without canonical content on fresh load', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations/sim-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: null,
          scenarioVersions: [
            {
              id: 10,
              status: 'ready',
              lockedAt: null,
            },
            {
              id: 11,
              versionIndex: 2,
              status: 'ready',
              lockedAt: null,
            },
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
        name: /Approve v1 \/ Start inviting/i,
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
      screen.queryByRole('button', {
        name: /Approve .* \/ Start inviting/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Invite candidate/i,
      }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save edits/i })).toBeDisabled();
  });

  it('regenerate shows generating state for new version', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    let detailCalls = 0;

    mockFetchHandlers({
      '/api/simulations/sim-1': () => {
        detailCalls += 1;

        if (detailCalls === 1) {
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
        }

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
              {
                id: 12,
                versionIndex: 2,
                status: 'ready',
                lockedAt: null,
              },
            ],
          }),
        );
      },
      '/api/backend/simulations/sim-1/scenario/regenerate': jsonResponse({
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

    const regenerateButton = await screen.findByRole('button', {
      name: /Regenerate scenario/i,
    });

    await user.click(regenerateButton);

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

    await waitFor(() => {
      expect(
        screen.queryByText(/Generating v2\.\.\./i),
      ).not.toBeInTheDocument();
    });
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
      '/api/simulations/sim-1': () => {
        detailCalls += 1;
        if (detailCalls === 1) {
          return jsonResponse(
            buildDetail({
              status: 'ready_for_review',
              activeScenarioVersionId: 10,
              pendingScenarioVersionId: null,
              scenarioVersions: [
                {
                  id: 10,
                  versionIndex: 1,
                  status: 'ready',
                  lockedAt: null,
                },
              ],
            }),
          );
        }

        // Backend still reports pending regenerated version and no canonical
        // content payload for it yet.
        return jsonResponse(
          buildDetail({
            status: 'ready_for_review',
            activeScenarioVersionId: 10,
            pendingScenarioVersionId: 12,
            scenarioVersions: [
              {
                id: 10,
                versionIndex: 1,
                status: 'ready',
                lockedAt: null,
              },
            ],
          }),
        );
      },
      '/api/backend/simulations/sim-1/scenario/regenerate': jsonResponse({
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

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (call) => getUrl(call[0]) === '/api/backend/jobs/job-regen-terminal',
        ),
      ).toBe(true);
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Generating v2\.\.\./i),
      ).not.toBeInTheDocument();
    });
    expect(
      await screen.findAllByText(/local draft data from this session/i),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/^Ready for review$/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/^Local draft only$/i).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByRole('button', {
        name: /Approve .* \/ Start inviting/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Invite candidate/i,
      }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        /Invites stay disabled until the simulation is active inviting\./i,
      ),
    ).toBeInTheDocument();
    expect(detailCalls).toBeGreaterThanOrEqual(2);

    jest.useRealTimers();
  });

  it('keeps page-level status badges aligned with selected generating version', async () => {
    mockFetchHandlers({
      '/api/simulations/sim-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: 12,
          scenarioVersions: [
            {
              id: 10,
              versionIndex: 1,
              status: 'ready',
              lockedAt: null,
            },
            {
              id: 12,
              versionIndex: 2,
              status: 'generating',
              lockedAt: null,
            },
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

  it('tracks editor dirty state and saves PATCH payload', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/backend/simulations/sim-1/scenario/10': jsonResponse({
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save edits/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /Save edits/i }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (call) =>
          getUrl(call[0]) === '/api/backend/simulations/sim-1/scenario/10',
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
      '/api/simulations/sim-1': jsonResponse(
        buildDetail({
          status: 'ready_for_review',
          activeScenarioVersionId: 10,
          pendingScenarioVersionId: null,
          scenarioVersions: [
            {
              id: 10,
              versionIndex: 1,
              status: 'ready',
              lockedAt: null,
            },
            {
              id: 11,
              versionIndex: 2,
              status: 'ready',
              lockedAt: null,
            },
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
      '/api/simulations/sim-1': () => {
        detailCalls += 1;
        if (detailCalls === 1) {
          return jsonResponse(
            buildDetail({
              status: 'ready_for_review',
              activeScenarioVersionId: 10,
              pendingScenarioVersionId: null,
              scenarioVersions: [
                {
                  id: 10,
                  versionIndex: 1,
                  status: 'ready',
                  lockedAt: null,
                },
              ],
            }),
          );
        }
        return jsonResponse(
          buildDetail({
            status: 'ready_for_review',
            activeScenarioVersionId: 10,
            pendingScenarioVersionId: 12,
            scenarioVersions: [
              {
                id: 10,
                versionIndex: 1,
                status: 'ready',
                lockedAt: null,
              },
              {
                id: 12,
                versionIndex: 2,
                status: 'generating',
                lockedAt: null,
              },
            ],
          }),
        );
      },
      '/api/backend/simulations/sim-1/scenario/regenerate': jsonResponse({
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
      screen.queryByRole('button', {
        name: /Approve .* \/ Start inviting/i,
      }),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: /Select scenario v1/i }),
    );
    expect(
      await screen.findByDisplayValue('Draft survives regenerate'),
    ).toBeInTheDocument();
  });

  it('renders SCENARIO_LOCKED as a non-blocking banner', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/backend/simulations/sim-1/scenario/10': jsonResponse(
        {
          detail: 'Scenario version is locked.',
          errorCode: 'SCENARIO_LOCKED',
        },
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

    const lockMessages = await screen.findAllByText(
      /This version is locked because invites exist\./i,
    );
    expect(lockMessages.length).toBeGreaterThan(0);
    expect(
      await screen.findByRole('button', { name: /Save edits/i }),
    ).toBeDisabled();
  });

  it('approves only the selected version id', async () => {
    const user = userEvent.setup();
    let detailCalls = 0;

    mockFetchHandlers({
      '/api/simulations/sim-1': () => {
        detailCalls += 1;

        if (detailCalls === 1) {
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
                rubricJson: {
                  dayWeights: { '1': 100 },
                  dimensions: [],
                },
              },
              scenarioVersions: [
                {
                  id: 10,
                  versionIndex: 1,
                  status: 'locked',
                  lockedAt: '2026-03-01T12:00:00.000Z',
                },
                {
                  id: 11,
                  versionIndex: 2,
                  status: 'ready',
                  lockedAt: null,
                },
              ],
            }),
          );
        }

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
              {
                id: 11,
                versionIndex: 2,
                status: 'ready',
                lockedAt: null,
              },
            ],
          }),
        );
      },
      '/api/backend/simulations/sim-1/scenario/11/approve': jsonResponse({
        simulationId: 'sim-1',
        status: 'active_inviting',
        activeScenarioVersionId: 11,
        pendingScenarioVersionId: null,
      }),
    });

    renderPage();

    const approveButton = await screen.findByRole('button', {
      name: /Approve v2 \/ Start inviting/i,
    });

    await user.click(approveButton);

    await waitFor(() => {
      const approveCalls = fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) ===
          '/api/backend/simulations/sim-1/scenario/11/approve',
      );
      expect(approveCalls.length).toBe(1);
    });

    const activateCalls = fetchMock.mock.calls.filter(
      (call) => getUrl(call[0]) === '/api/backend/simulations/sim-1/activate',
    );
    expect(activateCalls.length).toBe(0);
  });
});
