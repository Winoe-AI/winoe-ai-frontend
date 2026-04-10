import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderWinoeReportPage,
  resetWinoeReportTest,
  setFetchForWinoeReport,
  textResponse,
} from './WinoeReportPage.testlib';

describe('WinoeReportPage interactions', () => {
  beforeEach(() => resetWinoeReportTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('winoe-report-print-mode');
  });

  it('wires print button to window.print', async () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse(READY_PAYLOAD)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /Print \/ Save PDF/i }),
    );
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
