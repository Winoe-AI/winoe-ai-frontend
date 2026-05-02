import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useTaskAutoload } from '@/features/candidate/session/hooks/useTaskAutoload';

const fetchCurrentTaskMock = jest.fn();

const baseState = (
  overrides: Partial<Parameters<typeof useTaskAutoload>[0]['state']> = {},
) =>
  ({
    candidateSessionId: 1,
    started: true,
    bootstrap: {
      status: 'in_progress',
      currentDayWindow: {
        dayIndex: 4,
        windowStartAt: '2026-05-03T12:45:00Z',
        windowEndAt: '2026-05-03T14:00:00Z',
        state: 'active',
      },
    },
    taskState: {
      loading: false,
      error: null,
      isComplete: false,
      completedAt: null,
      completedTaskIds: [1, 2, 3, 4],
      currentTask: {
        id: 4,
        dayIndex: 4,
        title: 'Handoff + Demo',
        type: 'handoff',
        description: 'Demo',
        recordedSubmission: null,
        cutoffCommitSha: null,
        cutoffAt: null,
      },
    },
    ...overrides,
  }) as Parameters<typeof useTaskAutoload>[0]['state'];

function HookHarness(props: Parameters<typeof useTaskAutoload>[0]) {
  useTaskAutoload(props);
  return null;
}

describe('useTaskAutoload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes a stale persisted task when the bootstrap day has advanced', async () => {
    const setView = jest.fn();
    const setErrorMessage = jest.fn();
    fetchCurrentTaskMock.mockResolvedValue(undefined);
    render(
      <HookHarness
        view="running"
        state={baseState({
          bootstrap: {
            status: 'in_progress',
            currentDayWindow: {
              dayIndex: 5,
              windowStartAt: '2026-05-04T12:45:00Z',
              windowEndAt: '2026-05-04T14:00:00Z',
              state: 'active',
            },
          },
        })}
        fetchCurrentTask={fetchCurrentTaskMock}
        setErrorMessage={setErrorMessage}
        setView={setView}
      />,
    );

    await waitFor(() => expect(fetchCurrentTaskMock).toHaveBeenCalledTimes(1));
    expect(setView).toHaveBeenCalledWith(expect.any(Function));
    expect(setErrorMessage).toHaveBeenCalledTimes(0);
  });

  it('does not refetch when the persisted task matches the active bootstrap day', () => {
    const setView = jest.fn();
    const setErrorMessage = jest.fn();
    fetchCurrentTaskMock.mockResolvedValue(undefined);
    render(
      <HookHarness
        view="running"
        state={baseState({
          bootstrap: {
            status: 'in_progress',
            currentDayWindow: {
              dayIndex: 4,
              windowStartAt: '2026-05-03T12:45:00Z',
              windowEndAt: '2026-05-03T14:00:00Z',
              state: 'active',
            },
          },
        })}
        fetchCurrentTask={fetchCurrentTaskMock}
        setErrorMessage={setErrorMessage}
        setView={setView}
      />,
    );

    expect(fetchCurrentTaskMock).not.toHaveBeenCalled();
    expect(setView).not.toHaveBeenCalled();
    expect(setErrorMessage).not.toHaveBeenCalled();
  });
});
