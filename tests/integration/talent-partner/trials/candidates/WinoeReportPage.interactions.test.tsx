import { screen, waitFor } from '@testing-library/react';
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
      (await screen.findAllByRole('button', { name: /Download PDF/i }))[0],
    );
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('keeps the share modal open when clicking inside and closes from the close button', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse(READY_PAYLOAD)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /Share with team/i }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Share this report/i,
    });
    await user.click(
      screen.getByText(/Secure team sharing is not enabled yet/i),
    );
    expect(dialog).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Close share this report/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Share this report/i }),
      ).not.toBeInTheDocument(),
    );
  });
});
