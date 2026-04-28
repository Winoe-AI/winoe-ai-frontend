import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderWinoeReportPage,
  resetWinoeReportTest,
  setFetchForWinoeReport,
  textResponse,
} from './WinoeReportPage.testlib';

describe('WinoeReportPage polling and generate flow', () => {
  beforeEach(() => resetWinoeReportTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('winoe-report-print-mode');
  });

  it('handles 409 polling transition to ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    setFetchForWinoeReport(async (url) => {
      if (url !== '/api/candidate_sessions/2/winoe_report')
        return textResponse('Not found', 404);
      getCalls += 1;
      return getCalls === 1
        ? jsonResponse({ message: 'not ready' }, 409)
        : jsonResponse(READY_PAYLOAD);
    });
    renderWinoeReportPage();
    expect(
      await screen.findByText(/Generating Winoe Report/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() =>
      expect(screen.getAllByText('78 / 100')).toHaveLength(2),
    );
  });

  it('triggers POST generate then renders ready view', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    const fetchMock = setFetchForWinoeReport(async (url, init) => {
      if (
        url === '/api/candidate_sessions/2/winoe_report' &&
        (!init?.method || init.method === 'GET')
      ) {
        getCalls += 1;
        if (getCalls === 1) return jsonResponse({ status: 'not_started' });
        if (getCalls === 2) return jsonResponse({ status: 'running' });
        return jsonResponse(READY_PAYLOAD);
      }
      if (
        url === '/api/candidate_sessions/2/winoe_report/generate' &&
        init?.method === 'POST'
      )
        return jsonResponse({ jobId: 'job-1', status: 'queued' }, 202);
      return textResponse('Not found', 404);
    });
    renderWinoeReportPage();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(
      await screen.findByRole('button', { name: /Generate Winoe Report/i }),
    );
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          String(call[0]).includes('/winoe_report/generate') &&
          (call[1] as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(true);
    await waitFor(() => expect(getCalls).toBeGreaterThanOrEqual(2));
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() =>
      expect(screen.getAllByText('78 / 100')).toHaveLength(2),
    );
  });

  it('handles POST 409 generate by polling existing run until ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    setFetchForWinoeReport(async (url, init) => {
      if (
        url === '/api/candidate_sessions/2/winoe_report' &&
        (!init?.method || init.method === 'GET')
      ) {
        getCalls += 1;
        if (getCalls === 1) return jsonResponse({ status: 'not_started' });
        if (getCalls === 2) return jsonResponse({ status: 'running' });
        return jsonResponse(READY_PAYLOAD);
      }
      if (
        url === '/api/candidate_sessions/2/winoe_report/generate' &&
        init?.method === 'POST'
      )
        return textResponse('Already running', 409);
      return textResponse('Not found', 404);
    });
    renderWinoeReportPage();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(
      await screen.findByRole('button', { name: /Generate Winoe Report/i }),
    );
    expect(
      await screen.findByText(/Generating Winoe Report/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() =>
      expect(screen.getAllByText('78 / 100')).toHaveLength(2),
    );
  });

  it('cleans up polling timer on unmount', async () => {
    jest.useFakeTimers();
    const fetchMock = setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse({ message: 'still generating' }, 409)
        : textResponse('Not found', 404),
    );
    const { unmount } = renderWinoeReportPage();
    expect(
      await screen.findByText(/Generating Winoe Report/i),
    ).toBeInTheDocument();
    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
