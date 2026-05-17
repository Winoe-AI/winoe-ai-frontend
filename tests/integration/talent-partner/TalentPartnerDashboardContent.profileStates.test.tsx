import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { routerMock } from '../setup/routerMock';
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
    routerMock.push.mockReset();
  });

  it('renders profile details when available', async () => {
    mockUseDashboardData.mockReturnValue(dashboardState({ profile }));
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Trials' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search trials...')).toBeInTheDocument();
    expect(
      await screen.findByText('Create your first Trial'),
    ).toBeInTheDocument();
  });

  it('shows profile error and empty state', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({ profileError: 'Unable to fetch profile' }),
    );
    renderDashboard();
    expect(screen.getByText('Create your first Trial')).toBeInTheDocument();
  });

  it('shows empty state when no trials exist', () => {
    renderDashboard();
    expect(screen.getByText('Create your first Trial')).toBeInTheDocument();
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
    expect(screen.getAllByText('Awaiting Candidate').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: 'Backend Engineer - Node' }),
    ).toBeInTheDocument();
  });

  it('does not render inline invite controls and uses neutral metadata defaults', async () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [
          {
            id: 'trial_missing_meta',
            title: 'Data Engineer',
            role: 'Data Engineer',
            createdAt: '2025-12-10T10:00:00Z',
            candidateCount: 0,
            status: 'completed',
          },
        ],
      }),
    );
    renderDashboard();

    expect(await screen.findByText('Data Engineer')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /invite/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    expect(screen.queryByText('Senior level')).not.toBeInTheDocument();
    expect(screen.queryByText('62–84')).not.toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('wires command palette with loaded trials and invite-candidate CTA destination', async () => {
    const user = userEvent.setup();
    mockUseDashboardData.mockReturnValue(
      dashboardState({
        trials: [
          {
            id: 'trial_cmdk',
            title: 'Platform Engineer',
            role: 'Platform Engineer',
            createdAt: '2025-12-10T10:00:00Z',
            candidateCount: 1,
          },
        ],
      }),
    );
    renderDashboard();

    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByText('Navigate to')).toBeInTheDocument();
    await user.click(
      screen.getByRole('option', { name: /Platform Engineer/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith(
      '/talent-partner/trials/trial_cmdk',
    );

    await user.keyboard('{Control>}k{/Control}');
    await user.click(
      screen.getByRole('option', { name: /Invite candidates/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith('/talent-partner/trials');
  });

  it('shows inline trial load error', () => {
    mockUseDashboardData.mockReturnValue(
      dashboardState({ trialsError: 'Unauthorized' }),
    );
    renderDashboard();
    expect(
      screen.getByText('Failed to load trials: Unauthorized'),
    ).toBeInTheDocument();
  });
});
