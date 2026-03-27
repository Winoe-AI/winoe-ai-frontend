import {
  CandidateSubmissionsPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  setMockParams,
  textResponse,
  userEvent,
  waitFor,
} from './CandidateSubmissionsContent.testlib';

describe('CandidateSubmissionsPage - artifact rendering', () => {
  it('renders prompt/test results and fallback artifact message when submissions load', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'completed', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: '2025-12-23T19:00:00.000000Z', hasReport: false }]);
      if (url.startsWith('/api/submissions?candidateSessionId=2')) return jsonResponse({ items: [{ submissionId: 10, candidateSessionId: 2, taskId: 10, dayIndex: 1, type: 'design', submittedAt: '2025-12-23T18:57:10.981202Z' }, { submissionId: 11, candidateSessionId: 2, taskId: 11, dayIndex: 2, type: 'debug', submittedAt: '2025-12-23T19:57:10.981202Z' }] });
      if (url === '/api/submissions/10') return jsonResponse({ submissionId: 10, candidateSessionId: 2, task: { taskId: 10, dayIndex: 1, type: 'design', title: 'Prompted Task', prompt: 'Prompt text' }, contentText: 'Answer', code: null, repoUrl: 'https://github.com/acme/day2', repoFullName: 'acme/day2', workflowUrl: 'https://github.com/acme/day2/actions/runs/1', commitUrl: 'https://github.com/acme/day2/commit/abc123', diffUrl: 'https://github.com/acme/day2/commit/abc123?diff=split', diffSummary: { filesChanged: 1 }, testResults: { passed: 8, failed: 1, total: 9, stdout: 'stdout log', stderr: 'stderr log', workflowRunId: '1', workflowUrl: 'https://github.com/acme/day2/actions/runs/1', commitUrl: 'https://github.com/acme/day2/commit/abc123', conclusion: 'success', runStatus: 'completed' }, submittedAt: '2025-12-23T18:57:10.981202Z' });
      if (url === '/api/submissions/11') return textResponse('missing artifact', 404);
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Show all/i }));
    expect(await screen.findByText(/CandidateSession: 2/)).toBeInTheDocument();
    expect((await screen.findAllByText((content) => content.includes('Prompted Task'))).length).toBeGreaterThan(0);
    expect(screen.getByText('Prompt text')).toBeInTheDocument();
    expect(screen.getAllByText(/GitHub artifacts/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /acme\/day2/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Workflow run/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Passed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Failed/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/content not available/i)).toBeInTheDocument();
  });

  it('does not render GitHub artifacts for Day 1 only submissions', async () => {
    setMockParams({ id: '1', candidateSessionId: '5' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 5, inviteEmail: 'day1@example.com', candidateName: 'Day One', status: 'completed', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: '2025-12-23T19:00:00.000000Z', hasReport: false }]);
      if (url.startsWith('/api/submissions?candidateSessionId=5')) return jsonResponse({ items: [{ submissionId: 20, candidateSessionId: 5, taskId: 20, dayIndex: 1, type: 'design', submittedAt: '2025-12-23T18:57:10.981202Z' }] });
      if (url === '/api/submissions/20') return jsonResponse({ submissionId: 20, candidateSessionId: 5, task: { taskId: 20, dayIndex: 1, type: 'design', title: 'Day1 Task', prompt: 'Describe day1' }, contentText: 'Day1 answer', code: null, testResults: null, submittedAt: '2025-12-23T18:57:10.981202Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Show all/i }));
    expect(await screen.findByText(/Day1 Task/)).toBeInTheDocument();
    expect(screen.queryByText(/Workflow run/i)).not.toBeInTheDocument();
  });

  it('shows message when Day 2 submission has no test results', async () => {
    setMockParams({ id: '1', candidateSessionId: '6' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 6, inviteEmail: 'day2@example.com', candidateName: 'Code Candidate', status: 'in_progress', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: null, hasReport: false }]);
      if (url.startsWith('/api/submissions?candidateSessionId=6')) return jsonResponse({ items: [{ submissionId: 30, candidateSessionId: 6, taskId: 30, dayIndex: 2, type: 'code', submittedAt: '2025-12-23T18:57:10.981202Z' }] });
      if (url === '/api/submissions/30') return jsonResponse({ submissionId: 30, candidateSessionId: 6, task: { taskId: 30, dayIndex: 2, type: 'code', title: 'Code Task', prompt: 'Implement features' }, contentText: null, code: null, repoFullName: 'acme/day2', repoUrl: null, workflowUrl: 'https://github.com/acme/day2/actions/runs/777', commitUrl: 'https://github.com/acme/day2/commit/zzz', diffUrl: 'https://github.com/acme/day2/commit/zzz?diff=split', testResults: null, submittedAt: '2025-12-23T18:57:10.981202Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    expect((await screen.findAllByText(/Code Task/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/No GitHub test results captured yet/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByRole('link', { name: /acme\/day2/i })).length).toBeGreaterThan(0);
  });

  it('renders fallback message for code artifacts without text content', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'completed', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: '2025-12-23T19:00:00.000000Z', hasReport: true }]);
      if (url.startsWith('/api/submissions?candidateSessionId=2')) return jsonResponse({ items: [{ submissionId: 12, candidateSessionId: 2, taskId: 12, dayIndex: 4, type: 'code', submittedAt: '2025-12-23T18:57:10.981202Z' }] });
      if (url === '/api/submissions/12') return jsonResponse({ submissionId: 12, candidateSessionId: 2, task: { taskId: 12, dayIndex: 4, type: 'code', title: 'Path Task', prompt: null }, contentText: null, code: { blob: "console.log('path');", repoPath: 'src/index.ts' }, testResults: null, submittedAt: '2025-12-23T18:57:10.981202Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Show all/i }));
    expect(await screen.findByText(/Path Task/)).toBeInTheDocument();
    expect(screen.queryByText(/Day 4 playback/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No text answer submitted/i)).toBeInTheDocument();
  });
});
