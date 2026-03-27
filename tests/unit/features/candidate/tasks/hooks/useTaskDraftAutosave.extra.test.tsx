import { act, waitFor } from '@testing-library/react';
import {
  getCandidateTaskDraftMock,
  putCandidateTaskDraftMock,
  resetDraftAutosaveMocks,
  setupHook,
} from './useTaskDraftAutosave.testlib';

describe('useTaskDraftAutosave edge cases', () => {
  beforeEach(() => {
    resetDraftAutosaveMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('locks autosave after TASK_WINDOW_CLOSED and does not retry-loop', async () => {
    const onTaskWindowClosed = jest.fn();
    putCandidateTaskDraftMock.mockRejectedValue({
      status: 409,
      details: {
        errorCode: 'TASK_WINDOW_CLOSED',
        windowStartAt: '2026-03-08T10:00:00.000Z',
        windowEndAt: '2026-03-08T18:00:00.000Z',
      },
    });

    const { result, rerender } = setupHook({ value: '', onTaskWindowClosed });
    rerender({ value: 'first edit', onTaskWindowClosed });
    await act(async () => jest.advanceTimersByTime(1500));

    await waitFor(() => expect(onTaskWindowClosed).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe('disabled');
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);

    rerender({ value: 'second edit', onTaskWindowClosed });
    await act(async () => jest.advanceTimersByTime(3000));
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('restores in precedence order: submitted > draft > empty', async () => {
    const onRestore = jest.fn();

    const finalized = setupHook({
      value: '',
      hasFinalizedContent: true,
      onRestore,
    });
    await act(async () => Promise.resolve());
    expect(getCandidateTaskDraftMock).toHaveBeenCalledTimes(0);
    expect(onRestore).toHaveBeenCalledTimes(0);
    finalized.unmount();

    getCandidateTaskDraftMock.mockResolvedValueOnce({
      taskId: 10,
      contentText: 'server draft',
      contentJson: null,
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    const withDraft = setupHook({ value: '', onRestore });
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith('server draft'));
    withDraft.unmount();

    getCandidateTaskDraftMock.mockResolvedValueOnce({
      taskId: 10,
      contentText: '',
      contentJson: null,
      updatedAt: '2026-03-07T09:30:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    const emptyDraft = setupHook({
      value: '',
      onRestore,
      deserialize: () => null,
    });
    await act(async () => Promise.resolve());
    expect(onRestore).toHaveBeenCalledTimes(1);
    emptyDraft.unmount();
  });
});
