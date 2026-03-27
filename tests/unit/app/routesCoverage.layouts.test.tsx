import { render, screen } from '@testing-library/react';
import {
  getCachedSessionNormalizedMock,
  requireCandidateTokenMock,
  resetPageWrapperMocks,
} from './pageWrappers.testlib';

describe('routes coverage layouts', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
    getCachedSessionNormalizedMock.mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    requireCandidateTokenMock.mockResolvedValue('token-123');
  });

  it('renders root and marketing layouts', async () => {
    const { default: RootLayout } = await import('@/app/layout');
    expect(
      RootLayout({ children: <div data-testid="child">child</div> }),
    ).toBeTruthy();

    const { default: MarketingLayout } =
      await import('@/app/(marketing)/layout');
    expect(
      MarketingLayout({ children: <div data-testid="m-child">ok</div> }),
    ).toBeTruthy();
  });

  it('renders marketing and candidate dashboard pages with session email', async () => {
    const { default: MarketingPage } = await import('@/app/(marketing)/page');
    render(await MarketingPage());
    expect(screen.getByTestId('marketing-home')).toHaveTextContent(
      'user@example.com',
    );

    const { default: CandidateDashboardRoute } =
      await import('@/app/(candidate)/candidate/dashboard/page');
    render(await CandidateDashboardRoute());
    expect(screen.getByTestId('candidate-dashboard')).toHaveTextContent(
      'user@example.com',
    );
  });

  it('resolves candidate session token route', async () => {
    const { default: CandidateSessionRoute } =
      await import('@/app/(candidate)/candidate/session/[token]/page');
    render(await CandidateSessionRoute({ params: { token: 'abc' } as never }));
    expect(requireCandidateTokenMock).toHaveBeenCalledWith({ token: 'abc' });
    expect(screen.getByTestId('candidate-session-page')).toHaveTextContent(
      'token-123',
    );
  });

  it('renders recruiter and candidate shell layouts', async () => {
    const { default: CandidateLayout } =
      await import('@/app/(candidate)/layout');
    expect(
      CandidateLayout({ children: <div data-testid="candidate-child" /> }),
    ).toBeTruthy();

    const { default: RecruiterLayout } =
      await import('@/app/(recruiter)/layout');
    expect(
      RecruiterLayout({ children: <div data-testid="recruiter-child" /> }),
    ).toBeTruthy();
  });
});
