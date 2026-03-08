import React, { forwardRef, useImperativeHandle } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { useTaskSubmission } from '@/features/candidate/session/hooks/useTaskSubmission';

const submitCandidateTaskMock = jest.fn();
const notifyMock = jest.fn();
const normalizeApiErrorMock = jest.fn((err, fallback) => ({
  message: fallback ?? String(err),
}));

jest.mock('@/features/candidate/api', () => ({
  HttpError: class HttpError extends Error {
    status?: number;
    constructor(status?: number) {
      super('http');
      this.status = status;
    }
  },
  submitCandidateTask: (...args: unknown[]) => submitCandidateTaskMock(...args),
}));

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));

jest.mock('@/lib/errors/errors', () => ({
  __esModule: true,
  normalizeApiError: (...args: unknown[]) => normalizeApiErrorMock(...args),
}));

type HookReturn = ReturnType<typeof useTaskSubmission>;

type HarnessProps = {
  candidateSessionId: number | null;
  currentTask: {
    id: number;
    dayIndex: number;
    type: string;
    title: string;
    description: string;
  } | null;
  clearTaskError: jest.Mock;
  setTaskError: jest.Mock;
  refreshTask: jest.Mock;
  onTaskWindowClosed: jest.Mock;
  onSubmissionRecorded: jest.Mock;
};

const HookHarness = forwardRef<HookReturn, HarnessProps>(
  function HookHarness(props, ref) {
    const hook = useTaskSubmission(props);
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  },
);

describe('useTaskSubmission', () => {
  const baseProps = () => ({
    candidateSessionId: 11,
    currentTask: {
      id: 1,
      dayIndex: 1,
      type: 'design',
      title: 'Design',
      description: '',
    },
    clearTaskError: jest.fn(),
    setTaskError: jest.fn(),
    refreshTask: jest.fn(),
    onTaskWindowClosed: jest.fn(),
    onSubmissionRecorded: jest.fn(),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    normalizeApiErrorMock.mockImplementation((err, fallback) => ({
      message: (fallback as string) ?? String(err),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns early when required identifiers missing', async () => {
    const props = baseProps();
    props.candidateSessionId = null;
    const ref = React.createRef<HookReturn>();
    render(<HookHarness ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'hi' });
    });

    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it('requires non-empty text for non-GitHub tasks', async () => {
    const props = baseProps();
    const ref = React.createRef<HookReturn>();
    render(<HookHarness ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: '   ' });
    });

    expect(props.setTaskError).toHaveBeenCalledWith(
      'Please enter an answer before submitting.',
    );
    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it('submits code task, schedules refresh, and sends success toast', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 2,
      dayIndex: 2,
      type: 'code',
      title: 'Code',
      description: '',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockResolvedValue({ ok: true });

    render(<HookHarness ref={ref} {...props} />);

    let resp: unknown;
    await act(async () => {
      resp = await ref.current?.handleSubmit({});
    });
    expect(submitCandidateTaskMock).toHaveBeenCalledWith({
      taskId: 2,
      candidateSessionId: 11,
      contentText: undefined,
    });
    expect(resp).toEqual({ ok: true });
    expect(props.clearTaskError).toHaveBeenCalled();
    expect(props.onSubmissionRecorded).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'submit-2', tone: 'success' }),
    );

    jest.advanceTimersByTime(900);
    expect(props.refreshTask).toHaveBeenCalledWith({ skipCache: true });
  });

  it('records submission metadata when submit returns submission payload', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 12,
      dayIndex: 1,
      type: 'design',
      title: 'Design',
      description: '',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockResolvedValue({
      submissionId: 55,
      submittedAt: '2099-01-03T14:10:00Z',
    });

    render(<HookHarness ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'answer' });
    });

    expect(props.onSubmissionRecorded).toHaveBeenCalledWith({
      submissionId: 55,
      submittedAt: '2099-01-03T14:10:00Z',
    });
  });

  it('forwards day 5 reflection payload fields to submitCandidateTask', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Reflection',
      description: 'Structured reflection',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockResolvedValue({ ok: true });

    render(<HookHarness ref={ref} {...props} />);

    const payload = {
      contentText: '## Challenges\n...\n## Decisions\n...',
      reflection: {
        challenges: 'Handled ambiguity by validating assumptions early.',
        decisions:
          'Chose explicit contracts for predictable frontend handling.',
        tradeoffs:
          'Accepted stricter structure for consistent scoring quality.',
        communication: 'Shared progress, risks, and handoff context clearly.',
        next: 'Would add evaluator evidence links in follow-up.',
      },
    };

    await act(async () => {
      await ref.current?.handleSubmit(payload);
    });

    expect(submitCandidateTaskMock).toHaveBeenCalledWith({
      taskId: 15,
      candidateSessionId: 11,
      contentText: payload.contentText,
      reflection: payload.reflection,
    });
  });

  it('wraps submit errors and notifies', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 3,
      dayIndex: 1,
      type: 'design',
      title: 'Design',
      description: '',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockImplementation(() =>
      Promise.reject({ status: 409 }),
    );

    render(<HookHarness ref={ref} {...props} />);
    expect(ref.current).not.toBeNull();

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'body' }).catch(() => {});
    });

    await waitFor(() => {
      expect(submitCandidateTaskMock).toHaveBeenCalled();
      expect(props.setTaskError).toHaveBeenCalled();
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: 'error', title: 'Submission failed' }),
      );
    });
  });

  it('maps TASK_WINDOW_CLOSED to callback and friendly comeback copy', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 8,
      dayIndex: 2,
      type: 'code',
      title: 'Code',
      description: '',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockImplementation(() =>
      Promise.reject({
        status: 409,
        message: 'Task is closed outside the scheduled window.',
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

    render(<HookHarness ref={ref} {...props} />);
    expect(ref.current).not.toBeNull();

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
  ])(
    'does not map non-window auth error %s to TASK_WINDOW_CLOSED behavior',
    async ({ status, message }) => {
      const props = baseProps();
      props.currentTask = {
        id: 9,
        dayIndex: 1,
        type: 'design',
        title: 'Design',
        description: '',
      };
      const ref = React.createRef<HookReturn>();
      submitCandidateTaskMock.mockImplementation(() =>
        Promise.reject({ status, message }),
      );

      render(<HookHarness ref={ref} {...props} />);
      expect(ref.current).not.toBeNull();

      await act(async () => {
        await ref
          .current!.handleSubmit({ contentText: 'body' })
          .catch(() => {});
      });

      expect(submitCandidateTaskMock).toHaveBeenCalled();
      expect(props.onTaskWindowClosed).not.toHaveBeenCalled();
    },
  );

  it('clears pending refresh timer on unmount', async () => {
    const props = baseProps();
    props.currentTask = {
      id: 5,
      dayIndex: 5,
      type: 'debug',
      title: 'Dbg',
      description: '',
    };
    const ref = React.createRef<HookReturn>();
    submitCandidateTaskMock.mockResolvedValue({ ok: true });
    const clearSpy = jest.spyOn(window, 'clearTimeout');

    const { unmount } = render(<HookHarness ref={ref} {...props} />);

    await act(async () => ref.current?.handleSubmit({ contentText: 'hi' }));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
