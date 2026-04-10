import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  params,
  renderPage,
  screen,
  waitFor,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - overview safety defaults', () => {
  it('does not fetch or render submission content on trial overview', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([
        {
          candidateSessionId: 33,
          inviteEmail: 'c@example.com',
          candidateName: 'Casey',
          status: 'in_progress',
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
          contentText: 'secret submission',
          testResults: { passed: true },
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText('Casey')).toBeInTheDocument();
    expect(screen.queryByText(/secret submission/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\"passed\": true/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Text answer/i)).not.toBeInTheDocument();
    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls.some((url) => url.startsWith('/api/submissions'))).toBe(
      false,
    );
  });

  it('renders safe defaults when optional fields are missing', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([
        {
          candidateSessionId: 11,
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    });
    renderPage();
    expect(await screen.findByText('Not verified')).toBeInTheDocument();
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('handles an empty candidates response without rendering candidate rows', async () => {
    params.id = 'trial-empty';
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-empty',
          title: 'Trial trial-empty',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-empty/candidates': jsonResponse([]),
    });
    renderPage();
    await waitFor(() => {
      const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
      expect(calledUrls).toContain('/api/trials/trial-empty/candidates');
    });
    expect(screen.queryByText('Casey')).not.toBeInTheDocument();
  });

  it('renders error message when the backend call fails', async () => {
    params.id = 'trial-err';
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-err',
          title: 'Trial trial-err',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-err/candidates': jsonResponse(
        { message: 'Auth failed' },
        500,
      ),
    });
    renderPage();
    expect(await screen.findByText(/Auth failed/i)).toBeInTheDocument();
  });
});
