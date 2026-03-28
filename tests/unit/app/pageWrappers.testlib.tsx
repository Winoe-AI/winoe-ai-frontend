import React from 'react';

export const marketingMock = jest.fn(
  ({ user }: { user?: { email?: string } }) => (
    <div data-testid="marketing-home">{user?.email ?? 'anon'}</div>
  ),
);
export const candidateDashboardMock = jest.fn(
  ({ signedInEmail }: { signedInEmail: string | null }) => (
    <div data-testid="candidate-dashboard">{signedInEmail ?? 'none'}</div>
  ),
);
export const recruiterDashboardMock = jest.fn(() => (
  <div data-testid="recruiter-dashboard" />
));
export const simulationDetailMock = jest.fn(() => (
  <div data-testid="simulation-detail" />
));
export const simulationCreateMock = jest.fn(() => (
  <div data-testid="simulation-create" />
));
export const candidateSubmissionsMock = jest.fn(() => (
  <div data-testid="candidate-submissions" />
));
export const getCachedSessionNormalizedMock = jest.fn();
export const requireCandidateTokenMock = jest.fn();

jest.mock('@/features/marketing/home/MarketingHomePage', () => ({
  __esModule: true,
  default: (props: { user?: { email?: string } }) => marketingMock(props),
}));
jest.mock('@/features/candidate/portal/CandidateDashboardPage', () => ({
  __esModule: true,
  default: (props: { signedInEmail: string | null }) =>
    candidateDashboardMock(props),
}));
jest.mock('@/features/recruiter/dashboard/RecruiterDashboardPage', () => ({
  __esModule: true,
  default: () => recruiterDashboardMock(),
}));
jest.mock(
  '@/features/recruiter/simulation-management/detail/RecruiterSimulationDetailPage',
  () => ({
    __esModule: true,
    default: () => simulationDetailMock(),
  }),
);
jest.mock(
  '@/features/recruiter/simulation-management/create/SimulationCreatePage',
  () => ({
    __esModule: true,
    default: () => simulationCreateMock(),
  }),
);
jest.mock(
  '@/features/recruiter/submission-review/CandidateSubmissionsPage',
  () => ({
    __esModule: true,
    default: () => candidateSubmissionsMock(),
  }),
);
jest.mock('@/platform/auth0', () => ({
  getCachedSessionNormalized: getCachedSessionNormalizedMock,
}));
jest.mock('@/app/(candidate)/(legacy)/candidate-sessions/token-params', () => {
  const actual = jest.requireActual(
    '@/app/(candidate)/(legacy)/candidate-sessions/token-params',
  );
  return { ...actual, requireCandidateToken: requireCandidateTokenMock };
});
jest.mock('@/features/candidate/session/CandidateSessionPage', () => ({
  __esModule: true,
  default: ({ token }: { token: string }) => (
    <div data-testid="candidate-session-page">{token}</div>
  ),
}));

export function resetPageWrapperMocks() {
  jest.clearAllMocks();
}
