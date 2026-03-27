import { act, waitFor } from '@testing-library/react';
import {
  getCandidateTaskDraftMock,
  putCandidateTaskDraftMock,
  resetDraftAutosaveMocks,
  setupHook,
} from './useTaskDraftAutosave.testlib';

describe('useTaskDraftAutosave core behavior', () => {
  beforeEach(() => {
    resetDraftAutosaveMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces autosave around 1.5s after edits', async () => {
    const { rerender } = setupHook({ value: '' });
    await waitFor(() => expect(getCandidateTaskDraftMock).toHaveBeenCalledTimes(1));

    rerender({ value: 'draft v1' });
    await act(async () => jest.advanceTimersByTime(1400));
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(0);

    await act(async () => jest.advanceTimersByTime(100));
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('flushes pending draft on visibilitychange hidden', async () => {
    const { rerender } = setupHook({ value: '' });
    rerender({ value: 'flush hidden' });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('flushes pending draft on beforeunload', async () => {
    const { rerender } = setupHook({ value: '' });
    rerender({ value: 'flush unload' });

    await act(async () => window.dispatchEvent(new Event('beforeunload')));
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('does not autosave when task is not editable', async () => {
    const { rerender } = setupHook({ value: '', isEditable: false });
    rerender({ value: 'should not save', isEditable: false });

    await act(async () => jest.advanceTimersByTime(2000));
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
  });
});
