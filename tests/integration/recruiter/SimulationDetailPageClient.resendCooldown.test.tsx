import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - resend cooldown', () => {
  it('resends invites and handles rate limits with cooldown', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1/candidates': jsonResponse([{ candidateSessionId: 11, inviteEmail: 'a@example.com', candidateName: 'Alex', status: 'in_progress', inviteEmailStatus: 'sent', startedAt: null, completedAt: null, hasReport: false }]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse({ inviteEmailStatus: 'rate_limited' }, 429, { 'retry-after': '12' }),
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: /Resend invite/i }));
    expect(await screen.findByText(/Retry in 12s/i)).toBeInTheDocument();
  });

  it('ignores non-numeric retry-after headers safely', async () => {
    const user = userEvent.setup();
    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1/candidates': jsonResponse([{ candidateSessionId: 11, inviteEmail: 'a@example.com', candidateName: 'Alex', status: 'in_progress', inviteEmailStatus: 'sent', startedAt: null, completedAt: null, hasReport: false }]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse({ inviteEmailStatus: 'rate_limited' }, 429, { 'retry-after': 'Wed, 21 Oct 2025 07:28:00 GMT' }),
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: /Resend invite/i }));
    expect(await screen.findByText(/Retry in 30s/i)).toBeInTheDocument();
  });

  it('avoids creating duplicate cooldown timers', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const intervalSpy = jest.spyOn(window, 'setInterval');

    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1/candidates': jsonResponse([{ candidateSessionId: 11, inviteEmail: 'a@example.com', candidateName: 'Alex', status: 'in_progress', inviteEmailStatus: 'sent', startedAt: null, completedAt: null, hasReport: false }]),
      '/api/simulations/sim-1/candidates/11/invite/resend': jsonResponse({ inviteEmailStatus: 'rate_limited' }, 429),
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: /Resend invite/i }));
    await screen.findByText(/Retry in 30s/i);
    expect(intervalSpy).toHaveBeenCalledTimes(1);

    intervalSpy.mockRestore();
    jest.useRealTimers();
  });
});
