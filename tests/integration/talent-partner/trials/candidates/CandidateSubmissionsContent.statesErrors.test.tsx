import {
  CandidateSubmissionsPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  setMockParams,
  textResponse,
  waitFor,
} from './CandidateSubmissionsContent.testlib';

describe('CandidateSubmissionsPage - states and errors', () => {
  it('renders empty state when candidate has no submissions', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 2,
            inviteEmail: 'jane@example.com',
            candidateName: 'Jane Doe',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
        ]);
      if (url.startsWith('/api/submissions?candidateSessionId=2'))
        return jsonResponse({ items: [] });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await waitFor(() =>
      expect(screen.getByText(/No submissions yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Refresh/i }),
    ).toBeInTheDocument();
  });

  it('renders error state when submissions list request fails', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS = 'true';
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          { candidateSessionId: 2, inviteEmail: 'jane@example.com' },
        ]);
      if (url.startsWith('/api/submissions?candidateSessionId=2'))
        return jsonResponse({ detail: 'Detailed failure' }, 500);
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await waitFor(() =>
      expect(screen.getByText('Detailed failure')).toBeInTheDocument(),
    );
  });

  it('uses fallback text when no content is captured in artifact', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 2,
            inviteEmail: 'jane@example.com',
            candidateName: 'Jane Doe',
            status: 'completed',
            startedAt: '2025-12-23T18:00:00.000000Z',
            completedAt: '2025-12-23T19:00:00.000000Z',
            hasReport: false,
          },
        ]);
      if (url.startsWith('/api/submissions?candidateSessionId=2'))
        return jsonResponse({
          items: [
            {
              submissionId: 9,
              candidateSessionId: 2,
              taskId: 9,
              dayIndex: 3,
              type: 'design',
              submittedAt: '2025-12-23T18:57:10.981202Z',
            },
          ],
        });
      if (url === '/api/submissions/9')
        return jsonResponse({
          submissionId: 9,
          candidateSessionId: 2,
          task: {
            taskId: 9,
            dayIndex: 3,
            type: 'design',
            title: 'No Content Task',
            prompt: 'Describe nothing',
          },
          contentText: null,
          code: { blob: '   ', repoPath: null },
          testResults: null,
          submittedAt: '2025-12-23T18:57:10.981202Z',
        });
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    await waitFor(() =>
      expect(
        screen.getAllByText(
          (content) =>
            content.includes('Day 3:') && content.includes('No Content Task'),
        ).length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByText('Describe nothing')).toBeInTheDocument();
    expect(
      screen.queryByText(
        /This is a code task; see GitHub artifacts and test results above./i,
      ),
    ).not.toBeInTheDocument();
  });
});
