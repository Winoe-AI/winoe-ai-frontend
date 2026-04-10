export function makeTrialCreatePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'trial-created-1',
    title: 'Frontend Platform Modernization',
    role: 'Senior Frontend Engineer',
    techStack: 'TypeScript, Next.js',
    status: 'draft',
    ...overrides,
  };
}

export function makeTrialDetailPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'trial-1',
    title: 'Frontend Platform Modernization',
    role: 'Senior Frontend Engineer',
    techStack: 'TypeScript, Next.js',
    status: 'active_inviting',
    scenario: {
      id: 101,
      versionIndex: 1,
      status: 'ready',
      lockedAt: null,
    },
    tasks: [
      {
        dayIndex: 1,
        title: 'Architecture brief',
        description: 'Design service boundaries and API contracts.',
      },
    ],
    ...overrides,
  };
}

export function makeTrialInvitePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    candidateSessionId: 'candidate-session-1',
    token: 'invite-token-1',
    inviteUrl: 'http://127.0.0.1:3200/candidate/session/invite-token-1',
    outcome: 'created',
    ...overrides,
  };
}

export function makeTrialsComparePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    candidateSessionId: '900',
    candidateName: 'Jane Candidate',
    candidateEmail: 'jane.candidate@example.com',
    status: 'in_progress',
    winoeReportStatus: 'ready',
    overallWinoeScore: 0.82,
    recommendation: 'strong_hire',
    strengths: ['delivery'],
    risks: [],
    dayCompletion: {
      '1': true,
      '2': true,
      '3': false,
      '4': false,
      '5': false,
    },
    ...overrides,
  };
}

export function makeCandidateSessionResolvePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    candidateSessionId: 77,
    status: 'in_progress',
    trial: {
      title: 'Frontend Platform Modernization',
      role: 'Senior Frontend Engineer',
    },
    ...overrides,
  };
}

export function makeCandidateSessionSchedulePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    candidateSessionId: 77,
    scheduledStartAt: '2026-03-27T14:00:00Z',
    candidateTimezone: 'America/New_York',
    dayWindows: [
      {
        dayIndex: 1,
        windowStartAt: '2026-03-27T14:00:00Z',
        windowEndAt: '2026-03-27T22:00:00Z',
      },
    ],
    scheduleLockedAt: '2026-03-27T13:59:59Z',
    ...overrides,
  };
}

export function makeCandidateCurrentTaskPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    isComplete: false,
    completedTaskIds: [1],
    currentTask: {
      id: 2,
      dayIndex: 2,
      type: 'code',
      title: 'Build feature',
      description: 'Implement feature in repository.',
    },
    ...overrides,
  };
}

export function makeSubmissionListItemPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    submissionId: 501,
    candidateSessionId: 900,
    taskId: 101,
    dayIndex: 1,
    type: 'design',
    submittedAt: '2026-03-13T11:00:00Z',
    ...overrides,
  };
}

export function makeSubmissionListPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    items: [makeSubmissionListItemPayload()],
    ...overrides,
  };
}

export function makeSubmissionDetailPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    submissionId: 501,
    candidateSessionId: 900,
    task: {
      taskId: 101,
      dayIndex: 1,
      type: 'design',
      title: 'Architecture brief',
      prompt: null,
    },
    contentText: 'Candidate answer',
    code: null,
    testResults: null,
    submittedAt: '2026-03-13T11:00:00Z',
    ...overrides,
  };
}

export function makeRunStatusPayload(overrides: Record<string, unknown> = {}) {
  return {
    status: 'passed',
    message: 'All tests passed.',
    passed: 12,
    failed: 0,
    total: 12,
    stdout: 'All tests passed.',
    stderr: null,
    workflowUrl: 'https://github.com/winoe-ai/candidate-repo/actions/runs/1',
    commitSha: 'abc1234def5678',
    ...overrides,
  };
}

export function makeCodespaceStatusPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    repoName: 'candidate-repo',
    repoFullName: 'winoe-ai/candidate-repo',
    codespaceUrl: 'https://github.com/codespaces/qa-e2e',
    codespaceState: 'ready',
    ...overrides,
  };
}

export function makeHandoffPayload(overrides: Record<string, unknown> = {}) {
  return {
    recordingId: 'rec_123',
    transcriptStatus: 'ready',
    transcript: 'final transcript from backend.',
    transcriptSegments: [
      {
        startMs: 0,
        endMs: 1000,
        text: 'Segment 1',
      },
    ],
    ...overrides,
  };
}

export function makeWinoeReportStatusPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    status: 'ready',
    generatedAt: '2026-03-18T08:00:00Z',
    report: {
      overallWinoeScore: 0.82,
      recommendation: 'strong_hire',
      confidence: 0.86,
      calibrationText: 'High confidence from artifact quality and consistency.',
      dayScores: [],
      disabledDayIndexes: [5],
      warnings: [],
    },
    ...overrides,
  };
}

export function makeWinoeReportGeneratePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    jobId: 'fit-job-1',
    status: 'queued',
    ...overrides,
  };
}
