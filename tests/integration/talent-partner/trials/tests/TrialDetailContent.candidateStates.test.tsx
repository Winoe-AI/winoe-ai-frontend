import {
  TalentPartnerTrialDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  trialDetailResponse,
  textResponse,
  waitFor,
} from './TrialDetailContent.testlib';

describe('TalentPartnerTrialDetailPage - candidate state rendering', () => {
  it('renders empty state when there are no candidates', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials')
        return jsonResponse([
          { id: '1', title: 'Trial 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates') return jsonResponse([]);
      return textResponse('Not found', 404);
    });

    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/No candidates yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeInTheDocument();
  });

  it('shows not started status, unnamed fallback, and text error fallback', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials')
        return jsonResponse([
          { id: '1', title: 'Trial 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 9,
            inviteEmail: null,
            candidateName: null,
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('fallback error', 500);
    });

    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(screen.getByText('Unnamed')).toBeInTheDocument(),
    );
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });
});
