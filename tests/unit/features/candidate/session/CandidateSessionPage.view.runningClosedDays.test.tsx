import { act, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  primeViewApiMocks,
  resolveInviteMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.view.testlib';

describe('CandidateSessionPage view - running and closed-day recorded links', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    primeViewApiMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders running view with workspace and tests for day 2 code task', async () => {
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('run-tests-panel')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('workspace-panel')).toBeInTheDocument();
    expect(screen.getByTestId('task-view')).toHaveTextContent('Code Day');
    expect(resolveInviteMock).toHaveBeenCalled();
  });

  it('hydrates recorded submission reference from persisted storage', async () => {
    window.localStorage.setItem(
      'winoe:candidate:recordedSubmission:99:33',
      JSON.stringify({ submissionId: 77, submittedAt: '2026-03-05T17:10:00Z' }),
    );
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          bootstrap: {
            ...state.state.bootstrap,
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2000-01-01T14:00:00Z',
                windowEndAt: '2000-01-01T22:00:00Z',
              },
            ],
            currentDayWindow: {
              dayIndex: 1,
              windowStartAt: '2000-01-01T14:00:00Z',
              windowEndAt: '2000-01-01T22:00:00Z',
              state: 'closed',
            },
          },
          taskState: {
            ...state.state.taskState,
            currentTask: {
              id: 33,
              dayIndex: 1,
              type: 'design',
              title: 'Closed Day Task',
              description: 'Review only',
            },
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /view recorded submission/i }),
      ).toHaveAttribute('href', '/api/submissions/77'),
    );
    expect(screen.getByText(/Submission recorded/i)).toBeInTheDocument();
  });

  it('prefers canonical recorded submission over persisted fallback', async () => {
    window.localStorage.setItem(
      'winoe:candidate:recordedSubmission:99:33',
      JSON.stringify({ submissionId: 77, submittedAt: '2026-03-05T17:10:00Z' }),
    );
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          bootstrap: {
            ...state.state.bootstrap,
            dayWindows: [
              {
                dayIndex: 1,
                windowStartAt: '2000-01-01T14:00:00Z',
                windowEndAt: '2000-01-01T22:00:00Z',
              },
            ],
            currentDayWindow: {
              dayIndex: 1,
              windowStartAt: '2000-01-01T14:00:00Z',
              windowEndAt: '2000-01-01T22:00:00Z',
              state: 'closed',
            },
          },
          taskState: {
            ...state.state.taskState,
            currentTask: {
              id: 33,
              dayIndex: 1,
              type: 'design',
              title: 'Closed Day Task',
              description: 'Review only',
              recordedSubmission: {
                submissionId: 88,
                submittedAt: '2026-03-05T18:20:00Z',
              },
            },
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /view recorded submission/i }),
      ).toHaveAttribute('href', '/api/submissions/88'),
    );
  });
});
