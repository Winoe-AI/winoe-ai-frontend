import '../setup/routerMock';
import { render, type RenderResult } from '@testing-library/react';
import { NotificationsProvider } from '@/shared/notifications';
import type { RecruiterProfile } from '@/features/recruiter/types';
import {
  inviteCandidate,
  listSimulationCandidates,
} from '@/features/recruiter/api';
import { useDashboardData } from '@/features/recruiter/dashboard/hooks/useDashboardData';

jest.mock('@/features/recruiter/api', () => {
  const actual = jest.requireActual('@/features/recruiter/api');
  return {
    ...actual,
    listSimulations: jest.fn(),
    listSimulationCandidates: jest.fn(),
    inviteCandidate: jest.fn(),
  };
});
jest.mock('@/features/recruiter/dashboard/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}));

export const RecruiterDashboardPage = (
  jest.requireActual(
    '@/features/recruiter/dashboard/RecruiterDashboardPage',
  ) as { default: () => React.JSX.Element }
).default;

export const mockedInviteCandidate = inviteCandidate as jest.MockedFunction<
  typeof inviteCandidate
>;
export const mockedListSimulationCandidates =
  listSimulationCandidates as jest.MockedFunction<
    typeof listSimulationCandidates
  >;
export const mockUseDashboardData = useDashboardData as jest.MockedFunction<
  typeof useDashboardData
>;

export const profile: RecruiterProfile = {
  id: 1,
  name: 'Jordan Doe',
  email: 'jordan@example.com',
  role: 'recruiter',
};

type DashboardHookState = ReturnType<typeof useDashboardData>;

export const dashboardState = (
  overrides: Partial<DashboardHookState> = {},
): DashboardHookState => ({
  profile: null,
  profileError: null,
  simulations: [],
  simError: null,
  loadingProfile: false,
  loadingSimulations: false,
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
      <RecruiterDashboardPage />
    </NotificationsProvider>,
  );
