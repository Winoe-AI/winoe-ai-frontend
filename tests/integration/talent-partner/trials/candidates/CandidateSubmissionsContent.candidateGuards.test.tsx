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

describe('CandidateSubmissionsPage - candidate guards', () => {
  it('blocks submissions when candidate lookup fails', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    const fetchMock = installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1/candidates')
        return textResponse('no candidate', 500);
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    expect(
      await screen.findByText(/Unable to verify candidate access/i),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.map((call) => getRequestUrl(call[0]))).toEqual([
      '/api/trials/1/candidates',
    ]);
  });

  it('blocks submissions when candidate is not in the trial', async () => {
    setMockParams({ id: '1', candidateSessionId: '2' });
    const fetchMock = installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 9,
            inviteEmail: 'other@example.com',
            candidateName: 'Other',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('Not found', 404);
    });
    render(<CandidateSubmissionsPage />);
    expect(
      await screen.findByText(/Candidate not found for this trial/i),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.map((call) => getRequestUrl(call[0]))).toEqual([
      '/api/trials/1/candidates',
    ]);
  });

  it('blocks submissions when candidate id is invalid', async () => {
    setMockParams({ id: '1', candidateSessionId: 'abc' });
    const fetchMock = installFetchMock(async () =>
      textResponse('Not found', 404),
    );
    render(<CandidateSubmissionsPage />);
    expect(
      await screen.findByText(/Invalid candidate id/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
