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
  waitFor,
  within,
} from './TrialDetailContent.testlib';

describe('TalentPartnerTrialDetailPage - candidate ordering', () => {
  it('sorts within status buckets by timestamps and email', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 10,
            inviteEmail: 'zeta@example.com',
            candidateName: 'Zeta',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
          {
            candidateSessionId: 11,
            inviteEmail: 'alpha@example.com',
            candidateName: 'Alpha',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            hasReport: false,
          },
          {
            candidateSessionId: 12,
            inviteEmail: 'oldcomplete@example.com',
            candidateName: 'Old Complete',
            status: 'completed',
            startedAt: '2025-12-23T08:00:00.000000Z',
            completedAt: '2025-12-23T09:00:00.000000Z',
            hasReport: false,
          },
          {
            candidateSessionId: 13,
            inviteEmail: 'newcomplete@example.com',
            candidateName: 'New Complete',
            status: 'completed',
            startedAt: '2025-12-23T10:00:00.000000Z',
            completedAt: '2025-12-23T11:00:00.000000Z',
            hasReport: false,
          },
          {
            candidateSessionId: 14,
            inviteEmail: 'oldprogress@example.com',
            candidateName: 'Old Progress',
            status: 'in_progress',
            startedAt: '2025-12-23T07:00:00.000000Z',
            completedAt: null,
            hasReport: false,
          },
          {
            candidateSessionId: 15,
            inviteEmail: 'newprogress@example.com',
            candidateName: 'New Progress',
            status: 'in_progress',
            startedAt: '2025-12-23T12:00:00.000000Z',
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('Not found', 404);
    });

    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(screen.getByTestId('candidate-row-13')).toBeInTheDocument(),
    );
    const orderedIds = ['13', '12', '15', '14', '11', '10'];
    orderedIds.forEach((id, index) => {
      const current = screen.getByTestId(`candidate-row-${id}`);
      const nextId = orderedIds[index + 1];
      if (!nextId) return;
      const next = screen.getByTestId(`candidate-row-${nextId}`);
      expect(
        current.compareDocumentPosition(next) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  it('renders derived status when timestamps conflict with backend status', async () => {
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials') return trialListResponse();
      if (url === '/api/trials/1') return trialDetailResponse();
      if (url === '/api/trials/1/candidates')
        return jsonResponse([
          {
            candidateSessionId: 20,
            inviteEmail: 'mismatch@example.com',
            candidateName: 'Mismatch Status',
            status: 'not_started',
            startedAt: '2025-12-23T11:00:00.000000Z',
            completedAt: null,
            hasReport: false,
          },
        ]);
      return textResponse('Not found', 404);
    });

    render(<TalentPartnerTrialDetailPage />);
    const row = await screen.findByTestId('candidate-row-20');
    expect(within(row).getByText('In progress')).toBeInTheDocument();
  });
});
