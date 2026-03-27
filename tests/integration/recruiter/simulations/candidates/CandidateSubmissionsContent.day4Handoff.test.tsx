import {
  CandidateSubmissionsPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  setMockParams,
  textResponse,
} from './CandidateSubmissionsContent.testlib';

describe('CandidateSubmissionsPage - day 4 handoff evidence', () => {
  it('drives Day 4 handoff evidence from the latest actual handoff submission', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    const fetchMock = installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1/candidates') return jsonResponse([{ candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'completed', startedAt: '2025-12-23T18:00:00.000000Z', completedAt: '2025-12-23T19:00:00.000000Z', hasReport: true }]);
      if (url.startsWith('/api/submissions?candidateSessionId=2')) return jsonResponse({ items: [{ submissionId: 60, candidateSessionId: 2, taskId: 60, dayIndex: 4, type: 'code', submittedAt: '2025-12-23T22:00:00.000000Z' }, { submissionId: 61, candidateSessionId: 2, taskId: 61, dayIndex: 4, type: 'handoff', submittedAt: '2025-12-23T20:00:00.000000Z' }, { submissionId: 62, candidateSessionId: 2, taskId: 62, dayIndex: 4, type: 'handoff', submittedAt: '2025-12-23T21:00:00.000000Z' }] });
      if (url === '/api/submissions/62') return jsonResponse({ submissionId: 62, candidateSessionId: 2, task: { taskId: 62, dayIndex: 4, type: 'handoff', title: 'Newest Handoff', prompt: null }, contentText: null, code: null, testResults: null, handoff: { recordingId: 'rec_62', downloadUrl: 'https://cdn.example.com/rec_62.mp4', transcript: { status: 'ready', text: null, segments: [{ startMs: 0, endMs: 1200, text: 'handoff intro' }] } }, submittedAt: '2025-12-23T21:00:00.000000Z' });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/Newest Handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 4 playback/i)).toBeInTheDocument();
    const calledUrls = fetchMock.mock.calls.map((call) => getRequestUrl(call[0]));
    expect(calledUrls).toContain('/api/submissions/62');
    expect(calledUrls).not.toContain('/api/submissions/60');
    expect(calledUrls).not.toContain('/api/submissions/61');
  });
});
