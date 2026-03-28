import { render } from '@testing-library/react';
import { resetPageWrapperMocks } from './pageWrappers.testlib';

describe('routes coverage nested pages', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('renders recruiter nested pages', async () => {
    const { default: RecruiterDashboardPage } =
      await import('@/app/(recruiter)/dashboard/page');
    expect(await RecruiterDashboardPage()).toBeTruthy();

    const { default: SimDetailPage } =
      await import('@/app/(recruiter)/dashboard/simulations/[id]/page');
    render(await SimDetailPage());

    const { default: CandidatesPage } =
      await import('@/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/page');
    render(await CandidatesPage());

    const { default: NewSimPage } =
      await import('@/app/(recruiter)/dashboard/simulations/new/page');
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
