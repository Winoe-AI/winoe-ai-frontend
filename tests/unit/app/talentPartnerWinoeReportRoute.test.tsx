import { render, screen } from '@testing-library/react';

const winoeReportPageMock = jest.fn(() => (
  <div data-testid="winoe-report-page" />
));

jest.mock('@/features/talent-partner/winoe-report/WinoeReportPage', () => ({
  __esModule: true,
  default: () => winoeReportPageMock(),
}));

describe('/talent-partner winoe-report route', () => {
  beforeEach(() => {
    winoeReportPageMock.mockClear();
  });

  it('renders the canonical talent partner route wrapper', async () => {
    const { default: CanonicalPage } =
      await import('@/app/(talent-partner)/talent-partner/trials/[id]/candidates/[candidateSessionId]/winoe-report/page');
    render(CanonicalPage());
    expect(screen.getByTestId('winoe-report-page')).toBeInTheDocument();
    expect(winoeReportPageMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the legacy dashboard wrapper available', async () => {
    const { default: LegacyPage } =
      await import('@/app/(talent-partner)/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report/page');
    render(LegacyPage());
    expect(screen.getByTestId('winoe-report-page')).toBeInTheDocument();
    expect(winoeReportPageMock).toHaveBeenCalledTimes(1);
  });
});
