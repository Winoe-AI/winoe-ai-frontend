import { act } from '@testing-library/react';
import {
  buildHookProps,
  renderTaskSubmissionHarness,
  setupTaskSubmissionExtraTest,
  submitCandidateTaskMock,
  teardownTaskSubmissionExtraTest,
} from './useTaskSubmission.extra.testlib';

describe('useTaskSubmission extra validation coverage', () => {
  beforeEach(() => {
    setupTaskSubmissionExtraTest();
  });

  afterEach(() => {
    teardownTaskSubmissionExtraTest();
  });

  it('returns early when candidateSessionId is null', async () => {
    const props = buildHookProps();
    props.candidateSessionId = null;
    const { ref } = renderTaskSubmissionHarness(props);
    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'hi' });
    });
    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it('returns early when currentTask is null', async () => {
    const props = buildHookProps();
    props.currentTask = null;
    const { ref } = renderTaskSubmissionHarness(props);
    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'hi' });
    });
    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it.each([{ contentText: '' }, {}])(
    'requires text content for day 1 design tasks %#',
    async (payload) => {
      const props = buildHookProps();
      props.currentTask = {
        id: 7,
        dayIndex: 1,
        type: 'design',
        title: 'Design',
        description: '',
      };
      const { ref } = renderTaskSubmissionHarness(props);
      await act(async () => {
        await ref.current?.handleSubmit(payload);
      });
      expect(props.setTaskError).toHaveBeenCalledWith(
        'Please enter an answer before submitting.',
      );
      expect(submitCandidateTaskMock).not.toHaveBeenCalled();
    },
  );

  it('does not clear timer on unmount when no timer was set', () => {
    const clearSpy = jest.spyOn(window, 'clearTimeout');
    const { unmount } = renderTaskSubmissionHarness();
    unmount();
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
