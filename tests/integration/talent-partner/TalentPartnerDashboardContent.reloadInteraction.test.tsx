import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './TalentPartnerDashboardContent.testlib';

describe('TalentPartnerDashboardPage error/empty/reload interaction', () => {
  beforeEach(() => {
    resetDashboardMocks();
  });

  it('shows retry for trial errors and calls refresh on click', async () => {
    const refresh = jest.fn();
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [],
        simError: 'Unable to load trials right now.',
        refresh,
      }),
    );

    renderDashboard();

    expect(screen.getByText(/Couldn’t load trials/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to load trials right now\./i),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('renders empty-state path without retry when there is no error', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [],
        simError: null,
      }),
    );

    renderDashboard();

    expect(screen.getByText(/No trials yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Retry/i }),
    ).not.toBeInTheDocument();
  });
});
