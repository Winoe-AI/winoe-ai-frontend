import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  baseSession,
  fetchMock,
  fillScheduleAndContinue,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
  routerMock,
  sampleWindows,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow schedule auth/conflict handling', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('redirects to login when schedule submit returns 401', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token'))
          return jsonResponse(baseSession());
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        )
          return jsonResponse({ message: 'Not authenticated' }, 401);
        throw new Error(`Unexpected fetch ${path}`);
      },
    );
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await fillScheduleAndContinue(user);
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?'),
      ),
    );
  });

  it('re-inits from backend truth when schedule submit returns 409 already set', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token')) {
          const initCalls = fetchMock.mock.calls.filter(([callUrl]) =>
            String(callUrl).endsWith('/candidate/session/valid-token'),
          ).length;
          return jsonResponse(
            initCalls > 1
              ? baseSession({
                  scheduledStartAt: '2099-01-01T14:00:00Z',
                  candidateTimezone: 'America/New_York',
                  dayWindows: sampleWindows,
                  scheduleLockedAt: '2098-12-01T14:00:00Z',
                })
              : baseSession(),
          );
        }
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse(
            {
              detail: 'Schedule already set.',
              errorCode: 'SCHEDULE_ALREADY_SET',
            },
            409,
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await fillScheduleAndContinue(user);
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));
    expect(
      await screen.findByText(/Trial locked until start/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Schedule already set/i)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) =>
          String(url).endsWith('/candidate/session/valid-token'),
        ),
      ).toHaveLength(2),
    );
  });
});
