import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';
import { renderCandidateWithProviders } from '../../setup';
import { jsonResponse } from '../../setup/responseHelpers';

const routerMock = {
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

const fetchMock = jest.fn();
const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  Object.values(routerMock).forEach((fn) => fn.mockReset());
  sessionStorage.clear();
  localStorage.clear();
});

afterAll(() => {
  global.fetch = realFetch;
});

describe('CandidateSessionPage (auth flow)', () => {
  it('shows scheduling flow, submits schedule, and renders locked windows', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token')) {
          return jsonResponse({
            candidateSessionId: 321,
            status: 'in_progress',
            simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
            scheduledStartAt: null,
            candidateTimezone: null,
            dayWindows: [],
            scheduleLockedAt: null,
            currentDayWindow: null,
          });
        }
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse({
            candidateSessionId: 321,
            scheduledStartAt: '2099-01-01T14:00:00Z',
            candidateTimezone: 'America/New_York',
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2099-01-01T14:00:00Z',
                windowEndAt: '2099-01-01T22:00:00Z',
              },
              {
                dayIndex: 2,
                windowStartAt: '2099-01-02T14:00:00Z',
                windowEndAt: '2099-01-02T22:00:00Z',
              },
              {
                dayIndex: 3,
                windowStartAt: '2099-01-03T14:00:00Z',
                windowEndAt: '2099-01-03T22:00:00Z',
              },
              {
                dayIndex: 4,
                windowStartAt: '2099-01-04T14:00:00Z',
                windowEndAt: '2099-01-04T22:00:00Z',
              },
              {
                dayIndex: 5,
                windowStartAt: '2099-01-05T14:00:00Z',
                windowEndAt: '2099-01-05T22:00:00Z',
              },
            ],
            scheduleLockedAt: '2098-12-01T14:00:00Z',
          });
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );

    const user = userEvent.setup();
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(
      await screen.findByText(/5-day schedule preview/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));

    expect(
      await screen.findByText(/Simulation locked until start/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(screen.queryByText(/Start simulation/i)).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/current_task'),
      ),
    ).toBeUndefined();
  });

  it('maps backend 422 timezone error to inline scheduling validation', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token')) {
          return jsonResponse({
            candidateSessionId: 321,
            status: 'in_progress',
            simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
            scheduledStartAt: null,
            candidateTimezone: null,
            dayWindows: [],
            scheduleLockedAt: null,
            currentDayWindow: null,
          });
        }
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse(
            {
              detail: 'Timezone is invalid.',
              errorCode: 'SCHEDULE_INVALID_TIMEZONE',
            },
            422,
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );

    const user = userEvent.setup();
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));

    expect(
      await screen.findByText(/Timezone is invalid\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
  });

  it('maps backend 422 start-in-past error to inline date validation', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token')) {
          return jsonResponse({
            candidateSessionId: 321,
            status: 'in_progress',
            simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
            scheduledStartAt: null,
            candidateTimezone: null,
            dayWindows: [],
            scheduleLockedAt: null,
            currentDayWindow: null,
          });
        }
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse(
            {
              detail: 'Start date is in the past.',
              errorCode: 'SCHEDULE_START_IN_PAST',
            },
            422,
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );

    const user = userEvent.setup();
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));

    expect(
      await screen.findByText(/Start date is in the past\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
  });

  it('redirects to login when schedule submit returns 401', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token')) {
          return jsonResponse({
            candidateSessionId: 321,
            status: 'in_progress',
            simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
            scheduledStartAt: null,
            candidateTimezone: null,
            dayWindows: [],
            scheduleLockedAt: null,
            currentDayWindow: null,
          });
        }
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse({ message: 'Not authenticated' }, 401);
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );

    const user = userEvent.setup();
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
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
          if (initCalls > 1) {
            return jsonResponse({
              candidateSessionId: 321,
              status: 'in_progress',
              simulation: {
                title: 'Infra Simulation',
                role: 'Backend Engineer',
              },
              scheduledStartAt: '2099-01-01T14:00:00Z',
              candidateTimezone: 'America/New_York',
              dayWindows: [
                {
                  dayIndex: 1,
                  windowStartAt: '2099-01-01T14:00:00Z',
                  windowEndAt: '2099-01-01T22:00:00Z',
                },
                {
                  dayIndex: 2,
                  windowStartAt: '2099-01-02T14:00:00Z',
                  windowEndAt: '2099-01-02T22:00:00Z',
                },
              ],
              scheduleLockedAt: '2098-12-01T14:00:00Z',
              currentDayWindow: null,
            });
          }

          return jsonResponse({
            candidateSessionId: 321,
            status: 'in_progress',
            simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
            scheduledStartAt: null,
            candidateTimezone: null,
            dayWindows: [],
            scheduleLockedAt: null,
            currentDayWindow: null,
          });
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
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));

    expect(
      await screen.findByText(/Simulation locked until start/i),
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

  it('renders locked state from bootstrap on initial load and blocks task autoload', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/locked-token')) {
        return jsonResponse({
          candidateSessionId: 654,
          status: 'in_progress',
          simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
          scheduledStartAt: '2099-01-01T14:00:00Z',
          candidateTimezone: 'America/New_York',
          dayWindows: [
            {
              dayIndex: 1,
              windowStartAt: '2099-01-01T14:00:00Z',
              windowEndAt: '2099-01-01T22:00:00Z',
            },
            {
              dayIndex: 2,
              windowStartAt: '2099-01-02T14:00:00Z',
              windowEndAt: '2099-01-02T22:00:00Z',
            },
            {
              dayIndex: 3,
              windowStartAt: '2099-01-03T14:00:00Z',
              windowEndAt: '2099-01-03T22:00:00Z',
            },
            {
              dayIndex: 4,
              windowStartAt: '2099-01-04T14:00:00Z',
              windowEndAt: '2099-01-04T22:00:00Z',
            },
            {
              dayIndex: 5,
              windowStartAt: '2099-01-05T14:00:00Z',
              windowEndAt: '2099-01-05T22:00:00Z',
            },
          ],
          scheduleLockedAt: '2098-12-01T14:00:00Z',
          currentDayWindow: null,
        });
      }
      throw new Error(`Unexpected fetch ${path}`);
    });

    renderCandidateWithProviders(<CandidateSessionPage token="locked-token" />);

    expect(
      await screen.findByText(/Simulation locked until start/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start simulation/i }),
    ).toBeNull();
    expect(screen.queryByText(/How code tasks work/i)).toBeNull();
    expect(screen.queryByText('Task One')).toBeNull();
    expect(
      fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/current_task'),
      ),
    ).toBeUndefined();
  });

  it('loads the simulation through /api/backend proxy', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/candidate/session/valid-token')) {
        return jsonResponse({
          candidateSessionId: 321,
          status: 'in_progress',
          simulation: { title: 'Infra Simulation', role: 'Backend Engineer' },
          scheduledStartAt: '2024-01-01T14:00:00Z',
          candidateTimezone: 'America/New_York',
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
        });
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
    sessionStorage.removeItem('tenon:candidate_session_v1');
    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/valid-token',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/321/current_task',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-candidate-session-id': '321',
        }),
      }),
    );

    const startBtn = await screen.findByRole('button', {
      name: /Start simulation/i,
    });
    await user.click(startBtn);

    const taskTitles = await screen.findAllByText('Task One');
    expect(taskTitles.length).toBeGreaterThan(0);
    const otpPath = ['verification', 'code'].join('/');
    expect(
      fetchMock.mock.calls.find(([url]) => String(url).includes(`/${otpPath}`)),
    ).toBeUndefined();
  });

  it('redirects to login when unauthenticated', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/candidate/session/valid-token')) {
        return jsonResponse({ message: 'Not authenticated' }, 401);
      }
      throw new Error(`Unexpected fetch ${String(url)}`);
    });

    renderCandidateWithProviders(<CandidateSessionPage token="valid-token" />);

    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?'),
      ),
    );
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith('/candidate/session/valid-token'),
      ),
    ).toHaveLength(1);
  });
});
