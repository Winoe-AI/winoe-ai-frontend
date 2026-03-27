import { act, renderHook } from '@testing-library/react';
import { useSubmitHandler } from '@/features/candidate/tasks/hooks/useTaskHooks';

describe('useSubmitHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns busy when already submitting', async () => {
    const onSubmit = jest.fn(() => new Promise(() => {}));
    const { result, rerender } = renderHook(() => useSubmitHandler(onSubmit));
    act(() => {
      result.current.handleSubmit({});
    });
    rerender();
    let second: unknown;
    await act(async () => {
      second = await result.current.handleSubmit({});
    });
    expect(second).toEqual({ status: 'busy' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('sets submitted status then resets after timer', async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 1,
      taskId: 2,
      candidateSessionId: 3,
      submittedAt: 'now',
      progress: { completed: 2, total: 5 },
      isComplete: false,
    });
    const { result } = renderHook(() => useSubmitHandler(onSubmit));
    await act(async () => {
      await result.current.handleSubmit({});
    });
    expect(result.current.submitStatus).toBe('submitted');
    act(() => {
      jest.advanceTimersByTime(950);
    });
    expect(result.current.submitStatus).toBe('idle');
    expect(result.current.lastProgress).toBeNull();
    jest.useRealTimers();
  });

  it('sets idle when submit throws', async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useSubmitHandler(onSubmit));
    await act(async () => {
      const resp = await result.current.handleSubmit({});
      expect(resp).toBe('submit-failed');
    });
    expect(result.current.submitStatus).toBe('idle');
    jest.useRealTimers();
  });
});
