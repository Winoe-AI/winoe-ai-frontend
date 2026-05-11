import '../setup/routerMock';
import { render, screen } from '@testing-library/react';
import TalentPartnerDashboardPage from '@/features/talent-partner/dashboard/TalentPartnerDashboardPage';
import { useDashboardData } from '@/features/talent-partner/dashboard/hooks/useDashboardData';

jest.mock('@/features/talent-partner/dashboard/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}));

const mockUseDashboardData = useDashboardData as jest.MockedFunction<
  typeof useDashboardData
>;

describe('TalentPartner trials list (integration)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders trials returned from the backend', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [
        {
          id: 'trial_1',
          title: 'Backend Trial',
          role: 'Backend Engineer',
          createdAt: '2025-12-10T10:00:00Z',
          candidateCount: 3,
          status: 'ready_for_review',
        },
      ],
      trialsError: null,
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Trials' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Trial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Awaiting Candidate' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Completed' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Terminated' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search trials...')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Trial' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Candidates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Status' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Started' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Score range' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Backend Trial' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Awaiting Candidate').length).toBeGreaterThan(0);
  });

  it('shows empty state when no trials exist', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [],
      trialsError: null,
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getByText('Create your first Trial')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A 5-day work Trial that surfaces real engineering signal.',
      ),
    ).toBeInTheDocument();
  });

  it('renders zero candidate counts and the lifecycle status badge', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [
        {
          id: 'trial_0',
          title: 'New Trial',
          role: 'Frontend Engineer',
          createdAt: '2025-12-10T10:00:00Z',
          candidateCount: 0,
          status: 'active_inviting',
        },
      ],
      trialsError: null,
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('shows error message when backend call fails', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [],
      trialsError: 'Unauthorized',
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(
      screen.getByText('Failed to load trials: Unauthorized'),
    ).toBeInTheDocument();
  });
});
