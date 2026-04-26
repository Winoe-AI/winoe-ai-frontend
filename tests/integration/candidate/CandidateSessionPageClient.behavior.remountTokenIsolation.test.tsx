import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  baseSession,
  fetchMock,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
  setSessionPath,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow remount and token isolation', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('keeps closed-day recorded submission link after same-token remount with pending fetch', async () => {
    let secondMount = false;
    setSessionPath('closed-token');
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/closed-token'))
        return jsonResponse(
          baseSession({
            candidateSessionId: 654,
            scheduledStartAt: '2000-01-01T14:00:00Z',
            candidateTimezone: 'UTC',
            status: 'not_started',
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2000-01-01T14:00:00Z',
                windowEndAt: '2000-01-01T22:00:00Z',
              },
            ],
            scheduleLockedAt: '1999-12-31T10:00:00Z',
            currentDayWindow: {
              dayIndex: 1,
              windowStartAt: '2000-01-01T14:00:00Z',
              windowEndAt: '2000-01-01T22:00:00Z',
              state: 'closed',
            },
          }),
        );
      if (path.includes('/candidate/session/654/current_task')) {
        if (secondMount) return new Promise<Response>(() => {});
        return jsonResponse({
          isComplete: false,
          completedTaskIds: [],
          currentTask: {
            id: 41,
            dayIndex: 1,
            type: 'design',
            title: 'Closed Task',
            description: 'Read-only prompt',
          },
        });
      }
      throw new Error(`Unexpected fetch ${path}`);
    });
    const user = userEvent.setup();
    const firstRender = renderSessionPage('closed-token');
    await user.click(
      await screen.findByRole('button', { name: /Start trial/i }),
    );
    await screen.findByText(/^Day closed$/i);
    window.localStorage.setItem(
      'winoe:candidate:recordedSubmission:654:41',
      JSON.stringify({
        submissionId: 901,
        submittedAt: '2026-03-07T07:10:00Z',
      }),
    );
    secondMount = true;
    firstRender.unmount();
    setSessionPath('closed-token');
    renderSessionPage('closed-token');
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /View recorded submission/i }),
      ).toHaveAttribute('href', '/api/submissions/901'),
    );
    expect(screen.getByText(/Submission recorded/i)).toBeInTheDocument();
  });

  it('does not hydrate persisted state from a different token route', async () => {
    sessionStorage.setItem(
      'winoe:candidate_session_v1',
      JSON.stringify({
        inviteToken: 'token-a',
        candidateSessionId: 111,
        bootstrap: {
          candidateSessionId: 111,
          status: 'in_progress',
          trial: { title: 'Token A Trial', role: 'Token A Role' },
          scheduledStartAt: '2099-01-01T14:00:00Z',
          candidateTimezone: 'UTC',
          dayWindows: [
            {
              dayIndex: 1,
              windowStartAt: '2099-01-01T14:00:00Z',
              windowEndAt: '2099-01-01T22:00:00Z',
            },
          ],
          currentDayWindow: {
            dayIndex: 1,
            windowStartAt: '2099-01-01T14:00:00Z',
            windowEndAt: '2099-01-01T22:00:00Z',
            state: 'open',
          },
        },
        started: true,
        taskState: {
          isComplete: false,
          completedTaskIds: [],
          currentTask: {
            id: 44,
            dayIndex: 1,
            type: 'design',
            title: 'Token A Task',
            description: 'Leaked prompt should not render',
          },
        },
      }),
    );
    setSessionPath('token-b');
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/token-b'))
        return jsonResponse(
          baseSession({
            candidateSessionId: 222,
            trial: { title: 'Token B Trial', role: 'Token B Role' },
          }),
        );
      if (path.endsWith('/candidate/session/222/current_task'))
        return jsonResponse({
          isComplete: false,
          completedTaskIds: [],
          currentTask: null,
        });
      throw new Error(`Unexpected fetch ${path}`);
    });
    renderSessionPage('token-b');
    expect(screen.queryByText('Token A Task')).not.toBeInTheDocument();
    expect(screen.queryByText('Token A Trial')).not.toBeInTheDocument();
    await screen.findByText(/Pick your start date/i);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('/candidate/session/111/current_task'),
      ),
    ).toBe(false);
    const persisted = JSON.parse(
      sessionStorage.getItem('winoe:candidate_session_v1') ?? '{}',
    );
    expect(persisted.inviteToken).not.toBe('token-a');
  });
});
