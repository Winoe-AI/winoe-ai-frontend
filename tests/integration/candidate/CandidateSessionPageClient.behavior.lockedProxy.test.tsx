import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  baseSession,
  fetchMock,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow locked bootstrap and backend proxy', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('renders locked bootstrap state and blocks task autoload', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/locked-token')) {
        return jsonResponse(
          baseSession({
            candidateSessionId: 654,
            scheduledStartAt: '2099-01-01T14:00:00Z',
            candidateTimezone: 'America/New_York',
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2099-01-01T14:00:00Z',
                windowEndAt: '2099-01-01T22:00:00Z',
              },
            ],
            scheduleLockedAt: '2098-12-01T14:00:00Z',
          }),
        );
      }
      throw new Error(`Unexpected fetch ${path}`);
    });
    renderSessionPage('locked-token');
    expect(
      await screen.findByText(/Trial locked until start/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start trial/i })).toBeNull();
    expect(
      fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/current_task'),
      ),
    ).toBeUndefined();
  });

  it('loads trial through /api/backend proxy and then loads current task', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/candidate/session/valid-token')) {
        return jsonResponse(
          baseSession({
            scheduledStartAt: '2024-01-01T14:00:00Z',
            candidateTimezone: 'America/New_York',
            status: 'not_started',
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2024-01-01T14:00:00Z',
                windowEndAt: '2024-01-01T22:00:00Z',
              },
            ],
            scheduleLockedAt: '2023-12-31T12:00:00Z',
            currentDayWindow: {
              dayIndex: 1,
              windowStartAt: '2024-01-01T14:00:00Z',
              windowEndAt: '2024-01-01T22:00:00Z',
              state: 'closed',
            },
          }),
        );
      }
      if (String(url).includes('/current_task')) {
        return jsonResponse({
          isComplete: false,
          completedTaskIds: [],
          currentTask: {
            id: 10,
            dayIndex: 1,
            type: 'design',
            title: 'Task One',
            description: 'Do it',
          },
        });
      }
      throw new Error(`Unexpected fetch ${String(url)}`);
    });
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/valid-token',
      expect.objectContaining({ method: 'GET' }),
    );
    await user.click(
      await screen.findByRole('button', { name: /Start trial/i }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/backend/candidate/session/321/current_task',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-candidate-session-id': '321' }),
        }),
      ),
    );
    expect((await screen.findAllByText('Task One')).length).toBeGreaterThan(0);
  });
});
