import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - invite create modal', () => {
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
    await user.click(screen.getByRole('button', { name: /Invite candidate/i }));
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

    await user.click(screen.getByRole('button', { name: /Invite candidate/i }));
    await waitFor(() => {
      const candidateCallsAfterOpen = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === candidatesUrl,
      ).length;
      expect(candidateCallsAfterOpen).toBeLessThanOrEqual(
        candidateCallsBefore + 1,
      );
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
});
