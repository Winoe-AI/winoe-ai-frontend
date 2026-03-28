import { act } from '@testing-library/react';
import {
  buildHookProps,
  renderTaskSubmissionHarness,
  setupTaskSubmissionExtraTest,
  submitCandidateTaskMock,
  teardownTaskSubmissionExtraTest,
} from './useTaskSubmission.extra.testlib';

describe('useTaskSubmission extra behavior coverage', () => {
  beforeEach(() => {
    setupTaskSubmissionExtraTest();
    submitCandidateTaskMock.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    teardownTaskSubmissionExtraTest();
  });

  it.each([
    [{ id: 2, dayIndex: 2, type: 'design', title: 'Day2' }, undefined],
    [{ id: 3, dayIndex: 3, type: 'design', title: 'Day3' }, undefined],
    [{ id: 6, dayIndex: 4, type: 'debug', title: 'Debug' }, undefined],
    [{ id: 5, dayIndex: 1, type: 'text', title: 'Text' }, 'My answer'],
  ])('submits supported task mode %#', async (task, contentText) => {
    const props = buildHookProps();
    props.currentTask = { ...task, description: '' };
    const { ref } = renderTaskSubmissionHarness(props);
    await act(async () => {
      await ref.current?.handleSubmit(contentText ? { contentText } : {});
    });
    expect(submitCandidateTaskMock).toHaveBeenCalledWith({
      taskId: task.id,
      candidateSessionId: 11,
      contentText,
    });
  });

  it('clears previous refresh timer on successive submits', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 4,
      dayIndex: 2,
      type: 'code',
      title: 'Code',
      description: '',
    };
    const clearSpy = jest.spyOn(window, 'clearTimeout');
    const { ref } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({});
      await ref.current?.handleSubmit({});
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
