import { iso } from './shared';

export function buildDefaultTrials(trialId: string) {
  return [
    {
      id: trialId,
      title: 'Frontend Platform Modernization',
      role: 'Senior Frontend Engineer',
      createdAt: iso('2026-03-10T09:00:00Z'),
      candidateCount: 1,
      templateKey: 'backend_api',
    },
  ];
}

export function buildDefaultCandidates(candidateSessionId: number) {
  return [
    {
      candidateSessionId,
      candidateName: 'Jane Candidate',
      inviteEmail: 'jane.candidate@example.com',
      status: 'in_progress',
      startedAt: iso('2026-03-12T13:00:00Z'),
      completedAt: null,
      hasReport: false,
      verified: true,
      inviteEmailStatus: 'sent',
      inviteToken: 'candidate-token-77',
      dayProgress: { completed: 2, total: 5 },
      inviteUrl: 'http://127.0.0.1:3200/candidate/session/candidate-token-77',
    },
  ];
}

export function buildDefaultCompareRows(candidateSessionId: number) {
  return [
    {
      candidateSessionId: String(candidateSessionId),
      candidateName: 'Jane Candidate',
      candidateEmail: 'jane.candidate@example.com',
      status: 'in_progress',
      winoeReportStatus: 'ready',
      overallWinoeScore: 0.82,
      recommendation: 'strong_hire',
      strengths: ['delivery', 'communication'],
      risks: ['none'],
      dayCompletion: {
        '1': true,
        '2': true,
        '3': false,
        '4': false,
        '5': false,
      },
    },
  ];
}
