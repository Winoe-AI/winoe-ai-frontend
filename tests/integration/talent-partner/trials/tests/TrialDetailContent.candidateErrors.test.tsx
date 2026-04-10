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

describe('TalentPartnerTrialDetailPage - candidate error handling', () => {
  it('renders error state when candidates request fails', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials')
        return jsonResponse([
          { id: '1', title: 'Trial 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse({ message: 'Boom' }, 500);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('uses text fallback when candidates request fails with text/plain', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials')
        return jsonResponse([
          { id: '1', title: 'Trial 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return textResponse('Plain failure', 500);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(screen.getByText('Request failed')).toBeInTheDocument(),
    );
  });

  it('handles thrown fetch errors gracefully', async () => {
    installFetchMock(async () => {
      throw new Error('network fail');
    });
    render(<TalentPartnerTrialDetailPage />);
    expect(
      (await screen.findAllByText(/network fail/i)).length,
    ).toBeGreaterThan(0);
  });

  it('uses default error when fetch throws non-error value', async () => {
    installFetchMock(async () => {
      throw 'boom';
    });
    render(<TalentPartnerTrialDetailPage />);
    expect(await screen.findByText('Request failed')).toBeInTheDocument();
  });

  it('shows friendly error when talent_partner is unauthorized', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials')
        return jsonResponse([
          { id: '1', title: 'Trial 1', templateKey: 'python-fastapi' },
        ]);
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse({ detail: 'No access' }, 403);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    expect(
      await screen.findByText('You are not authorized to view candidates.'),
    ).toBeInTheDocument();
    expect(await screen.findByText(/5-day trial plan/i)).toBeInTheDocument();
  });
});
