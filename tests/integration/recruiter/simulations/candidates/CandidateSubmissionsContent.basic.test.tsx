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

describe('CandidateSubmissionsPage - basic rendering', () => {
  it('renders available submissions for an incomplete candidate', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'in_progress', startedAt: '2025-12-23T18:57:00.000000Z', completedAt: null, hasReport: false }]);
      if (url.startsWith('/api/submissions?candidateSessionId=2')) return jsonResponse({ items: [{ submissionId: 6, candidateSessionId: 2, taskId: 6, dayIndex: 1, type: 'design', submittedAt: '2025-12-23T18:57:10.981202Z' }] });
      if (url === '/api/submissions/6') return jsonResponse({ submissionId: 6, candidateSessionId: 2, task: { taskId: 6, dayIndex: 1, type: 'design', title: 'Architecture & Planning', prompt: 'Describe your approach' }, contentText: 'Here is my architecture plan...', code: null, testResults: null, submittedAt: '2025-12-23T18:57:10.981202Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Show all/i }));
    await waitFor(() => expect(screen.getByText((content) => content.includes('Day 1:') && content.includes('Architecture & Planning'))).toBeInTheDocument());
    expect(screen.getByText('Text answer')).toBeInTheDocument();
    expect(screen.getByText('Here is my architecture plan...')).toBeInTheDocument();
  });

  it('renders multiple submissions and includes code content when present', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'completed', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: '2025-12-23T19:00:00.000000Z', hasReport: false }]);
      if (url.startsWith('/api/submissions?candidateSessionId=2')) return jsonResponse({ items: [{ submissionId: 6, candidateSessionId: 2, taskId: 6, dayIndex: 1, type: 'design', submittedAt: '2025-12-23T18:57:10.981202Z' }, { submissionId: 7, candidateSessionId: 2, taskId: 7, dayIndex: 2, type: 'code', submittedAt: '2025-12-23T18:57:19.035314Z' }] });
      if (url === '/api/submissions/6') return jsonResponse({ submissionId: 6, candidateSessionId: 2, task: { taskId: 6, dayIndex: 1, type: 'design', title: 'Architecture & Planning', prompt: null }, contentText: 'Design response', code: null, testResults: null, submittedAt: '2025-12-23T18:57:10.981202Z' });
      if (url === '/api/submissions/7') return jsonResponse({ submissionId: 7, candidateSessionId: 2, task: { taskId: 7, dayIndex: 2, type: 'code', title: 'Feature Implementation', prompt: null }, contentText: null, code: { blob: "console.log('hello from candidate');", repoPath: null }, testResults: null, submittedAt: '2025-12-23T18:57:19.035314Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Show all/i }));
    await waitFor(() => expect(screen.getAllByText((content) => content.includes('Day 1:') && content.includes('Architecture & Planning')).length).toBeGreaterThan(0));
    expect(screen.getAllByText((content) => content.includes('Day 2:') && content.includes('Feature Implementation')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/This is a code task; see GitHub artifacts and test results above./i).length).toBeGreaterThan(0);
  });
});
