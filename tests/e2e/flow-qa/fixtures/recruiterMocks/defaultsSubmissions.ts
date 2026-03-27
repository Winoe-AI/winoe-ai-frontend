import { iso } from './shared';

export function buildDefaultSubmissions(candidateSessionId: number) {
  return [
    { submissionId: 501, candidateSessionId, taskId: 101, dayIndex: 1, type: 'design', submittedAt: iso('2026-03-13T11:00:00Z') },
    { submissionId: 502, candidateSessionId, taskId: 102, dayIndex: 2, type: 'code', submittedAt: iso('2026-03-14T11:00:00Z') },
    { submissionId: 503, candidateSessionId, taskId: 103, dayIndex: 3, type: 'code', submittedAt: iso('2026-03-15T11:00:00Z') },
    { submissionId: 504, candidateSessionId, taskId: 104, dayIndex: 4, type: 'handoff', submittedAt: iso('2026-03-16T11:00:00Z') },
  ];
}
