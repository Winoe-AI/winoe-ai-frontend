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
          id: 'sim_1',
          title: 'Backend Trial',
          role: 'Backend Engineer',
          createdAt: '2025-12-10T10:00:00Z',
          candidateCount: 3,
          templateKey: 'python-fastapi',
        },
      ],
      simError: null,
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getByText('Backend Trial')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('3 candidate(s)')).toBeInTheDocument();
    expect(screen.getByText(/Template: python-fastapi/i)).toBeInTheDocument();
  });

  it('shows empty state when no trials exist', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [],
      simError: null,
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getByText(/No trials yet/)).toBeInTheDocument();
    expect(screen.queryByText(/candidate\(s\)/i)).not.toBeInTheDocument();
  });

  it('shows error message when backend call fails', async () => {
    mockUseDashboardData.mockReturnValue({
      profile: null,
      profileError: null,
      trials: [],
      simError: 'Unauthorized',
      loadingProfile: false,
      loadingTrials: false,
      refresh: jest.fn(),
    });

    render(<TalentPartnerDashboardPage />);

    expect(screen.getByText(/Couldn’t load trials/i)).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
