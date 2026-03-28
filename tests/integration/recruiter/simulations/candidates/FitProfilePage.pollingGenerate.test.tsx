import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderFitProfilePage,
  resetFitProfileTest,
  setFetchForFitProfile,
  textResponse,
} from './FitProfilePage.testlib';

describe('FitProfilePage polling and generate flow', () => {
  beforeEach(() => resetFitProfileTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('handles 409 polling transition to ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    setFetchForFitProfile(async (url) => {
      if (url !== '/api/candidate_sessions/2/fit_profile')
        return textResponse('Not found', 404);
      getCalls += 1;
      return getCalls === 1
        ? jsonResponse({ message: 'not ready' }, 409)
        : jsonResponse(READY_PAYLOAD);
    });
    renderFitProfilePage();
    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() => expect(screen.getByText('78%')).toBeInTheDocument());
  });

  it('triggers POST generate then renders ready view', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    const fetchMock = setFetchForFitProfile(async (url, init) => {
      if (
        url === '/api/candidate_sessions/2/fit_profile' &&
        (!init?.method || init.method === 'GET')
      ) {
        getCalls += 1;
        if (getCalls === 1) return jsonResponse({ status: 'not_started' });
        if (getCalls === 2) return jsonResponse({ status: 'running' });
        return jsonResponse(READY_PAYLOAD);
      }
      if (
        url === '/api/candidate_sessions/2/fit_profile/generate' &&
        init?.method === 'POST'
      )
        return jsonResponse({ jobId: 'job-1', status: 'queued' }, 202);
      return textResponse('Not found', 404);
    });
    renderFitProfilePage();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(
      await screen.findByRole('button', { name: /Generate Fit Profile/i }),
    );
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          String(call[0]).includes('/fit_profile/generate') &&
          (call[1] as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(true);
    await waitFor(() => expect(getCalls).toBeGreaterThanOrEqual(2));
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() => expect(screen.getByText('78%')).toBeInTheDocument());
  });

  it('handles POST 409 generate by polling existing run until ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;
    setFetchForFitProfile(async (url, init) => {
      if (
        url === '/api/candidate_sessions/2/fit_profile' &&
        (!init?.method || init.method === 'GET')
      ) {
        getCalls += 1;
        if (getCalls === 1) return jsonResponse({ status: 'not_started' });
        if (getCalls === 2) return jsonResponse({ status: 'running' });
        return jsonResponse(READY_PAYLOAD);
      }
      if (
        url === '/api/candidate_sessions/2/fit_profile/generate' &&
        init?.method === 'POST'
      )
        return textResponse('Already running', 409);
      return textResponse('Not found', 404);
    });
    renderFitProfilePage();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(
      await screen.findByRole('button', { name: /Generate Fit Profile/i }),
    );
    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(10200);
    });
    await waitFor(() => expect(screen.getByText('78%')).toBeInTheDocument());
  });

  it('cleans up polling timer on unmount', async () => {
    jest.useFakeTimers();
    const fetchMock = setFetchForFitProfile(async (url) =>
      url === '/api/candidate_sessions/2/fit_profile'
        ? jsonResponse({ message: 'still generating' }, 409)
        : textResponse('Not found', 404),
    );
    const { unmount } = renderFitProfilePage();
    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();
    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
