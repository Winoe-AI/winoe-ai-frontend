import type { Page, Route } from '@playwright/test';

type RecruiterMockOptions = {
  simulationId?: string;
  candidateSessionId?: number;
  dashboardDelayMs?: number;
  simulations?: Array<Record<string, unknown>>;
  candidates?: Array<Record<string, unknown>>;
  compareRows?: Array<Record<string, unknown>>;
  submissions?: Array<Record<string, unknown>>;
  artifactsBySubmissionId?: Record<number, Record<string, unknown>>;
  createSimulationId?: string;
  fitProfilePayload?: Record<string, unknown>;
};

type RecruiterMockState = {
  simulationId: string;
  candidateSessionId: number;
  inviteRequestCount: number;
  resendInviteCount: number;
};

const defaultSimulationId = 'sim-123';
const defaultCandidateSessionId = 77;

function iso(value: string): string {
  return new Date(value).toISOString();
}

function buildDefaultSimulations(simulationId: string) {
  return [
    {
      id: simulationId,
      title: 'Frontend Platform Modernization',
      role: 'Senior Frontend Engineer',
      createdAt: iso('2026-03-10T09:00:00Z'),
      candidateCount: 1,
      templateKey: 'backend_api',
    },
  ];
}

function buildDefaultCandidates(candidateSessionId: number) {
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
      dayProgress: {
        completed: 2,
        total: 5,
      },
      inviteUrl: 'http://127.0.0.1:3200/candidate/session/candidate-token-77',
    },
  ];
}

function buildDefaultCompareRows(candidateSessionId: number) {
  return [
    {
      candidateSessionId: String(candidateSessionId),
      candidateName: 'Jane Candidate',
      candidateEmail: 'jane.candidate@example.com',
      status: 'in_progress',
      fitProfileStatus: 'ready',
      overallFitScore: 0.82,
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

function buildDefaultDetail(simulationId: string) {
  return {
    id: simulationId,
    title: 'Frontend Platform Modernization',
    templateKey: 'backend_api',
    role: 'Senior Frontend Engineer',
    techStack: 'TypeScript, Next.js',
    seniority: 'senior',
    focus: 'Execution quality and communication',
    scenario: 'Build and debug a production-like frontend flow.',
    status: 'active_inviting',
    activeScenarioVersionId: 'scn-1',
    pendingScenarioVersionId: null,
    scenarioVersions: [
      {
        id: 'scn-1',
        versionIndex: 1,
        status: 'ready',
        lockedAt: null,
        contentAvailability: 'canonical',
      },
    ],
    scenarioVersionSummary: {
      id: 'scn-1',
      versionIndex: 1,
      status: 'ready',
      lockedAt: null,
    },
    storylineMd:
      'Candidates ship a day-by-day solution with coding, handoff, and documentation artifacts.',
    taskPromptsJson: [
      {
        dayIndex: 1,
        title: 'Architecture brief',
        type: 'design',
        description: 'Write your architecture plan.',
      },
      {
        dayIndex: 2,
        title: 'Build feature',
        type: 'code',
        description: 'Implement feature in repo.',
      },
      {
        dayIndex: 3,
        title: 'Debug and finalize',
        type: 'code',
        description: 'Fix bugs and finalize.',
      },
      {
        dayIndex: 4,
        title: 'Handoff demo',
        type: 'handoff',
        description: 'Record a walkthrough.',
      },
      {
        dayIndex: 5,
        title: 'Reflection',
        type: 'documentation',
        description: 'Document decisions and next steps.',
      },
    ],
    rubricJson: {
      quality: 'Correctness, clarity, and pragmatic tradeoffs.',
    },
    ai: {
      evalEnabledByDay: {
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
      },
    },
    days: [
      {
        dayIndex: 1,
        title: 'Architecture brief',
        type: 'design',
        description: 'Write your architecture plan.',
      },
      {
        dayIndex: 2,
        title: 'Build feature',
        type: 'code',
        description: 'Implement feature in repo.',
      },
      {
        dayIndex: 3,
        title: 'Debug and finalize',
        type: 'code',
        description: 'Fix bugs and finalize.',
      },
      {
        dayIndex: 4,
        title: 'Handoff demo',
        type: 'handoff',
        description: 'Record a walkthrough.',
      },
      {
        dayIndex: 5,
        title: 'Reflection',
        type: 'documentation',
        description: 'Document decisions and next steps.',
      },
    ],
  };
}

function buildDefaultSubmissions(candidateSessionId: number) {
  return [
    {
      submissionId: 501,
      candidateSessionId,
      taskId: 101,
      dayIndex: 1,
      type: 'design',
      submittedAt: iso('2026-03-13T11:00:00Z'),
    },
    {
      submissionId: 502,
      candidateSessionId,
      taskId: 102,
      dayIndex: 2,
      type: 'code',
      submittedAt: iso('2026-03-14T11:00:00Z'),
    },
    {
      submissionId: 503,
      candidateSessionId,
      taskId: 103,
      dayIndex: 3,
      type: 'code',
      submittedAt: iso('2026-03-15T11:00:00Z'),
    },
    {
      submissionId: 504,
      candidateSessionId,
      taskId: 104,
      dayIndex: 4,
      type: 'handoff',
      submittedAt: iso('2026-03-16T11:00:00Z'),
    },
  ];
}

function buildDefaultArtifacts(candidateSessionId: number) {
  return {
    501: {
      submissionId: 501,
      candidateSessionId,
      task: {
        taskId: 101,
        dayIndex: 1,
        type: 'design',
        title: 'Architecture brief',
        prompt: 'Describe your architecture approach.',
      },
      contentText: 'Day 1 architecture response.',
      testResults: null,
      submittedAt: iso('2026-03-13T11:00:00Z'),
    },
    502: {
      submissionId: 502,
      candidateSessionId,
      task: {
        taskId: 102,
        dayIndex: 2,
        type: 'code',
        title: 'Build feature',
        prompt: 'Ship feature implementation.',
      },
      contentText: null,
      repoUrl: 'https://github.com/tenon-ai/candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/2',
      testResults: {
        passed: 22,
        failed: 0,
        total: 22,
        stdout: 'All tests passed.',
        stderr: null,
      },
      submittedAt: iso('2026-03-14T11:00:00Z'),
    },
    503: {
      submissionId: 503,
      candidateSessionId,
      task: {
        taskId: 103,
        dayIndex: 3,
        type: 'code',
        title: 'Debug and finalize',
        prompt: 'Fix defects and finalize.',
      },
      contentText: null,
      repoUrl: 'https://github.com/tenon-ai/candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/3',
      testResults: {
        passed: 20,
        failed: 1,
        total: 21,
        stdout: '1 failure found.',
        stderr: 'Expected true, received false',
      },
      submittedAt: iso('2026-03-15T11:00:00Z'),
    },
    504: {
      submissionId: 504,
      candidateSessionId,
      task: {
        taskId: 104,
        dayIndex: 4,
        type: 'handoff',
        title: 'Handoff demo',
        prompt: 'Upload your walkthrough.',
      },
      contentText: null,
      handoff: {
        recordingId: 'rec_504',
        downloadUrl: 'https://cdn.example.com/rec_504.mp4',
        recordingStatus: 'ready',
        transcript: {
          status: 'ready',
          text: 'Candidate walkthrough transcript.',
          segments: [
            { id: 'seg1', startMs: 0, endMs: 1800, text: 'Walkthrough intro' },
          ],
        },
      },
      testResults: null,
      submittedAt: iso('2026-03-16T11:00:00Z'),
    },
  } satisfies Record<number, Record<string, unknown>>;
}

function buildDefaultFitProfilePayload(candidateSessionId: number) {
  return {
    status: 'ready',
    generatedAt: iso('2026-03-18T08:00:00Z'),
    report: {
      overallFitScore: 0.82,
      recommendation: 'strong_hire',
      confidence: 0.86,
      calibrationText:
        'High confidence from consistent artifact quality and strong day-level evidence.',
      dayScores: [
        {
          dayIndex: 1,
          score: 0.8,
          rubricBreakdown: {
            clarity: 0.82,
            architecture: 0.78,
          },
          evidence: [
            {
              kind: 'text',
              ref: `submission:${candidateSessionId}:day1`,
              excerpt: 'Clear architecture and tradeoff framing.',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 2,
          score: 0.85,
          rubricBreakdown: {
            implementation: 0.87,
            testing: 0.84,
          },
          evidence: [
            {
              kind: 'github',
              ref: 'workflow:day2',
              url: 'https://github.com/tenon-ai/candidate-repo/actions/runs/2',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 3,
          score: 0.81,
          rubricBreakdown: {
            debugging: 0.8,
            completeness: 0.82,
          },
          evidence: [
            {
              kind: 'github',
              ref: 'workflow:day3',
              url: 'https://github.com/tenon-ai/candidate-repo/actions/runs/3',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 4,
          score: 0.79,
          rubricBreakdown: {
            communication: 0.8,
            handoff: 0.78,
          },
          evidence: [
            {
              kind: 'transcript',
              ref: 'day4-transcript',
              excerpt: 'Candidate explains rollout risks and next steps.',
              startMs: 0,
              endMs: 1600,
            },
          ],
          evaluationStatus: 'evaluated',
        },
      ],
      disabledDayIndexes: [5],
      version: {
        model: 'gpt-5.4',
        promptVersion: 'fit-profile-v1',
        rubricVersion: 'rubric-v1',
        modelVersion: '2026-02-15',
      },
      warnings: [],
    },
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function installRecruiterApiMocks(
  page: Page,
  options: RecruiterMockOptions = {},
): Promise<RecruiterMockState> {
  const simulationId = options.simulationId ?? defaultSimulationId;
  const candidateSessionId =
    options.candidateSessionId ?? defaultCandidateSessionId;

  const state: RecruiterMockState = {
    simulationId,
    candidateSessionId,
    inviteRequestCount: 0,
    resendInviteCount: 0,
  };

  let simulations =
    options.simulations ?? buildDefaultSimulations(simulationId);
  const candidates =
    options.candidates ?? buildDefaultCandidates(candidateSessionId);
  const compareRows =
    options.compareRows ?? buildDefaultCompareRows(candidateSessionId);
  const submissions =
    options.submissions ?? buildDefaultSubmissions(candidateSessionId);
  const artifacts =
    options.artifactsBySubmissionId ??
    buildDefaultArtifacts(candidateSessionId);
  const createSimulationId = options.createSimulationId ?? 'sim-created-900';
  const fitProfilePayload =
    options.fitProfilePayload ??
    buildDefaultFitProfilePayload(candidateSessionId);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname === '/api/dashboard' && method === 'GET') {
      if (options.dashboardDelayMs && options.dashboardDelayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.dashboardDelayMs),
        );
      }
      await fulfillJson(route, {
        profile: {
          name: 'Recruiter QA',
          email: 'recruiter.qa@tenon.ai',
          role: 'recruiter',
        },
        simulations,
        profileError: null,
        simulationsError: null,
      });
      return;
    }

    if (pathname === '/api/simulations' && method === 'GET') {
      await fulfillJson(route, simulations);
      return;
    }

    if (pathname === '/api/simulations' && method === 'POST') {
      const payload = request.postDataJSON() as
        | Record<string, unknown>
        | undefined;
      const newId = createSimulationId;
      simulations = [
        {
          id: newId,
          title: String(payload?.title ?? 'New simulation'),
          role: String(payload?.role ?? 'Backend Engineer'),
          createdAt: new Date().toISOString(),
          candidateCount: 0,
          templateKey: String(payload?.templateKey ?? 'backend_api'),
        },
        ...simulations,
      ];
      await fulfillJson(route, { id: newId, status: 201 }, 201);
      return;
    }

    const simulationDetailMatch = pathname.match(
      /^\/api\/simulations\/([^/]+)$/,
    );
    if (simulationDetailMatch && method === 'GET') {
      const requestedId = decodePathSegment(simulationDetailMatch[1]);
      await fulfillJson(route, buildDefaultDetail(requestedId));
      return;
    }

    const candidatesMatch = pathname.match(
      /^\/api\/simulations\/([^/]+)\/candidates$/,
    );
    if (candidatesMatch && method === 'GET') {
      await fulfillJson(route, candidates);
      return;
    }

    const compareMatch = pathname.match(
      /^\/api\/simulations\/([^/]+)\/candidates\/compare$/,
    );
    if (compareMatch && method === 'GET') {
      await fulfillJson(route, compareRows);
      return;
    }

    const inviteMatch = pathname.match(/^\/api\/simulations\/([^/]+)\/invite$/);
    if (inviteMatch && method === 'POST') {
      state.inviteRequestCount += 1;
      const payload = request.postDataJSON() as
        | Record<string, unknown>
        | undefined;
      await fulfillJson(
        route,
        {
          candidateSessionId,
          token: `candidate-token-${candidateSessionId}`,
          inviteUrl: `http://127.0.0.1:3200/candidate/session/candidate-token-${candidateSessionId}`,
          outcome: state.inviteRequestCount === 1 ? 'created' : 'resent',
          candidateName: payload?.candidateName,
          inviteEmail: payload?.inviteEmail,
        },
        201,
      );
      return;
    }

    const resendMatch = pathname.match(
      /^\/api\/simulations\/([^/]+)\/candidates\/([^/]+)\/invite\/resend$/,
    );
    if (resendMatch && method === 'POST') {
      state.resendInviteCount += 1;
      await fulfillJson(route, {
        retryAfterSeconds: 30,
        inviteEmailStatus: 'sent',
      });
      return;
    }

    const terminateMatch = pathname.match(
      /^\/api\/simulations\/([^/]+)\/terminate$/,
    );
    if (terminateMatch && method === 'POST') {
      await fulfillJson(route, {
        status: 'queued',
        cleanupJobIds: ['cleanup-job-1'],
      });
      return;
    }

    if (pathname === '/api/submissions' && method === 'GET') {
      await fulfillJson(route, { items: submissions });
      return;
    }

    const submissionMatch = pathname.match(/^\/api\/submissions\/(\d+)$/);
    if (submissionMatch && method === 'GET') {
      const id = Number(submissionMatch[1]);
      const artifact = artifacts[id];
      if (artifact) {
        await fulfillJson(route, artifact);
        return;
      }
      await fulfillJson(route, { message: 'Submission not found' }, 404);
      return;
    }

    const fitProfileMatch = pathname.match(
      /^\/api\/candidate_sessions\/([^/]+)\/fit_profile$/,
    );
    if (fitProfileMatch && method === 'GET') {
      await fulfillJson(route, fitProfilePayload);
      return;
    }

    const fitProfileGenerateMatch = pathname.match(
      /^\/api\/candidate_sessions\/([^/]+)\/fit_profile\/generate$/,
    );
    if (fitProfileGenerateMatch && method === 'POST') {
      await fulfillJson(
        route,
        {
          jobId: 'fit-job-1',
          status: 'queued',
        },
        202,
      );
      return;
    }

    await fulfillJson(
      route,
      { message: `Unhandled QA mock route: ${method} ${pathname}` },
      404,
    );
  });

  return state;
}
