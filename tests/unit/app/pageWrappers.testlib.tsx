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
export const talentPartnerDashboardMock = jest.fn(() => (
  <div data-testid="talent-partner-dashboard" />
));
export const trialDetailMock = jest.fn(() => (
  <div data-testid="trial-detail" />
));
export const trialCreateMock = jest.fn(() => (
  <div data-testid="trial-create" />
));
export const candidateSubmissionsMock = jest.fn(() => (
  <div data-testid="candidate-submissions" />
));
export const getCachedSessionNormalizedMock = jest.fn();
export const getSessionNormalizedMock = jest.fn(async () => null);
export const getAccessTokenMock = jest.fn(async () => 'test-access-token');
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
jest.mock(
  '@/features/talent-partner/dashboard/TalentPartnerDashboardPage',
  () => ({
    __esModule: true,
    default: () => talentPartnerDashboardMock(),
  }),
);
jest.mock(
  '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage',
  () => ({
    __esModule: true,
    default: () => trialDetailMock(),
  }),
);
jest.mock(
  '@/features/talent-partner/trial-management/create/TrialCreatePage',
  () => ({
    __esModule: true,
    default: () => trialCreateMock(),
  }),
);
jest.mock(
  '@/features/talent-partner/submission-review/CandidateSubmissionsPage',
  () => ({
    __esModule: true,
    default: () => candidateSubmissionsMock(),
  }),
);
jest.mock('@/platform/auth0', () => ({
  getAccessToken: getAccessTokenMock,
  getSessionNormalized: getSessionNormalizedMock,
  getCachedSessionNormalized: getCachedSessionNormalizedMock,
}));
jest.mock('@/app/(candidate)/candidate/session/token-params', () => {
  const actual = jest.requireActual(
    '@/app/(candidate)/candidate/session/token-params',
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
