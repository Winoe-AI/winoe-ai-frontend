import {
  TalentPartnerTrialDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  trialDetailResponse,
  trialListResponse,
  textResponse,
  userEvent,
  waitFor,
} from './TrialDetailContent.testlib';

describe('TalentPartnerTrialDetailPage - copy invite', () => {
  it('lets talent_partners copy invite links from the table', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 42,
            inviteEmail: 'copy@example.com',
            candidateName: 'Copy Cat',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
            inviteUrl: 'https://example.com/invite/token-123',
            inviteEmailStatus: 'sent',
            inviteEmailSentAt: '2025-12-23T10:00:00.000000Z',
          },
        ]);
      return textResponse('Not found', 404);
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(<TalentPartnerTrialDetailPage />);
    const copyBtn = await screen.findByRole('button', {
      name: /copy invite link/i,
    });
    await user.click(copyBtn);
    await waitFor(() => expect(copyBtn).toHaveTextContent(/copied/i));
  });

  it('shows copy invite button even when invite URL is missing and surfaces error', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 12,
            inviteEmail: 'nolink@example.com',
            candidateName: 'No Link',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
            inviteEmailStatus: 'sent',
            inviteEmailSentAt: '2025-12-23T10:00:00.000000Z',
            inviteUrl: null,
            inviteToken: null,
          },
        ]);
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    const copyBtn = await screen.findByRole('button', {
      name: /copy invite link/i,
    });
    expect(copyBtn).toBeDisabled();
    expect(
      screen.getByText(/Invite link unavailable — resend invite or refresh/i),
    ).toBeInTheDocument();
  });
});
