import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './SimulationDetailPageClient.testlib';

describe('RecruiterSimulationDetailPage - invite error handling', () => {
  it('shows invite errors for 409, 422, and 429 responses', async () => {
    const user = userEvent.setup();
    let inviteStep = 0;

    mockFetchHandlers({
      '/api/simulations': jsonResponse([{ id: 'sim-1', title: 'Simulation sim-1', templateKey: 'python-fastapi' }]),
      '/api/simulations/sim-1/candidates': jsonResponse([]),
      '/api/simulations/sim-1/invite': () => {
        inviteStep += 1;
        if (inviteStep === 1) return jsonResponse({ error: { code: 'candidate_already_completed', message: 'Candidate already completed simulation', outcome: 'rejected' } }, 409);
        if (inviteStep === 2) return jsonResponse({ message: 'Invalid email' }, 422);
        return jsonResponse({ message: 'Rate limited' }, 429);
      },
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: /Invite candidate/i }));
    await user.type(screen.getByLabelText(/Candidate name/i), 'Alex');
    await user.type(screen.getByLabelText(/Candidate email/i), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/already completed this simulation/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/too many invites/i)).toBeInTheDocument();
  });
});
