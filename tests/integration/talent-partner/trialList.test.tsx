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

    expect(
      screen.getByRole('link', { name: 'Backend Trial' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('2025-12-10')).toBeInTheDocument();
    expect(screen.getByText('3 candidate(s)')).toBeInTheDocument();
    expect(screen.getByText('Ready for review')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeInTheDocument();
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

    expect(screen.getByText(/No trials yet/)).toBeInTheDocument();
    expect(screen.queryByText(/candidate\(s\)/i)).not.toBeInTheDocument();
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

    expect(screen.getByText('0 candidate(s)')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('2025-12-10')).toBeInTheDocument();
    expect(screen.getByText('Active inviting')).toBeInTheDocument();
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

    expect(screen.getByText(/Couldn’t load trials/i)).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
