import {
  TalentPartnerTrialDetailPage,
  act,
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

describe('TalentPartnerTrialDetailPage - resend invite rate limits', () => {
  it('disables resend and surfaces rate limit message', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 77,
            inviteEmail: 'rl@example.com',
            candidateName: 'Rate Limited',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
            inviteEmailStatus: 'failed',
            inviteEmailSentAt: null,
          },
        ]);
      if (url === '/api/trials/1/candidates/77/invite/resend') {
        expect(init?.method).toBe('POST');
        return jsonResponse(
          {
            candidateSessionId: 77,
            inviteEmailStatus: 'rate_limited',
            inviteEmailSentAt: null,
          },
          429,
        );
      }
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    const resendBtn = await screen.findByRole('button', {
      name: /resend invite/i,
    });
    await user.click(resendBtn);
    await waitFor(() =>
      expect(
        screen.getAllByText(/Retry in \d+s/i).length,
      ).toBeGreaterThanOrEqual(1),
    );
    expect(resendBtn).toBeDisabled();
  });

  it('clears rate limit after cooldown expires', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    installFetchMock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 55,
            inviteEmail: 'cool@example.com',
            candidateName: 'Cooldown Casey',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
            inviteEmailStatus: 'failed',
            inviteEmailSentAt: null,
          },
        ]);
      if (url === '/api/trials/1/candidates/55/invite/resend') {
        expect(init?.method).toBe('POST');
        return jsonResponse(
          {
            candidateSessionId: 55,
            inviteEmailStatus: 'rate_limited',
            inviteEmailSentAt: null,
          },
          429,
        );
      }
      return textResponse('Not found', 404);
    });
    render(<TalentPartnerTrialDetailPage />);
    const resendBtn = await screen.findByRole('button', {
      name: /resend invite/i,
    });
    await user.click(resendBtn);
    await waitFor(() => {
      expect(resendBtn).toBeDisabled();
      expect(
        screen.getAllByText(/Retry in \d+s/i).length,
      ).toBeGreaterThanOrEqual(1);
    });
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    await waitFor(() => expect(resendBtn).not.toBeDisabled());
    expect(screen.queryByText(/Retry in \d+s/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
