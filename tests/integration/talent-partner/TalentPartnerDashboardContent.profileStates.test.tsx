import { screen } from '@testing-library/react';
import {
  dashboardState,
  mockUseDashboardData,
  profile,
  renderDashboard,
  resetDashboardMocks,
} from './TalentPartnerDashboardContent.testlib';

describe('TalentPartnerDashboardPage profile/list states', () => {
  beforeEach(() => {
    resetDashboardMocks();
  });

  it('renders profile details when available', async () => {
    mockUseDashboardData.mockReturnValue(dashboardState({ profile }));
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jordan Doe')).toBeInTheDocument();
    expect(screen.getByText('jordan@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Role:/)).toHaveTextContent('Role: talent_partner');
    expect(await screen.findByText(/No trials yet/i)).toBeInTheDocument();
  });

  it('shows profile error and empty state', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({ profileError: 'Unable to fetch profile' }),
    );
    renderDashboard();
    expect(screen.getByText('Unable to fetch profile')).toBeInTheDocument();
    expect(screen.getByText(/No trials yet/i)).toBeInTheDocument();
  });

  it('shows empty state when no trials exist', () => {
    renderDashboard();
    expect(screen.getByText(/No trials yet/i)).toBeInTheDocument();
  });

  it('renders trials list metadata', async () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [
          {
            id: 'sim_1',
            title: 'Backend Engineer - Node',
            role: 'Backend Engineer',
            createdAt: '2025-12-10T10:00:00Z',
            candidateCount: 2,
          },
        ],
      }),
    );
    renderDashboard();
    expect(
      await screen.findByText('Backend Engineer - Node'),
    ).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('2 candidate(s)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Invite candidate' }),
    ).toBeInTheDocument();
  });

  it('shows inline trial load error', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({ trialsError: 'Unauthorized' }),
    );
    renderDashboard();
    expect(screen.getByText('Couldn’t load trials')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
