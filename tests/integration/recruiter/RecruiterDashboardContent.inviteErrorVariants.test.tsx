import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockedInviteCandidate,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './RecruiterDashboardContent.testlib';

async function openAndSubmitInvite() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Invite candidate' }),
  );
  await user.type(screen.getByLabelText(/Candidate name/i), 'Alex');
  await user.type(screen.getByLabelText(/Candidate email/i), 'alex@example.com');
  await user.click(screen.getByRole('button', { name: /Send invite/i }));
}

describe('RecruiterDashboardPage invite error variants', () => {
  beforeEach(() => {
    resetDashboardMocks();
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        simulations: [
          {
            id: 'sim_1',
            title: 'Sim 1',
            role: 'Backend',
            createdAt: '2025-12-10T10:00:00Z',
          },
        ],
      }),
    );
  });

  it('shows validation and rate-limit friendly copy', async () => {
    mockedInviteCandidate
      .mockRejectedValueOnce({ status: 422, message: 'invalid email' })
      .mockRejectedValueOnce({ status: 429, message: 'rate limited' });

    renderDashboard();

    await openAndSubmitInvite();
    expect(
      await screen.findByText(/Enter a valid email address\./i),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Send invite/i }));
    expect(
      await screen.findByText(/Too many invites sent\. Please wait and try again\./i),
    ).toBeInTheDocument();
  });

  it('shows completed-candidate rejection copy for 409 conflict', async () => {
    mockedInviteCandidate.mockRejectedValueOnce({
      status: 409,
      details: {
        error: {
          code: 'candidate_already_completed',
        },
      },
    });

    renderDashboard();

    await openAndSubmitInvite();
    expect(
      await screen.findByText(
        /already completed this simulation and cannot be re-invited/i,
      ),
    ).toBeInTheDocument();
  });
});
