import { render } from '@testing-library/react';
import {
  candidateDashboardMock,
  candidateSubmissionsMock,
  getCachedSessionNormalizedMock,
  marketingMock,
  recruiterDashboardMock,
  requireCandidateTokenMock,
  resetPageWrapperMocks,
  simulationCreateMock,
  simulationDetailMock,
} from './pageWrappers.testlib';

describe('route wrapper pages', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('renders marketing page with user when session exists', async () => {
    getCachedSessionNormalizedMock.mockResolvedValue({
      user: { email: 'a@b' },
    });
    const { default: MarketingPage } = await import('@/app/(marketing)/page');
    render(await MarketingPage());
    expect(marketingMock).toHaveBeenCalledWith({ user: { email: 'a@b' } });
  });

  it('renders candidate dashboard with signed-in email fallback', async () => {
    getCachedSessionNormalizedMock.mockResolvedValue({
      user: { email: 'c@d' },
    });
    const { default: CandidateDashboardRoute } =
      await import('@/app/(candidate)/candidate/dashboard/page');
    render(await CandidateDashboardRoute());
    expect(candidateDashboardMock).toHaveBeenCalledWith({
      signedInEmail: 'c@d',
    });
  });

  it('renders candidate dashboard with null email when missing', async () => {
    getCachedSessionNormalizedMock.mockResolvedValue({ user: {} });
    const { default: CandidateDashboardRoute } =
      await import('@/app/(candidate)/candidate/dashboard/page');
    render(await CandidateDashboardRoute());
    expect(candidateDashboardMock).toHaveBeenCalledWith({
      signedInEmail: null,
    });
  });

  it('passes token into candidate session route', async () => {
    requireCandidateTokenMock.mockResolvedValue('tok_123');
    const { default: CandidateSessionRoute } =
      await import('@/app/(candidate)/candidate/session/[token]/page');
    render(
      await CandidateSessionRoute({
        params: Promise.resolve({ token: 'tok_123' }),
      }),
    );
    expect(requireCandidateTokenMock).toHaveBeenCalled();
  });

  it('renders recruiter pages without extra props', async () => {
    const { default: DashboardPage } =
      await import('@/app/(recruiter)/dashboard/page');
    render(await DashboardPage());
    expect(recruiterDashboardMock).toHaveBeenCalled();

    const { default: SimulationDetailPage } =
      await import('@/app/(recruiter)/dashboard/simulations/[id]/page');
    render(await SimulationDetailPage());
    expect(simulationDetailMock).toHaveBeenCalled();

    const { default: SimulationCreatePage } =
      await import('@/app/(recruiter)/dashboard/simulations/new/page');
    render(await SimulationCreatePage());
    expect(simulationCreateMock).toHaveBeenCalled();

    const { default: CandidateSubmissionsPage } =
      await import('@/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/page');
    render(await CandidateSubmissionsPage());
    expect(candidateSubmissionsMock).toHaveBeenCalled();
  });
});
