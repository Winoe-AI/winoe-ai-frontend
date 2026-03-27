import { act, waitFor } from '@testing-library/react';
import {
  buildHookProps,
  renderTaskSubmissionHarness,
  setupTaskSubmissionExtraTest,
  submitCandidateTaskMock,
  teardownTaskSubmissionExtraTest,
} from './useTaskSubmission.extra.testlib';

describe('useTaskSubmission error handling', () => {
  beforeEach(() => {
    setupTaskSubmissionExtraTest();
  });

  afterEach(() => {
    teardownTaskSubmissionExtraTest();
  });

  it('wraps submit errors and notifies', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 3,
      dayIndex: 1,
      type: 'design',
      title: 'Design',
      description: '',
    };
    submitCandidateTaskMock.mockImplementation(() =>
      Promise.reject({ status: 409 }),
    );
    const { ref } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'body' }).catch(() => {});
    });

    await waitFor(() => {
      expect(submitCandidateTaskMock).toHaveBeenCalled();
      expect(props.setTaskError).toHaveBeenCalled();
    });
  });

  it('maps TASK_WINDOW_CLOSED to callback and comeback copy', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 8,
      dayIndex: 2,
      type: 'code',
      title: 'Code',
      description: '',
    };
    submitCandidateTaskMock.mockImplementation(() =>
      Promise.reject({
        status: 409,
        details: {
          errorCode: 'TASK_WINDOW_CLOSED',
          detail: 'Task is closed outside the scheduled window.',
          details: {
            windowStartAt: '2099-01-03T14:00:00Z',
            windowEndAt: '2099-01-03T22:00:00Z',
            nextOpenAt: '2099-01-03T14:00:00Z',
          },
        },
      }),
    );
    const { ref } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'body' }).catch(() => {});
    });

    await waitFor(() => {
      expect(props.onTaskWindowClosed).toHaveBeenCalledTimes(1);
      expect(props.setTaskError).toHaveBeenCalledWith(
        expect.stringMatching(/come back at/i),
      );
    });
  });

  it.each([
    { status: 401, message: 'Please sign in again.' },
    {
      status: 403,
      message: 'We could not confirm your email. Please sign in again.',
    },
  ])('does not map non-window auth error %#', async ({ status, message }) => {
    const props = buildHookProps();
    props.currentTask = {
      id: 9,
      dayIndex: 1,
      type: 'design',
      title: 'Design',
      description: '',
    };
    submitCandidateTaskMock.mockImplementation(() =>
      Promise.reject({ status, message }),
    );
    const { ref } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'body' }).catch(() => {});
    });

    expect(props.onTaskWindowClosed).not.toHaveBeenCalled();
  });

  it('clears pending refresh timer on unmount', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 5,
      dayIndex: 5,
      type: 'debug',
      title: 'Dbg',
      description: '',
    };
    submitCandidateTaskMock.mockResolvedValue({ ok: true });
    const clearSpy = jest.spyOn(window, 'clearTimeout');
    const { ref, unmount } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'hi' });
    });

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
