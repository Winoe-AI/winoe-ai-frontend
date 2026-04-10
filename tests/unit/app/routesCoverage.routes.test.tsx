import { render } from '@testing-library/react';
import { resetPageWrapperMocks } from './pageWrappers.testlib';

describe('routes coverage nested pages', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('renders talent_partner nested pages', async () => {
    const { default: TalentPartnerDashboardPage } =
      await import('@/app/(talent-partner)/dashboard/page');
    expect(await TalentPartnerDashboardPage()).toBeTruthy();

    const { default: SimDetailPage } =
      await import('@/app/(talent-partner)/dashboard/trials/[id]/page');
    render(await SimDetailPage());

    const { default: CandidatesPage } =
      await import('@/app/(talent-partner)/dashboard/trials/[id]/candidates/[candidateSessionId]/page');
    render(await CandidatesPage());

    const { default: NewSimPage } =
      await import('@/app/(talent-partner)/dashboard/trials/new/page');
    render(await NewSimPage());
  });

  it('renders candidate session legacy layout', async () => {
    const { default: CandidateSessionsLayout } =
      await import('@/app/(candidate)/(legacy)/candidate-sessions/layout');
    const view = CandidateSessionsLayout({
      children: <div data-testid="sessions-child" />,
    });
    render(view);
  });
});
