import {
  isCodeTask,
  isSubmitResponse,
  isTextTask,
} from '@/features/candidate/tasks/utils/taskGuardsUtils';

describe('taskGuards', () => {
  it('detects code vs text tasks', () => {
    expect(isCodeTask('code')).toBe(true);
    expect(isCodeTask('debug')).toBe(true);
    expect(isCodeTask('design')).toBe(false);

    expect(isTextTask('design')).toBe(true);
    expect(isTextTask('handoff')).toBe(true);
    expect(isTextTask('documentation')).toBe(true);
    expect(isTextTask('debug')).toBe(false);
  });

  it('validates submit response shape', () => {
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 'nope',
        candidateSessionId: 3,
        submittedAt: '2025-01-01',
        isComplete: false,
        progress: { completed: 1, total: 5 },
      }),
    ).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 3,
        submittedAt: '2025-01-01',
        isComplete: false,
        progress: { completed: 1, total: 5 },
      }),
    ).toBe(true);

    expect(
      isSubmitResponse({ submissionId: 'bad', progress: { completed: 1 } }),
    ).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 3,
        submittedAt: '2025-01-01',
        isComplete: false,
        progress: { completed: 1, total: 'x' },
      }),
    ).toBe(false);
    expect(isSubmitResponse(null)).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 'oops',
        submittedAt: '2025-01-01',
        isComplete: false,
        progress: { completed: 1, total: 5 },
      }),
    ).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 3,
        submittedAt: 123,
        isComplete: false,
        progress: { completed: 1, total: 5 },
      }),
    ).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 3,
        submittedAt: '2025-01-01',
        isComplete: 'nope',
        progress: { completed: 1, total: 5 },
      }),
    ).toBe(false);
    expect(
      isSubmitResponse({
        submissionId: 1,
        taskId: 2,
        candidateSessionId: 3,
        submittedAt: '2025-01-01',
        isComplete: false,
        progress: null,
      }),
    ).toBe(false);
  });
});
