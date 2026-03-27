import { callCompat, canCallCompatFn, resolveCompat } from './candidateApiCompatUtils';

jest.mock('@/features/candidate/api/invites', () => {
  const actual = jest.requireActual('@/features/candidate/api/invites') as Record<string, unknown>;
  return {
    ...actual,
    listCandidateInvites: (...args: unknown[]) => callCompat(actual, 'listCandidateInvites', args),
    resolveCandidateInviteToken: (...args: unknown[]) => callCompat(actual, 'resolveCandidateInviteToken', args),
  };
});

jest.mock('@/features/candidate/api/tasks', () => {
  const actual = jest.requireActual('@/features/candidate/api/tasks') as Record<string, unknown>;
  return {
    ...actual,
    getCandidateCurrentTask: (...args: unknown[]) => callCompat(actual, 'getCandidateCurrentTask', args),
    submitCandidateTask: (...args: unknown[]) => callCompat(actual, 'submitCandidateTask', args),
  };
});

jest.mock('@/features/candidate/api/schedule', () => {
  const actual = jest.requireActual('@/features/candidate/api/schedule') as { scheduleCandidateSession: (...a: unknown[]) => unknown };
  return {
    ...actual,
    scheduleCandidateSession: (...args: unknown[]) => {
      const fn = resolveCompat().scheduleCandidateSession;
      if (canCallCompatFn(fn)) return fn(...args);
      return actual.scheduleCandidateSession(...args);
    },
  };
});

jest.mock('@/features/candidate/api/tests', () => {
  const actual = jest.requireActual('@/features/candidate/api/tests') as Record<string, unknown>;
  return {
    ...actual,
    startCandidateTestRun: (...args: unknown[]) => callCompat(actual, 'startCandidateTestRun', args),
    pollCandidateTestRun: (...args: unknown[]) => callCompat(actual, 'pollCandidateTestRun', args),
  };
});

jest.mock('@/features/candidate/api/taskDrafts', () => {
  const actual = jest.requireActual('@/features/candidate/api/taskDrafts') as Record<string, unknown>;
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) => callCompat(actual, 'getCandidateTaskDraft', args),
    putCandidateTaskDraft: (...args: unknown[]) => callCompat(actual, 'putCandidateTaskDraft', args),
  };
});
