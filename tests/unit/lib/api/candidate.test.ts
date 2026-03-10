const mockPost = jest.fn();
const mockGet = jest.fn();
const mockRequestWithMeta = jest.fn();

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: mockPost,
    get: mockGet,
  },
}));

jest.mock('@/lib/api/client/request', () => ({
  requestWithMeta: (...args: unknown[]) => mockRequestWithMeta(...args),
}));

describe('candidate api helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    mockPost.mockReset();
    mockGet.mockReset();
    mockRequestWithMeta.mockImplementation(
      async (
        path: string,
        options?: Record<string, unknown>,
        client?: unknown,
      ) => {
        const method = ((options?.method as string) ?? 'GET').toUpperCase();
        if (method === 'GET') {
          const data = await mockGet(path, options, client);
          return {
            data,
            headers: (options as { headers?: Headers })?.headers ?? null,
          };
        }
        const data = await mockPost(path, options?.body ?? {}, options, client);
        return {
          data,
          headers: (options as { headers?: Headers })?.headers ?? null,
        };
      },
    );
    mockRequestWithMeta.mockClear();
  });

  it('lists candidate invites and normalizes shape', async () => {
    mockGet.mockResolvedValueOnce([
      {
        candidate_session_id: 5,
        token: 'tok',
        title: 'Sim',
        role: 'Eng',
        company: 'Co',
        status: 'not_started',
        progress: { completed: 0, total: 3 },
        expiresAt: '2024-01-01',
      },
    ]);

    const { listCandidateInvites } = await import('@/features/candidate/api');
    const invites = await listCandidateInvites();

    expect(mockGet).toHaveBeenCalled();
    expect(invites[0]).toMatchObject({
      candidateSessionId: 5,
      token: 'tok',
      title: 'Sim',
      role: 'Eng',
    });
  });

  it('resolves invite token and maps 404 to HttpError', async () => {
    mockGet.mockRejectedValueOnce({ status: 404 });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('resolves invite token and maps 410 to HttpError', async () => {
    mockGet.mockRejectedValueOnce({ status: 410 });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 410,
    });
  });

  it('maps resolveCandidateInviteToken auth errors', async () => {
    mockGet.mockRejectedValueOnce({ status: 401 });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 401,
      message: 'Please sign in again.',
    });

    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'Email verification required' },
    });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'Please verify your email, then try again.',
    });
  });

  it('maps resolveCandidateInviteToken email claim errors', async () => {
    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'email claim missing' },
    });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'We could not confirm your email. Please sign in again.',
    });
  });

  it('maps resolveCandidateInviteToken generic 403 errors', async () => {
    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'other' },
    });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'You do not have access to this invite.',
    });
  });

  it('maps current task network errors to HttpError', async () => {
    mockGet.mockRejectedValueOnce(new TypeError('network'));
    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(1)).rejects.toMatchObject({
      status: 0,
    });
  });

  it('maps current task 404 errors with backend message', async () => {
    mockGet.mockRejectedValueOnce({ status: 404, details: 'missing' });
    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(2)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('maps current task 410 errors', async () => {
    mockGet.mockRejectedValueOnce({ status: 410 });
    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(3)).rejects.toMatchObject({
      status: 410,
    });
  });

  it('handles submitCandidateTask validation errors', async () => {
    mockPost.mockRejectedValueOnce({ status: 400 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await expect(
      submitCandidateTask({
        taskId: 1,
        candidateSessionId: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('submits empty payloads without code or text', async () => {
    mockPost.mockResolvedValueOnce({ submissionId: 10 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await submitCandidateTask({
      taskId: 8,
      candidateSessionId: 8,
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/8/submit',
      {},
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': '8',
        },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
  });

  it('submits text content when provided', async () => {
    mockPost.mockResolvedValueOnce({ submissionId: 11 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await submitCandidateTask({
      taskId: 9,
      candidateSessionId: 9,
      contentText: 'Hello world',
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/9/submit',
      { contentText: 'Hello world' },
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': '9',
        },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
  });

  it('submits day 5 reflection payload with structured sections', async () => {
    mockPost.mockResolvedValueOnce({ submissionId: 12 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await submitCandidateTask({
      taskId: 10,
      candidateSessionId: 10,
      contentText: '## Challenges\n...\n## Decisions\n...',
      reflection: {
        challenges:
          'Handled changing constraints by validating assumptions and details.',
        decisions:
          'Chose explicit schemas to keep frontend and backend validation aligned.',
        tradeoffs:
          'Accepted stricter structure to improve review consistency for evaluators.',
        communication:
          'Documented risks and handoff context clearly at each implementation step.',
        next: 'Would add richer evidence pointers and summary metadata in follow-up.',
      },
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/10/submit',
      expect.objectContaining({
        contentText: expect.stringContaining('## Challenges'),
        reflection: expect.objectContaining({
          challenges: expect.any(String),
          decisions: expect.any(String),
          tradeoffs: expect.any(String),
          communication: expect.any(String),
          next: expect.any(String),
        }),
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': '10',
        },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
  });

  it('handles submitCandidateTask conflict and network errors', async () => {
    mockPost.mockRejectedValueOnce({ status: 409, details: 'dup' });
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await expect(
      submitCandidateTask({
        taskId: 2,
        candidateSessionId: 2,
      }),
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      submitCandidateTask({
        taskId: 3,
        candidateSessionId: 3,
      }),
    ).rejects.toMatchObject({ status: 0 });
  });

  it('handles submitCandidateTask session and expiration errors', async () => {
    mockPost.mockRejectedValueOnce({ status: 404, details: 'mismatch' });
    mockPost.mockRejectedValueOnce({ status: 410 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await expect(
      submitCandidateTask({
        taskId: 4,
        candidateSessionId: 4,
      }),
    ).rejects.toMatchObject({ status: 404 });

    await expect(
      submitCandidateTask({
        taskId: 5,
        candidateSessionId: 5,
      }),
    ).rejects.toMatchObject({ status: 410 });
  });

  it('returns empty list when invites response is not an array', async () => {
    mockGet.mockResolvedValueOnce({ not: 'array' });
    const { listCandidateInvites } = await import('@/features/candidate/api');
    const invites = await listCandidateInvites();
    expect(invites).toEqual([]);
  });

  it('propagates invite list errors as HttpError', async () => {
    mockGet.mockRejectedValueOnce(new Error('fetch'));
    const { listCandidateInvites, HttpError } =
      await import('@/features/candidate/api');
    await expect(listCandidateInvites()).rejects.toBeInstanceOf(HttpError);
  });

  it('propagates resolve invite backend errors', async () => {
    mockGet.mockRejectedValueOnce({ status: 500, details: 'backend' });
    const { resolveCandidateInviteToken } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 500,
    });
  });

  it('maps current task generic errors', async () => {
    mockGet.mockRejectedValueOnce({ status: 500, details: 'fail' });
    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(9)).rejects.toMatchObject({
      status: 500,
    });
  });

  it('maps submitCandidateTask unknown errors via toHttpError', async () => {
    mockPost.mockRejectedValueOnce('oops');
    const { submitCandidateTask, HttpError } =
      await import('@/features/candidate/api');

    await expect(
      submitCandidateTask({
        taskId: 6,
        candidateSessionId: 6,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('normalizes candidate invites with missing data', async () => {
    const { normalizeCandidateInvite } =
      await import('@/features/candidate/api');
    const normalized = normalizeCandidateInvite({
      id: 'NaN',
      inviteToken: '',
      status: 'expired',
      progress: { completed: 'one', total: 'two' },
    });

    expect(normalized.candidateSessionId).toBe(0);
    expect(normalized.token).toBeNull();
    expect(normalized.isExpired).toBe(true);
    expect(normalized.progress).toBeNull();
  });

  it('maps resolveCandidateInviteToken unknown errors via toHttpError', async () => {
    mockGet.mockRejectedValueOnce('wtf');
    const { resolveCandidateInviteToken, HttpError } =
      await import('@/features/candidate/api');

    await expect(resolveCandidateInviteToken('tok')).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it('treats current task errors without numeric status as network issues', async () => {
    mockGet.mockRejectedValueOnce({ status: 'oops' });
    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(1)).rejects.toMatchObject({
      status: 0,
    });
  });

  it('maps current task unknown errors via toHttpError', async () => {
    mockGet.mockRejectedValueOnce('boom');
    const { getCandidateCurrentTask, HttpError } =
      await import('@/features/candidate/api');

    await expect(getCandidateCurrentTask(1)).rejects.toBeInstanceOf(HttpError);
  });

  it('handles submitCandidateTask unexpected status with generic message', async () => {
    mockPost.mockRejectedValueOnce({ status: 418 });
    const { submitCandidateTask } = await import('@/features/candidate/api');

    await expect(
      submitCandidateTask({
        taskId: 7,
        candidateSessionId: 7,
      }),
    ).rejects.toMatchObject({
      status: 418,
      message: 'Something went wrong submitting your task.',
    });
  });

  it('normalizes cutoff fields on current task responses', async () => {
    mockGet.mockResolvedValueOnce({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 41,
        dayIndex: 2,
        type: 'code',
        title: 'Code task',
        description: 'Implement feature',
        cutoff_commit_sha: 'abc123def456',
        cutoff_at: '2026-03-08T17:45:00.000Z',
      },
    });

    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');
    const result = await getCandidateCurrentTask(777);

    expect(result?.currentTask).toMatchObject({
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });
  });

  it('normalizes cutoff fields from later nested current task records', async () => {
    mockGet.mockResolvedValueOnce({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 42,
        dayIndex: 3,
        type: 'debug',
        title: 'Debug task',
        description: 'Fix failing tests',
        workspaceStatus: { repoUrl: 'https://github.com/acme/repo' },
        workspace_status: { codespaceUrl: 'https://codespaces.new/acme/repo' },
        workspace: { status: 'ready' },
        integrity: { status: 'ok' },
        evaluationBasis: { source: 'latest' },
        evaluation_basis: {
          cutoff_commit_sha: 'laternestedsha123',
          cutoff_at: '2026-03-08T18:15:00.000Z',
        },
      },
    });

    const { getCandidateCurrentTask } =
      await import('@/features/candidate/api');
    const result = await getCandidateCurrentTask(778);

    expect(result?.currentTask).toMatchObject({
      cutoffCommitSha: 'laternestedsha123',
      cutoffAt: '2026-03-08T18:15:00.000Z',
    });
  });

  it('initializes workspace and normalizes response fields', async () => {
    mockPost.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });

    const { initCandidateWorkspace } = await import('@/features/candidate/api');
    const result = await initCandidateWorkspace({
      taskId: 11,
      candidateSessionId: 77,
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/11/codespace/init',
      {},
      expect.objectContaining({
        headers: { 'x-candidate-session-id': '77' },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
    expect(result).toEqual({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      repoFullName: null,
      codespaceUrl: 'https://codespaces.new/acme/repo',
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
  });

  it('fetches workspace status via codespace/status', async () => {
    mockGet.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo2',
      repoName: 'acme/repo2',
    });

    const { getCandidateWorkspaceStatus } =
      await import('@/features/candidate/api');
    const result = await getCandidateWorkspaceStatus({
      taskId: 12,
      candidateSessionId: 88,
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/tasks/12/codespace/status',
      expect.objectContaining({
        headers: { 'x-candidate-session-id': '88' },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
    expect(result).toEqual({
      repoUrl: 'https://github.com/acme/repo2',
      repoName: 'acme/repo2',
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
  });

  it('handles empty workspace status payloads', async () => {
    mockGet.mockResolvedValueOnce(null);

    const { getCandidateWorkspaceStatus } =
      await import('@/features/candidate/api');
    const result = await getCandidateWorkspaceStatus({
      taskId: 15,
      candidateSessionId: 66,
    });

    expect(result).toEqual({
      repoUrl: null,
      repoName: null,
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
  });

  it('normalizes snake_case workspace fields', async () => {
    mockGet.mockResolvedValueOnce({
      repo_url: 'https://github.com/acme/repo3',
      repo_name: 'acme/repo3',
      repo_full_name: 'acme/repo3',
      codespace_url: 'https://codespaces.new/acme/repo3',
    });

    const { getCandidateWorkspaceStatus } =
      await import('@/features/candidate/api');
    const result = await getCandidateWorkspaceStatus({
      taskId: 14,
      candidateSessionId: 55,
    });

    expect(result).toEqual({
      repoUrl: 'https://github.com/acme/repo3',
      repoName: 'acme/repo3',
      repoFullName: 'acme/repo3',
      codespaceUrl: 'https://codespaces.new/acme/repo3',
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
  });

  it('normalizes cutoff fields from workspace status payloads', async () => {
    mockGet.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo4',
      repoName: 'acme/repo4',
      cutoff_commit_sha: 'abc123def456',
      cutoff_at: '2026-03-08T17:45:00.000Z',
    });

    const { getCandidateWorkspaceStatus } =
      await import('@/features/candidate/api');
    const result = await getCandidateWorkspaceStatus({
      taskId: 16,
      candidateSessionId: 99,
    });

    expect(result.cutoffCommitSha).toBe('abc123def456');
    expect(result.cutoffAt).toBe('2026-03-08T17:45:00.000Z');
  });

  it('starts and polls candidate test runs', async () => {
    mockPost.mockResolvedValueOnce({ runId: 'run-xyz' });
    mockGet.mockResolvedValueOnce({
      status: 'completed',
      conclusion: 'success',
      message: 'All green',
      passed: 3,
      failed: 1,
      total: 4,
      stdout: 'ok',
      stderr: '',
      workflowUrl: 'https://github.com/acme/repo/actions/runs/44',
      commitSha: 'abc123',
    });

    const { startCandidateTestRun, pollCandidateTestRun } =
      await import('@/features/candidate/api');

    const start = await startCandidateTestRun({
      taskId: 13,
      candidateSessionId: 99,
    });
    expect(start).toEqual({ runId: 'run-xyz' });
    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/13/run',
      {},
      expect.objectContaining({
        headers: { 'x-candidate-session-id': '99' },
      }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );

    const polled = await pollCandidateTestRun({
      taskId: 13,
      runId: 'run-xyz',
      candidateSessionId: 99,
    });
    expect(polled).toEqual({
      status: 'passed',
      message: 'All green',
      passed: 3,
      failed: 1,
      total: 4,
      stdout: 'ok',
      stderr: null,
      workflowUrl: 'https://github.com/acme/repo/actions/runs/44',
      commitSha: 'abc123',
    });
  });

  it('accepts numeric run ids from startCandidateTestRun', async () => {
    mockPost.mockResolvedValueOnce({ runId: 12345 });

    const { startCandidateTestRun } = await import('@/features/candidate/api');

    const start = await startCandidateTestRun({
      taskId: 21,
      candidateSessionId: 77,
    });

    expect(start).toEqual({ runId: '12345' });
  });

  it('accepts full run results responses with numeric run id', async () => {
    mockPost.mockResolvedValueOnce({
      runId: 20908570424,
      passed: 3,
      failed: 1,
      total: 4,
      stdout: 'ok',
      stderr: '',
      timeout: false,
      conclusion: 'failure',
      workflowUrl: 'https://github.com/acme/repo/actions/runs/1',
      commitSha: 'abc123',
    });

    const { startCandidateTestRun } = await import('@/features/candidate/api');

    const start = await startCandidateTestRun({
      taskId: 22,
      candidateSessionId: 88,
    });

    expect(start).toEqual({ runId: '20908570424' });
  });

  it('normalizes running, timeout, and error run statuses', async () => {
    mockGet
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ conclusion: 'timed_out' })
      .mockResolvedValueOnce({ timeout: true, status: 'completed' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: 'failed', message: 'Red' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'failure' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'success' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'timed_out' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'unknown' });

    const { pollCandidateTestRun } = await import('@/features/candidate/api');

    const running = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-a',
      candidateSessionId: 1,
    });
    expect(running).toEqual({
      status: 'running',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const timeout = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-b',
      candidateSessionId: 1,
    });
    expect(timeout).toEqual({
      status: 'timeout',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const timeoutFlag = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-c',
      candidateSessionId: 1,
    });
    expect(timeoutFlag).toEqual({
      status: 'timeout',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const error = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-d',
      candidateSessionId: 1,
    });
    expect(error).toEqual({
      status: 'error',
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const failed = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-e',
      candidateSessionId: 1,
    });
    expect(failed).toEqual({
      status: 'failed',
      message: 'Red',
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const completedFailure = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-f',
      candidateSessionId: 1,
    });
    expect(completedFailure).toEqual({
      status: 'failed',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const completedSuccess = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-g',
      candidateSessionId: 1,
    });
    expect(completedSuccess).toEqual({
      status: 'passed',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const completedTimeout = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-h',
      candidateSessionId: 1,
    });
    expect(completedTimeout).toEqual({
      status: 'timeout',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });

    const completedUnknown = await pollCandidateTestRun({
      taskId: 14,
      runId: 'run-i',
      candidateSessionId: 1,
    });
    expect(completedUnknown).toEqual({
      status: 'error',
      message: undefined,
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    });
  });

  it('handles workspace and run network errors', async () => {
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    mockGet.mockRejectedValueOnce(new TypeError('offline'));
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    mockGet.mockRejectedValueOnce(new TypeError('offline'));

    const {
      initCandidateWorkspace,
      getCandidateWorkspaceStatus,
      startCandidateTestRun,
      pollCandidateTestRun,
    } = await import('@/features/candidate/api');

    await expect(
      initCandidateWorkspace({
        taskId: 20,
        candidateSessionId: 2,
      }),
    ).rejects.toMatchObject({ status: 0 });

    await expect(
      getCandidateWorkspaceStatus({
        taskId: 20,
        candidateSessionId: 2,
      }),
    ).rejects.toMatchObject({ status: 0 });

    await expect(
      startCandidateTestRun({
        taskId: 21,
        candidateSessionId: 3,
      }),
    ).rejects.toMatchObject({ status: 0 });

    await expect(
      pollCandidateTestRun({
        taskId: 21,
        runId: 'run-x',
        candidateSessionId: 3,
      }),
    ).rejects.toMatchObject({ status: 0 });
  });

  it('throws when test run start response is missing a run id', async () => {
    mockPost.mockResolvedValueOnce({});
    const { startCandidateTestRun, HttpError } =
      await import('@/features/candidate/api');

    await expect(
      startCandidateTestRun({
        taskId: 30,
        candidateSessionId: 4,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('propagates workspace and run status errors via toHttpError', async () => {
    mockPost.mockRejectedValueOnce({ status: 500 });
    mockGet.mockRejectedValueOnce({ status: 500 });
    mockGet.mockRejectedValueOnce({ status: 500 });

    const {
      initCandidateWorkspace,
      getCandidateWorkspaceStatus,
      pollCandidateTestRun,
      HttpError,
    } = await import('@/features/candidate/api');

    await expect(
      initCandidateWorkspace({
        taskId: 40,
        candidateSessionId: 4,
      }),
    ).rejects.toBeInstanceOf(HttpError);

    await expect(
      getCandidateWorkspaceStatus({
        taskId: 40,
        candidateSessionId: 4,
      }),
    ).rejects.toBeInstanceOf(HttpError);

    await expect(
      pollCandidateTestRun({
        taskId: 41,
        runId: 'run-y',
        candidateSessionId: 4,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('rejects oversized draft payloads client-side before network call', async () => {
    const { putCandidateTaskDraft, MAX_DRAFT_CONTENT_BYTES } =
      await import('@/features/candidate/api');

    await expect(
      putCandidateTaskDraft({
        taskId: 50,
        candidateSessionId: 5,
        payload: {
          contentText: 'x'.repeat(MAX_DRAFT_CONTENT_BYTES + 1),
        },
      }),
    ).rejects.toMatchObject({
      status: 413,
      details: expect.objectContaining({
        errorCode: 'DRAFT_CONTENT_TOO_LARGE',
      }),
    });

    expect(mockRequestWithMeta).not.toHaveBeenCalled();
  });

  it('maps DRAFT_CONTENT_TOO_LARGE errors to a bounded-size message', async () => {
    mockPost.mockRejectedValueOnce({
      status: 413,
      details: {
        errorCode: 'DRAFT_CONTENT_TOO_LARGE',
      },
    });

    const { putCandidateTaskDraft, MAX_DRAFT_CONTENT_BYTES } =
      await import('@/features/candidate/api');

    await expect(
      putCandidateTaskDraft({
        taskId: 51,
        candidateSessionId: 5,
        payload: { contentText: 'ok' },
      }),
    ).rejects.toMatchObject({
      status: 413,
      message: `Draft exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes and could not be saved.`,
    });
  });
});
