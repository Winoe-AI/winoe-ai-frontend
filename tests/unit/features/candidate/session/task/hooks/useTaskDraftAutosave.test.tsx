import { act, renderHook, waitFor } from '@testing-library/react';
import { useTaskDraftAutosave } from '@/features/candidate/session/task/hooks/useTaskDraftAutosave';
import type { CandidateTaskDraft } from '@/features/candidate/api';

const getCandidateTaskDraftMock = jest.fn();
const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/api', () => {
  const actual = jest.requireActual('@/features/candidate/api');
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      getCandidateTaskDraftMock(...args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      putCandidateTaskDraftMock(...args),
  };
});

type HookProps = {
  value: string;
  isEditable?: boolean;
  hasFinalizedContent?: boolean;
  deserialize?: (draft: CandidateTaskDraft) => string | null;
  onRestore?: (value: string) => void;
  onTaskWindowClosed?: (err: unknown) => void;
};

function setupHook({
  value,
  isEditable = true,
  hasFinalizedContent = false,
  deserialize,
  onRestore,
  onTaskWindowClosed,
}: HookProps) {
  return renderHook(
    (props: HookProps) =>
      useTaskDraftAutosave<string>({
        taskId: 10,
        candidateSessionId: 44,
        isEditable: props.isEditable ?? true,
        hasFinalizedContent: props.hasFinalizedContent ?? false,
        value: props.value,
        serialize: (next) => ({ contentText: next }),
        deserialize:
          props.deserialize ?? ((draft) => draft.contentText ?? null),
        onRestore: props.onRestore ?? jest.fn(),
        onTaskWindowClosed: props.onTaskWindowClosed,
      }),
    {
      initialProps: {
        value,
        isEditable,
        hasFinalizedContent,
        deserialize,
        onRestore,
        onTaskWindowClosed,
      },
    },
  );
}

describe('useTaskDraftAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getCandidateTaskDraftMock.mockResolvedValue(null);
    putCandidateTaskDraftMock.mockResolvedValue({
      taskId: 10,
      updatedAt: '2026-03-07T10:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces autosave around 1.5s after edits', async () => {
    const { rerender } = setupHook({ value: '' });

    await waitFor(() => {
      expect(getCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
    });

    rerender({ value: 'draft v1' });
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(0);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('flushes on visibilitychange hidden', async () => {
    const { rerender } = setupHook({ value: '' });
    rerender({ value: 'flush hidden' });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('flushes on beforeunload', async () => {
    const { rerender } = setupHook({ value: '' });
    rerender({ value: 'flush unload' });

    await act(async () => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('does not autosave when not editable', async () => {
    const { rerender } = setupHook({ value: '', isEditable: false });
    rerender({ value: 'should not save', isEditable: false });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
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

    const { result, rerender } = setupHook({
      value: '',
      onTaskWindowClosed,
    });

    rerender({ value: 'first edit', onTaskWindowClosed });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(onTaskWindowClosed).toHaveBeenCalledTimes(1);
    });
    expect(result.current.status).toBe('disabled');
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);

    rerender({ value: 'second edit', onTaskWindowClosed });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('enforces precedence submitted > draft > empty during restore', async () => {
    const restore = jest.fn();

    const finalized = setupHook({
      value: '',
      hasFinalizedContent: true,
      onRestore: restore,
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(getCandidateTaskDraftMock).toHaveBeenCalledTimes(0);
    expect(restore).toHaveBeenCalledTimes(0);
    finalized.unmount();

    getCandidateTaskDraftMock.mockResolvedValueOnce({
      taskId: 10,
      contentText: 'server draft',
      contentJson: null,
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    const withDraft = setupHook({ value: '', onRestore: restore });
    await waitFor(() => {
      expect(restore).toHaveBeenCalledWith('server draft');
    });
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
      onRestore: restore,
      deserialize: () => null,
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(restore).toHaveBeenCalledTimes(1);
    emptyDraft.unmount();
  });
});
