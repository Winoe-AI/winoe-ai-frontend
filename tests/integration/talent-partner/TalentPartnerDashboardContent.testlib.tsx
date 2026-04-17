import '../setup/routerMock';
import { render, type RenderResult } from '@testing-library/react';
import { NotificationsProvider } from '@/shared/notifications';
import type { TalentPartnerProfile } from '@/features/talent-partner/types';
import {
  inviteCandidate,
  listTrialCandidates,
} from '@/features/talent-partner/api';
import { useDashboardData } from '@/features/talent-partner/dashboard/hooks/useDashboardData';

jest.mock('@/features/talent-partner/api', () => {
  const actual = jest.requireActual('@/features/talent-partner/api');
  return {
    ...actual,
    listTrials: jest.fn(),
    listTrialCandidates: jest.fn(),
    inviteCandidate: jest.fn(),
  };
});
jest.mock('@/features/talent-partner/dashboard/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}));

export const TalentPartnerDashboardPage = (
  jest.requireActual(
    '@/features/talent-partner/dashboard/TalentPartnerDashboardPage',
  ) as { default: () => React.JSX.Element }
).default;

export const mockedInviteCandidate = inviteCandidate as jest.MockedFunction<
  typeof inviteCandidate
>;
export const mockedListTrialCandidates =
  listTrialCandidates as jest.MockedFunction<typeof listTrialCandidates>;
export const mockUseDashboardData = useDashboardData as jest.MockedFunction<
  typeof useDashboardData
>;

export const profile: TalentPartnerProfile = {
  id: 1,
  name: 'Jordan Doe',
  email: 'jordan@example.com',
  role: 'talent_partner',
};

type DashboardHookState = ReturnType<typeof useDashboardData>;

export const dashboardState = (
  overrides: Partial<DashboardHookState> = {},
): DashboardHookState => ({
  profile: null,
  profileError: null,
  trials: [],
  trialsError: null,
  loadingProfile: false,
  loadingTrials: false,
  refresh: jest.fn() as DashboardHookState['refresh'],
  requestId: null,
  abort: jest.fn(),
  ...overrides,
});

export const resetDashboardMocks = () => {
  jest.resetAllMocks();
  mockUseDashboardData.mockReturnValue(dashboardState());
};

export const renderDashboard = (): RenderResult =>
  render(
    <NotificationsProvider>
      <TalentPartnerDashboardPage />
    </NotificationsProvider>,
  );
