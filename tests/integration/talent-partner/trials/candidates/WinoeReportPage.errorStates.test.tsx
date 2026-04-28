import { screen } from '@testing-library/react';
import {
  renderWinoeReportPage,
  resetWinoeReportTest,
  setFetchForWinoeReport,
  textResponse,
} from './WinoeReportPage.testlib';

describe('WinoeReportPage error states', () => {
  beforeEach(() => resetWinoeReportTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('winoe-report-print-mode');
  });

  it('maps 404 to not-generated panel', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? textResponse('Not found', 404)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(
      await screen.findByText(/Evaluation not found/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Generate Winoe Report/i }),
    ).toBeInTheDocument();
  });

  it('maps 403 to access denied panel', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? textResponse('Forbidden', 403)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(
      await screen.findByText(
        /Access denied\. You do not have permission to view this Winoe Report\./i,
      ),
    ).toBeInTheDocument();
  });

  it('maps generic request failures to error panel', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? textResponse('Internal Server Error', 500)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(
      await screen.findByText(/Unable to load Winoe Report/i),
    ).toBeInTheDocument();
  });
});
