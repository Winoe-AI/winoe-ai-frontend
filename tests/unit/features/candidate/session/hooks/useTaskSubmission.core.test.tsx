import { act } from '@testing-library/react';
import {
  buildHookProps,
  notifyMock,
  renderTaskSubmissionHarness,
  setupTaskSubmissionExtraTest,
  submitCandidateTaskMock,
  teardownTaskSubmissionExtraTest,
} from './useTaskSubmission.extra.testlib';

describe('useTaskSubmission core behavior', () => {
  beforeEach(() => {
    setupTaskSubmissionExtraTest();
  });

  afterEach(() => {
    teardownTaskSubmissionExtraTest();
  });

  it('returns early when required identifiers are missing', async () => {
    const props = buildHookProps();
    props.candidateSessionId = null;
    const mounted = renderTaskSubmissionHarness(props);
    await act(async () => {
      await mounted.ref.current?.handleSubmit({ contentText: 'hi' });
    });
    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it('requires non-empty text for non-GitHub tasks', async () => {
    const props = buildHookProps();
    const { ref } = renderTaskSubmissionHarness(props);
    await act(async () => {
      await ref.current?.handleSubmit({ contentText: '   ' });
    });
    expect(props.setTaskError).toHaveBeenCalledWith(
      'Please enter an answer before submitting.',
    );
    expect(submitCandidateTaskMock).not.toHaveBeenCalled();
  });

  it('submits code task and schedules refresh with success toast', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 2,
      dayIndex: 2,
      type: 'code',
      title: 'Code',
      description: '',
    };
    submitCandidateTaskMock.mockResolvedValue({ ok: true });
    const { ref } = renderTaskSubmissionHarness(props);

    let resp: unknown;
    await act(async () => {
      resp = await ref.current?.handleSubmit({});
    });

    expect(resp).toEqual({ ok: true });
    expect(submitCandidateTaskMock).toHaveBeenCalledWith({
      taskId: 2,
      candidateSessionId: 11,
      contentText: undefined,
    });
    expect(props.clearTaskError).toHaveBeenCalled();
    expect(props.onSubmissionRecorded).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'submit-2', tone: 'success' }),
    );
    jest.advanceTimersByTime(900);
    expect(props.refreshTask).toHaveBeenCalledWith({ skipCache: true });
  });

  it('records submission metadata and forwards day 5 reflection payloads', async () => {
    const props = buildHookProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Reflection',
      description: 'Structured reflection',
    };
    submitCandidateTaskMock
      .mockResolvedValueOnce({
        submissionId: 55,
        submittedAt: '2099-01-03T14:10:00Z',
      })
      .mockResolvedValueOnce({ ok: true });
    const { ref } = renderTaskSubmissionHarness(props);

    await act(async () => {
      await ref.current?.handleSubmit({ contentText: 'answer' });
      await ref.current?.handleSubmit({
        contentText: '## reflection',
        reflection: {
          challenges: 'a',
          decisions: 'b',
          tradeoffs: 'c',
          communication: 'd',
          next: 'e',
        },
      });
    });

    expect(props.onSubmissionRecorded).toHaveBeenCalledWith({
      submissionId: 55,
      submittedAt: '2099-01-03T14:10:00Z',
    });
    expect(submitCandidateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 15,
        reflection: expect.objectContaining({ challenges: 'a' }),
      }),
    );
  });
});
