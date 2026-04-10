import { render, screen } from '@testing-library/react';
import {
  candidateDashboardMock,
  candidateSubmissionsMock,
  getCachedSessionNormalizedMock,
  marketingMock,
  talentPartnerDashboardMock,
  requireCandidateTokenMock,
  resetPageWrapperMocks,
  trialCreateMock,
  trialDetailMock,
} from './pageWrappers.testlib';

describe('page wrapper coverage tests', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('marketing page passes undefined user when no session', async () => {
    getCachedSessionNormalizedMock.mockResolvedValue(null);
    const { default: MarketingPage, metadata } =
      await import('@/app/(marketing)/page');
    render(await MarketingPage());
    expect(marketingMock).toHaveBeenCalledWith({ user: undefined });
    expect(metadata).toBeDefined();
  });

  it('candidate dashboard passes null email when session is missing', async () => {
    getCachedSessionNormalizedMock.mockResolvedValue(null);
    const { default: CandidateDashboardRoute, metadata } =
      await import('@/app/(candidate)/candidate/dashboard/page');
    render(await CandidateDashboardRoute());
    expect(candidateDashboardMock).toHaveBeenCalledWith({
      signedInEmail: null,
    });
    expect(metadata).toBeDefined();
  });

  it('candidate session route forwards token', async () => {
    requireCandidateTokenMock.mockResolvedValue('test-token-123');
    const { default: CandidateSessionRoute, metadata } =
      await import('@/app/(candidate)/candidate/session/[token]/page');
    render(
      await CandidateSessionRoute({
        params: Promise.resolve({ token: 'test-token-123' }),
      }),
    );
    expect(requireCandidateTokenMock).toHaveBeenCalled();
    expect(screen.getByTestId('candidate-session-page')).toHaveTextContent(
      'test-token-123',
    );
    expect(metadata).toBeDefined();
  });

  it('talent_partner pages render and expose metadata', async () => {
    const { default: DashboardPage, metadata: dashboardMeta } =
      await import('@/app/(talent-partner)/dashboard/page');
    render(await DashboardPage());
    expect(talentPartnerDashboardMock).toHaveBeenCalled();
    expect(dashboardMeta?.title).toBeDefined();

    const { default: TrialDetailPage, metadata: detailMeta } =
      await import('@/app/(talent-partner)/dashboard/trials/[id]/page');
    render(await TrialDetailPage());
    expect(trialDetailMock).toHaveBeenCalled();
    expect(detailMeta?.title).toBeDefined();

    const { default: TrialCreatePage, metadata: createMeta } =
      await import('@/app/(talent-partner)/dashboard/trials/new/page');
    render(await TrialCreatePage());
    expect(trialCreateMock).toHaveBeenCalled();
    expect(createMeta?.title).toBeDefined();

    const { default: CandidateSubmissionsPage, metadata: submissionsMeta } =
      await import('@/app/(talent-partner)/dashboard/trials/[id]/candidates/[candidateSessionId]/page');
    render(await CandidateSubmissionsPage());
    expect(candidateSubmissionsMock).toHaveBeenCalled();
    expect(submissionsMeta?.title).toBeDefined();
  });
});
