import React, { forwardRef, useImperativeHandle } from 'react';
import { act, render } from '@testing-library/react';
import { useTaskLoader } from '@/features/candidate/session/hooks/useTaskLoader';

const getCandidateCurrentTaskMock = jest.fn();

jest.mock('@/features/candidate/session/api/tasksApi', () => ({
  getCandidateCurrentTask: (...args: unknown[]) =>
    getCandidateCurrentTaskMock(...args),
}));

type HookReturn = ReturnType<typeof useTaskLoader>;

const baseSession = () =>
  ({
    state: {
      bootstrap: {
        candidateSessionId: 9,
        status: 'in_progress',
        trial: { title: 'Sim', role: 'Backend' },
        dayWindows: [
          {
            dayIndex: 1,
            windowStartAt: '2026-03-10T13:00:00Z',
            windowEndAt: '2026-03-10T21:00:00Z',
          },
        ],
        currentDayWindow: {
          dayIndex: 1,
          windowStartAt: '2026-03-10T13:00:00Z',
          windowEndAt: '2026-03-10T21:00:00Z',
          state: 'closed',
        },
      },
    },
    setBootstrap: jest.fn(),
  }) as unknown as Parameters<typeof useTaskLoader>[0]['session'];

const baseProps = () => ({
  session: baseSession(),
  candidateSessionId: 9,
  clearTaskError: jest.fn(),
  setTaskLoading: jest.fn(),
  setTaskLoaded: jest.fn(),
  setTaskError: jest.fn(),
  markStart: jest.fn(),
  markEnd: jest.fn(),
});

const HookHarness = forwardRef<HookReturn, ReturnType<typeof baseProps>>(
  (props, ref) => {
    const hook = useTaskLoader(props);
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  },
);
HookHarness.displayName = 'HookHarness';

describe('useTaskLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs the bootstrap currentDayWindow and authoritative completedAt from the task response', async () => {
    const props = baseProps();
    const ref = React.createRef<HookReturn>();
    getCandidateCurrentTaskMock.mockResolvedValue({
      isComplete: false,
      completedAt: '2026-05-05T13:00:00Z',
      completedTaskIds: [1],
      currentTask: {
        id: 2,
        dayIndex: 2,
        type: 'code',
        title: 'Feature Implementation',
        description: 'Implement the feature',
      },
      currentWindow: {
        windowStartAt: '2026-03-11T13:00:00Z',
        windowEndAt: '2026-03-11T21:00:00Z',
        nextOpenAt: null,
        isOpen: true,
        now: '2026-03-11T14:00:00Z',
      },
    });

    render(<HookHarness ref={ref} {...props} />);
    await act(async () => {
      await ref.current?.fetchCurrentTask();
    });

    expect(props.session.setBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({
        completedAt: '2026-05-05T13:00:00Z',
        currentDayWindow: {
          dayIndex: 2,
          windowStartAt: '2026-03-11T13:00:00Z',
          windowEndAt: '2026-03-11T21:00:00Z',
          state: 'active',
        },
      }),
    );
  });

  it('preserves an existing bootstrap completedAt when the refreshed task omits one', async () => {
    const props = baseProps();
    props.session.state.bootstrap = {
      ...props.session.state.bootstrap,
      completedAt: '2026-05-05T13:00:00Z',
    };
    const ref = React.createRef<HookReturn>();
    getCandidateCurrentTaskMock.mockResolvedValue({
      isComplete: true,
      completedAt: null,
      completedTaskIds: [1, 2, 3, 4, 5],
      currentTask: null,
      currentWindow: null,
    });

    render(<HookHarness ref={ref} {...props} />);
    await act(async () => {
      await ref.current?.fetchCurrentTask();
    });

    expect(props.session.setBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({
        completedAt: '2026-05-05T13:00:00Z',
      }),
    );
  });
});
