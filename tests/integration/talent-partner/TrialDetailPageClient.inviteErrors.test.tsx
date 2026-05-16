import { fireEvent } from '@testing-library/react';
import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - invite error handling', () => {
  it('shows invite errors for 409, 422, and 429 responses', async () => {
    const user = userEvent.setup();
    let inviteStep = 0;

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/trials/trial-1/invite-candidates': () => {
        inviteStep += 1;
        if (inviteStep === 1)
          return jsonResponse(
            {
              error: {
                code: 'candidate_already_completed',
                message: 'Candidate already completed trial',
                outcome: 'rejected',
              },
            },
            409,
          );
        if (inviteStep === 2)
          return jsonResponse({ message: 'Invalid email' }, 422);
        return jsonResponse({ message: 'Rate limited' }, 429);
      },
    });

    renderPage();

    await screen.findByText(/No candidates invited yet/i);
    await waitFor(() =>
      expect(screen.getByTestId('invite-candidates-header')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('invite-candidates-header'));
    await screen.findByLabelText(/Full name \(row 1\)/i);
    await user.type(screen.getByLabelText(/Full name \(row 1\)/i), 'Alex');
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'alex@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(
      await screen.findByText(/already completed this trial/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(await screen.findByText(/too many invites/i)).toBeInTheDocument();
  });
});
