import { act, renderHook } from '@testing-library/react';
import { useTaskSubmitControllerSaveAndSubmit } from '@/features/candidate/tasks/hooks/useTaskSubmitControllerSaveAndSubmit';
import type { SubmitResponse } from '@/features/candidate/tasks/types';

describe('useTaskSubmitControllerSaveAndSubmit', () => {
  const baseResponse: SubmitResponse = {
    submissionId: 7,
    taskId: 41,
    candidateSessionId: 99,
    submittedAt: '2025-01-01T00:00:00.000Z',
    progress: { completed: 3, total: 5 },
    isComplete: false,
    commitSha: 'commit-123',
    checkpointSha: 'checkpoint-456',
    finalSha: 'final-789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records coding submission metadata and clears drafts on success', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(baseResponse);
    const clearDrafts = jest.fn();
    const setRecordedCodingSubmission = jest.fn();
    const { result } = renderHook(() =>
      useTaskSubmitControllerSaveAndSubmit({
        taskId: 41,
        actionStatus: 'idle',
        disabled: false,
        githubNative: true,
        textTask: false,
        textRef: { current: '' },
        handleSubmit,
        clearDrafts,
        setRecordedCodingSubmission,
      }),
    );

    await act(async () => {
      await result.current.saveAndSubmit();
    });

    expect(handleSubmit).toHaveBeenCalledWith({});
    expect(setRecordedCodingSubmission).toHaveBeenCalledWith({
      taskId: 41,
      progress: baseResponse.progress,
      shaRefs: {
        checkpointSha: 'checkpoint-456',
        finalSha: 'final-789',
        commitSha: 'commit-123',
      },
    });
    expect(clearDrafts).toHaveBeenCalledTimes(1);
    expect(result.current.localError).toBeNull();
  });

  it('does not clear drafts when submit fails', async () => {
    const handleSubmit = jest.fn().mockResolvedValue('submit-failed');
    const clearDrafts = jest.fn();
    const setRecordedCodingSubmission = jest.fn();
    const { result } = renderHook(() =>
      useTaskSubmitControllerSaveAndSubmit({
        taskId: 41,
        actionStatus: 'idle',
        disabled: false,
        githubNative: true,
        textTask: false,
        textRef: { current: '' },
        handleSubmit,
        clearDrafts,
        setRecordedCodingSubmission,
      }),
    );

    await act(async () => {
      await result.current.saveAndSubmit();
    });

    expect(handleSubmit).toHaveBeenCalledWith({});
    expect(setRecordedCodingSubmission).not.toHaveBeenCalled();
    expect(clearDrafts).not.toHaveBeenCalled();
  });

  it('requires text before submitting a text task', async () => {
    const handleSubmit = jest.fn();
    const clearDrafts = jest.fn();
    const setRecordedCodingSubmission = jest.fn();
    const { result } = renderHook(() =>
      useTaskSubmitControllerSaveAndSubmit({
        taskId: 41,
        actionStatus: 'idle',
        disabled: false,
        githubNative: false,
        textTask: true,
        textRef: { current: '   ' },
        handleSubmit,
        clearDrafts,
        setRecordedCodingSubmission,
      }),
    );

    await act(async () => {
      await result.current.saveAndSubmit();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(clearDrafts).not.toHaveBeenCalled();
    expect(setRecordedCodingSubmission).not.toHaveBeenCalled();
    expect(result.current.localError).toBe(
      'Please enter an answer before submitting.',
    );
  });
});
