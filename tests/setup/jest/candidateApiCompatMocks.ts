import {
  callCompat,
  canCallCompatFn,
  resolveCompat,
} from './candidateApiCompatUtils';

jest.mock('@/features/candidate/session/api/invitesApi', () => {
  const actual = jest.requireActual(
    '@/features/candidate/session/api/invitesApi',
  ) as Record<string, unknown>;
  return {
    ...actual,
    listCandidateInvites: (...args: unknown[]) =>
      callCompat(actual, 'listCandidateInvites', args),
    resolveCandidateInviteToken: (...args: unknown[]) =>
      callCompat(actual, 'resolveCandidateInviteToken', args),
  };
});

jest.mock('@/features/candidate/session/api/tasksApi', () => {
  const actual = jest.requireActual(
    '@/features/candidate/session/api/tasksApi',
  ) as Record<string, unknown>;
  return {
    ...actual,
    getCandidateCurrentTask: (...args: unknown[]) =>
      callCompat(actual, 'getCandidateCurrentTask', args),
    submitCandidateTask: (...args: unknown[]) =>
      callCompat(actual, 'submitCandidateTask', args),
  };
});

jest.mock('@/features/candidate/session/api/scheduleApi', () => {
  const actual = jest.requireActual(
    '@/features/candidate/session/api/scheduleApi',
  ) as { scheduleCandidateSession: (...a: unknown[]) => unknown };
  return {
    ...actual,
    scheduleCandidateSession: (...args: unknown[]) => {
      const fn = resolveCompat().scheduleCandidateSession;
      if (canCallCompatFn(fn)) return fn(...args);
      return actual.scheduleCandidateSession(...args);
    },
  };
});

jest.mock('@/features/candidate/session/api/testsApi', () => {
  const actual = jest.requireActual(
    '@/features/candidate/session/api/testsApi',
  ) as Record<string, unknown>;
  return {
    ...actual,
    startCandidateTestRun: (...args: unknown[]) =>
      callCompat(actual, 'startCandidateTestRun', args),
    pollCandidateTestRun: (...args: unknown[]) =>
      callCompat(actual, 'pollCandidateTestRun', args),
  };
});

jest.mock('@/features/candidate/session/api/taskDraftsApi', () => {
  const actual = jest.requireActual(
    '@/features/candidate/session/api/taskDraftsApi',
  ) as Record<string, unknown>;
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      callCompat(actual, 'getCandidateTaskDraft', args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      callCompat(actual, 'putCandidateTaskDraft', args),
  };
});
