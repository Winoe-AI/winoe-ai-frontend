import { render, screen } from '@testing-library/react';

const redirectMock = jest.fn();
const dashboardPageMock = jest.fn(() => (
  <div data-testid="talent-partner-dashboard" />
));

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock(
  '@/features/talent-partner/dashboard/TalentPartnerDashboardPage',
  () => ({
    __esModule: true,
    default: () => dashboardPageMock(),
  }),
);

describe('/talent-partner/trials alias route', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    dashboardPageMock.mockClear();
  });

  it('renders the talent partner dashboard page', async () => {
    const { default: Page } =
      await import('@/app/(talent-partner)/talent-partner/trials/page');
    render(Page());
    expect(screen.getByTestId('talent-partner-dashboard')).toBeInTheDocument();
    expect(dashboardPageMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
