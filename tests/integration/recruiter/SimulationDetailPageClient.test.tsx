import { act, render, screen, waitFor } from '@testing-library/react';
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

const simulationDetailResponse = () =>
  jsonResponse({
    id: params.id,
    status: 'active_inviting',
    title: `Simulation ${params.id}`,
    templateKey: 'python-fastapi',
    role: 'Backend Engineer',
    techStack: 'Node.js + Postgres',
    focus: 'Payments',
    scenario: 'Design a billing service for a SaaS platform.',
    tasks: [
      {
        dayIndex: 1,
        title: 'Discovery',
        description: 'Define requirements.',
        rubric: ['Clarity'],
      },
      {
        dayIndex: 2,
        title: 'Implementation',
        description: 'Implement API routes.',
        rubric: 'Correctness',
        repoUrl: 'https://github.com/acme/day2',
        preProvisioned: true,
      },
      {
        dayIndex: 3,
        title: 'Debugging',
        description: 'Fix failing tests.',
        rubric: ['Root cause'],
        repoFullName: 'acme/day3',
        preProvisioned: false,
      },
    ],
  });

const getUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

type HandlerResponse = Response | MockResponse;
type Handler =
  | HandlerResponse
  | (() => HandlerResponse | Promise<HandlerResponse>);

const mockFetchHandlers = (handlers: Record<string, Handler>) => {
  const resolvedHandlers = {
    [`/api/simulations/${params.id}`]: simulationDetailResponse,
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
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  global.fetch = realFetch;
});

describe('RecruiterSimulationDetailPage', () => {
  it('renders candidate rows with status badges', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: '11',
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteEmailStatus: 'rate_limited',
          verificationStatus: 'pending',
          progressSummary: { currentDay: '2', totalDays: '5' },
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
        },
        {
          candidateSessionId: 22,
          inviteEmail: 'b@example.com',
          candidateName: 'Blake',
          status: 'completed',
          verificationStatus: 'awaiting_email',
          startedAt: '2025-01-02T00:00:00Z',
          completedAt: '2025-01-03T00:00:00Z',
          hasReport: true,
        },
      ]),
    });

    renderPage();

    expect(
      await screen.findByText(/Simulation ID: sim-1/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Template: python-fastapi/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
    expect(await screen.findByText('Blake')).toBeInTheDocument();
    expect(await screen.findByText(/In progress/i)).toBeInTheDocument();
    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(await screen.findByText('Rate limited')).toBeInTheDocument();
    expect(await screen.findByText('awaiting email')).toBeInTheDocument();
    expect(await screen.findByText('2 / 5')).toBeInTheDocument();
    const completed = await screen.findAllByText(/Completed/i);
    expect(completed.length).toBeGreaterThanOrEqual(2);
  });

  it('gates approve and invite actions by lifecycle status', async () => {
    const user = userEvent.setup();
    let detailFetchCount = 0;

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': () => {
        detailFetchCount += 1;
        if (detailFetchCount === 1) {
          return jsonResponse({
            id: 'sim-1',
            status: 'ready_for_review',
            title: 'Simulation sim-1',
            templateKey: 'python-fastapi',
            scenario: {
              id: 10,
              versionIndex: 1,
              status: 'ready',
            },
            tasks: [
              {
                dayIndex: 1,
                title: 'Discovery',
                description: 'Define requirements.',
              },
            ],
          });
        }
        return jsonResponse({
          id: 'sim-1',
          status: 'active_inviting',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
          scenario: {
            id: 10,
            versionIndex: 1,
            status: 'ready',
          },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/backend/simulations/sim-1/activate': jsonResponse({
        simulationId: 'sim-1',
        status: 'active_inviting',
      }),
    });

    renderPage();

    const approveBtn = await screen.findByRole('button', {
      name: /Approve \/ Activate inviting/i,
    });
    const inviteBtn = await screen.findByRole('button', {
      name: /Invite candidate/i,
    });
    const emptyInviteBtn = await screen.findByRole('button', {
      name: /Invite your first candidate/i,
    });

    expect(approveBtn).toBeEnabled();
    expect(inviteBtn).toBeDisabled();
    expect(emptyInviteBtn).toBeDisabled();

    await user.click(approveBtn);

    await waitFor(() => {
      const activateCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/backend/simulations/sim-1/activate',
      );
      expect(activateCalls.length).toBe(1);
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('button', {
          name: /Approve \/ Activate inviting/i,
        }),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: /Invite your first candidate/i }),
    ).toBeEnabled();
  });

  it('shows regenerate confirmation for locked scenarios', async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

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
        status: 'generating',
      }),
    });

    renderPage();

    const regenerateBtn = await screen.findByRole('button', {
      name: /Regenerate scenario/i,
    });

    await user.click(regenerateBtn);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) ===
          '/api/backend/simulations/sim-1/scenario/regenerate',
      ).length,
    ).toBe(0);

    confirmSpy.mockReturnValue(true);
    await user.click(regenerateBtn);

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter(
        (call) =>
          getUrl(call[0]) ===
          '/api/backend/simulations/sim-1/scenario/regenerate',
      );
      expect(calls.length).toBe(1);
    });

    confirmSpy.mockRestore();
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
        scenario: {
          id: 10,
          versionIndex: 1,
          status: 'ready',
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
      '/api/backend/simulations/sim-1/activate': () => {
        return Promise.reject('approve failed');
      },
    });

    renderPage();

    const approveBtn = await screen.findByRole('button', {
      name: /Approve \/ Activate inviting/i,
    });
    await user.click(approveBtn);

    expect(await screen.findByText(/Request failed/i)).toBeInTheDocument();
  });

  it('shows page-level not found state and skips candidates/actions on 404', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': jsonResponse({ message: 'Not found' }, 404),
    });

    renderPage();

    expect(
      await screen.findByText(/Simulation not found/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite your first candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Approve \/ Activate inviting/i }),
    ).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/simulations/sim-1/candidates');
  });

  it('shows page-level access denied state and skips candidates/actions on 403', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': jsonResponse({ message: 'Forbidden' }, 403),
    });

    renderPage();

    expect(
      await screen.findByText(/You don't have access to this simulation/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite your first candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Approve \/ Activate inviting/i }),
    ).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/simulations/sim-1/candidates');
  });

  it('polls while generating and stops after ready_for_review', async () => {
    jest.useFakeTimers();
    let detailCalls = 0;

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': () => {
        detailCalls += 1;
        if (detailCalls === 1) {
          return jsonResponse({
            id: 'sim-1',
            status: 'generating',
            title: 'Simulation sim-1',
            templateKey: 'python-fastapi',
            scenario: {
              id: 301,
              versionIndex: 1,
              status: 'generating',
            },
            scenarioJob: {
              jobId: 'job-1',
              status: 'running',
              pollAfterMs: 2000,
            },
            tasks: [],
          });
        }
        return jsonResponse({
          id: 'sim-1',
          status: 'ready_for_review',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
          scenario: {
            id: 301,
            versionIndex: 1,
            status: 'ready',
          },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/simulations/sim-1/candidates': jsonResponse([]),
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
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1': () => {
        detailCalls += 1;
        if (detailCalls === 1) {
          return jsonResponse({
            id: 'sim-1',
            status: 'generating',
            title: 'Simulation sim-1',
            templateKey: 'python-fastapi',
            scenario: {
              id: 301,
              versionIndex: 1,
              status: 'generating',
            },
            scenarioJob: {
              jobId: 'job-1',
              status: 'running',
              pollAfterMs: 2000,
            },
            tasks: [],
          });
        }
        return jsonResponse({
          id: 'sim-1',
          status: 'ready_for_review',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
          scenario: {
            id: 301,
            versionIndex: 1,
            status: 'ready',
          },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/simulations/sim-1/candidates': jsonResponse([]),
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
        name: /Approve \/ Activate inviting/i,
      }),
    ).toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).toContain('/api/backend/jobs/job-1');

    jest.useRealTimers();
  });

  it('does not fetch or render submission content on simulation overview', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 33,
          inviteEmail: 'c@example.com',
          candidateName: 'Casey',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
          contentText: 'secret submission',
          testResults: { passed: true },
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText('Casey')).toBeInTheDocument();
    expect(screen.queryByText(/secret submission/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\"passed\": true/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Text answer/i)).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls.some((url) => url.startsWith('/api/submissions'))).toBe(
      false,
    );
  });

  it('creates an invite and refreshes the list', async () => {
    const user = userEvent.setup();

    const candidateResponses = [
      jsonResponse([]),
      jsonResponse([
        {
          candidateSessionId: 99,
          inviteEmail: 'new@example.com',
          candidateName: 'New Person',
          status: 'not_started',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    ];

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': () =>
        candidateResponses.shift() ?? jsonResponse([]),
      '/api/simulations/sim-1/invite': jsonResponse({
        candidateSessionId: '99',
        token: 'invite-token',
        inviteUrl: 'https://example.com/candidate/session/invite-token',
        outcome: 'created',
      }),
    });

    renderPage();

    await screen.findByText(/No candidates yet/i);
    await user.click(
      screen.getByRole('button', { name: /Invite your first candidate/i }),
    );

    await user.type(screen.getByLabelText(/Candidate name/i), 'New Person');
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'new@example.com',
    );

    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(await screen.findByText(/Invite sent for/i)).toBeInTheDocument();

    expect(await screen.findByText('New Person')).toBeInTheDocument();
  });

  it('does not pre-check candidates when opening the invite modal', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/simulations/sim-1/invite': jsonResponse({
        candidateSessionId: '99',
        token: 'invite-token',
        inviteUrl: 'https://example.com/candidate/session/invite-token',
        outcome: 'created',
      }),
    });

    renderPage();

    await screen.findByText(/No candidates yet/i);

    const candidatesUrl = '/api/simulations/sim-1/candidates';
    const candidateCallsBefore = fetchMock.mock.calls.filter(
      (call) => getUrl(call[0]) === candidatesUrl,
    ).length;

    await user.click(
      screen.getByRole('button', { name: /Invite your first candidate/i }),
    );
    await waitFor(() => {
      const candidateCallsAfterOpen = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === candidatesUrl,
      ).length;
      expect(candidateCallsAfterOpen).toBe(candidateCallsBefore);
    });

    await user.type(screen.getByLabelText(/Candidate name/i), 'New Person');
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'new@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    await waitFor(() => {
      const inviteCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/simulations/sim-1/invite',
      ).length;
      expect(inviteCalls).toBe(1);
    });
  });

  it('shows invite errors for 409, 422, and 429 responses', async () => {
    const user = userEvent.setup();

    let inviteStep = 0;
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/simulations/sim-1/invite': () => {
        inviteStep += 1;
        if (inviteStep === 1) {
          return jsonResponse(
            {
              error: {
                code: 'candidate_already_completed',
                message: 'Candidate already completed simulation',
                outcome: 'rejected',
              },
            },
            409,
          );
        }
        if (inviteStep === 2) {
          return jsonResponse({ message: 'Invalid email' }, 422);
        }
        return jsonResponse({ message: 'Rate limited' }, 429);
      },
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: /Invite candidate/i }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Alex');
    await user.type(
      screen.getByLabelText(/Candidate email/i),
      'alex@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(
      await screen.findByText(/already completed this simulation/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(await screen.findByText(/too many invites/i)).toBeInTheDocument();
  });

  it('resends invites and handles rate limits with cooldown', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteEmailStatus: 'sent',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse(
        { inviteEmailStatus: 'rate_limited' },
        429,
        { 'retry-after': '12' },
      ),
    });

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /Resend invite/i }),
    );

    expect(await screen.findByText(/Retry in 12s/i)).toBeInTheDocument();
  });

  it('ignores non-numeric retry-after headers safely', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteEmailStatus: 'sent',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse(
        { inviteEmailStatus: 'rate_limited' },
        429,
        { 'retry-after': 'Wed, 21 Oct 2025 07:28:00 GMT' },
      ),
    });

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /Resend invite/i }),
    );

    expect(await screen.findByText(/Retry in 30s/i)).toBeInTheDocument();
  });

  it('avoids creating duplicate cooldown timers', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const intervalSpy = jest.spyOn(window, 'setInterval');

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteEmailStatus: 'sent',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse(
        { inviteEmailStatus: 'rate_limited' },
        429,
      ),
    });

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /Resend invite/i }),
    );

    await screen.findByText(/Retry in 30s/i);

    expect(intervalSpy).toHaveBeenCalledTimes(1);

    intervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it('copies invite links and shows manual fallback when clipboard fails', async () => {
    const user = userEvent.setup();

    const clipboardWrite = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWrite },
      configurable: true,
    });

    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteUrl: 'https://example.com/invite',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    });

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /Copy invite link/i }),
    );

    expect(clipboardWrite).toHaveBeenCalled();
    const copiedMessages = await screen.findAllByText(/Invite link copied/i);
    expect(copiedMessages.length).toBeGreaterThan(0);

    clipboardWrite.mockRejectedValueOnce(new Error('nope'));
    await user.click(
      screen.getByRole('button', { name: /Copied|Copy invite link/i }),
    );

    expect(
      await screen.findByLabelText(/Manual invite link/i),
    ).toBeInTheDocument();
  });

  it('renders safe defaults when optional fields are missing', async () => {
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-1',
          title: 'Simulation sim-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText('Not verified')).toBeInTheDocument();
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows empty state when there are no candidates', async () => {
    params.id = 'sim-empty';
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-empty',
          title: 'Simulation sim-empty',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-empty/candidates': jsonResponse([]),
    });

    renderPage();

    expect(await screen.findByText(/No candidates yet/i)).toBeInTheDocument();
  });

  it('renders error message when the backend call fails', async () => {
    params.id = 'sim-err';
    mockFetchHandlers({
      '/api/simulations': jsonResponse([
        {
          id: 'sim-err',
          title: 'Simulation sim-err',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/simulations/sim-err/candidates': jsonResponse(
        { message: 'Auth failed' },
        500,
      ),
    });

    renderPage();

    expect(await screen.findByText(/Auth failed/i)).toBeInTheDocument();
  });
});
