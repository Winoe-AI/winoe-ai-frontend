import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  baseSession,
  fetchMock,
  fillScheduleAndContinue,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
  sampleWindows,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow schedule success', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('shows scheduling flow, confirms schedule, and renders locked windows', async () => {
    let scheduleRequestBody: Record<string, unknown> | null = null;
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token'))
          return jsonResponse(baseSession());
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          scheduleRequestBody = init?.body
            ? (JSON.parse(String(init.body)) as Record<string, unknown>)
            : null;
          return jsonResponse(
            baseSession({
              scheduledStartAt: '2099-01-01T14:00:00Z',
              candidateTimezone: 'America/New_York',
              githubUsername: 'octocat',
              dayWindows: sampleWindows,
              scheduleLockedAt: '2098-12-01T14:00:00Z',
            }),
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );

    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await fillScheduleAndContinue(user);
    expect(
      await screen.findByText(/5-day schedule preview/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));
    expect(scheduleRequestBody).toMatchObject({
      scheduledStartAt: '2099-01-01T14:00:00Z',
      candidateTimezone: 'America/New_York',
      githubUsername: 'octocat',
    });
    expect(
      await screen.findByText(/Trial locked until start/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(screen.queryByText(/Start trial/i)).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/current_task'),
      ),
    ).toBeUndefined();
  });
});
