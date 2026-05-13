import { act, renderHook } from '@testing-library/react';
import { useScheduleConfirmAction } from '@/features/candidate/session/hooks/controller/useScheduleConfirmAction';

const submitCandidateScheduleMock = jest.fn();

jest.mock(
  '@/features/candidate/session/hooks/controller/useSubmitCandidateSchedule',
  () => ({
    submitCandidateSchedule: (...args: unknown[]) =>
      submitCandidateScheduleMock(...args),
  }),
);

describe('useScheduleConfirmAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks the UI immediately after a successful schedule save', async () => {
    submitCandidateScheduleMock.mockResolvedValue({
      candidateSessionId: 1,
      scheduleLockedAt: '2099-01-01T14:00:00Z',
      scheduledStartAt: '2099-01-01T14:00:00Z',
      candidateTimezone: 'America/New_York',
      githubUsername: 'octocat',
      dayWindows: [],
      currentDayWindow: null,
    });

    const setView = jest.fn();
    const markEnd = jest.fn();
    const markStart = jest.fn();
    const runInit = jest.fn();
    const redirectToLogin = jest.fn();
    const setErrorStatus = jest.fn();
    const setErrorMessage = jest.fn();
    const setScheduleSubmitError = jest.fn();
    const setScheduleTimezoneError = jest.fn();
    const setScheduleDateError = jest.fn();
    const clearScheduleErrors = jest.fn();
    const session = { setBootstrap: jest.fn() } as never;

    const { result } = renderHook(() =>
      useScheduleConfirmAction({
        token: 'invite-token',
        bootstrap: {
          candidateSessionId: 1,
          status: 'not_started',
          trial: { title: 'Trial', role: 'Backend Engineer' },
          aiNoticeText: 'Notice',
          aiNoticeVersion: 'mvp1',
          evalEnabledByDay: {},
        },
        setView,
        runInit,
        markStart,
        markEnd,
        redirectToLogin,
        setErrorStatus,
        setErrorMessage,
        session,
        scheduleDateValue: '2099-01-01',
        scheduleTimezoneValue: 'America/New_York',
        scheduleGithubUsernameValue: 'octocat',
        validateForm: () => true,
        clearScheduleErrors,
        setScheduleSubmitError,
        setScheduleTimezoneError,
        setScheduleDateError,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(submitCandidateScheduleMock).toHaveBeenCalledTimes(1);
    expect(setView).toHaveBeenCalledWith('locked');
    expect(markEnd).toHaveBeenCalledWith('candidate:schedule:submit', {
      status: 'locked',
    });
    expect(setScheduleSubmitError).toHaveBeenCalledWith(null);
    expect(setView).not.toHaveBeenCalledWith('running');
  });
});
