import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dashboardState,
  mockUseDashboardData,
  renderDashboard,
  resetDashboardMocks,
} from './RecruiterDashboardContent.testlib';

describe('RecruiterDashboardPage error/empty/reload interaction', () => {
  beforeEach(() => {
    resetDashboardMocks();
  });

  it('shows retry for simulation errors and calls refresh on click', async () => {
    const refresh = jest.fn();
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        simulations: [],
        simError: 'Unable to load simulations right now.',
        refresh,
      }),
    );

    renderDashboard();

    expect(screen.getByText(/Couldn’t load simulations/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to load simulations right now\./i),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('renders empty-state path without retry when there is no error', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        simulations: [],
        simError: null,
      }),
    );

    renderDashboard();

    expect(screen.getByText(/No simulations yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Retry/i }),
    ).not.toBeInTheDocument();
  });
});
