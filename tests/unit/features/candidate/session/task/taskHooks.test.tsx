import { act, renderHook } from '@testing-library/react';
import { useTaskDrafts } from '@/features/candidate/session/task/hooks/taskHooks';

jest.useFakeTimers();

const saveTextDraft = jest.fn();
const loadTextDraft = jest.fn(() => 'cached');
const clearTextDraft = jest.fn();

jest.mock('@/features/candidate/session/task/utils/draftStorage', () => ({
  saveTextDraft: (...args: unknown[]) => saveTextDraft(...args),
  loadTextDraft: (...args: unknown[]) => loadTextDraft(...args),
  clearTextDraft: (...args: unknown[]) => clearTextDraft(...args),
}));

describe('useTaskDrafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  type MinimalTask = { id: number; type: 'design' | 'code'; dayIndex: number };

  it('saves drafts on debounce and clears for github native tasks', () => {
    const { result, rerender } = renderHook(
      (task: MinimalTask) => useTaskDrafts(task),
      {
        initialProps: { id: 1, type: 'design', dayIndex: 1 },
      },
    );

    act(() => {
      result.current.setText('hello');
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(saveTextDraft).toHaveBeenCalledWith(1, 'hello');

    rerender({ id: 2, type: 'code', dayIndex: 2 });
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(loadTextDraft).toHaveBeenCalled();
    expect(result.current.text).toBe('');
  });

  it('saveDraftNow sets savedAt and clears later, clearDrafts clears storage', () => {
    const { result } = renderHook(() =>
      useTaskDrafts({ id: 3, type: 'design', dayIndex: 1 }),
    );

    act(() => {
      result.current.saveDraftNow();
    });
    expect(saveTextDraft).toHaveBeenCalled();
    expect(result.current.savedAt).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(result.current.savedAt).toBeNull();

    act(() => {
      result.current.clearDrafts();
    });
    expect(clearTextDraft).toHaveBeenCalledWith(3);
  });
});
