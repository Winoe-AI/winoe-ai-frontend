import { fireEvent } from '@testing-library/react';
import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
  within,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - invite create modal', () => {
  it('sends a batch invite and shows copyable links', async () => {
    const user = userEvent.setup();
    const candidateResponses = [
      jsonResponse([]),
      jsonResponse([
        {
          candidateSessionId: 99,
          inviteEmail: 'new@example.com',
          candidateName: 'New Person',
          status: 'not_started',
          inviteEmailStatus: 'sent',
          inviteEmailSentAt: '2025-12-24T12:00:00.000000Z',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    ];

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': () =>
        candidateResponses.shift() ?? jsonResponse([]),
      '/api/trials/trial-1/invite-candidates': jsonResponse({
        invites: [
          {
            candidateSessionId: '99',
            name: 'New Person',
            email: 'new@example.com',
            inviteUrl: 'https://example.com/candidate/session/invite-token',
            status: 'sent',
          },
        ],
      }),
    });

    renderPage();
    await screen.findByText(/No candidates invited yet/i);
    await waitFor(() =>
      expect(screen.getByTestId('invite-candidates-header')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('invite-candidates-header'));
    await screen.findByLabelText(/Full name \(row 1\)/i);
    await user.type(
      screen.getByLabelText(/Full name \(row 1\)/i),
      'New Person',
    );
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'new@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));
    expect(
      await screen.findByTestId('invite-batch-success'),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText(/Invite URL for new@example.com/i),
    ).toHaveValue('https://example.com/candidate/session/invite-token');
    const success = await screen.findByTestId('invite-batch-success');
    expect(within(success).getByText('New Person')).toBeInTheDocument();
    expect(await screen.findByText(/1 invite sent/i)).toBeInTheDocument();
  });

  it('reopens the modal to a clean idle form after success', async () => {
    const user = userEvent.setup();
    const candidateResponses = [
      jsonResponse([]),
      jsonResponse([
        {
          candidateSessionId: 99,
          inviteEmail: 'new@example.com',
          candidateName: 'New Person',
          status: 'not_started',
          inviteEmailStatus: 'sent',
          inviteEmailSentAt: null,
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    ];

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': () =>
        candidateResponses.shift() ?? jsonResponse([]),
      '/api/trials/trial-1/invite-candidates': jsonResponse({
        invites: [
          {
            candidateSessionId: '99',
            name: 'New Person',
            email: 'new@example.com',
            inviteUrl: 'https://example.com/candidate/session/invite-token',
            status: 'sent',
          },
        ],
      }),
    });

    renderPage();
    await screen.findByText(/No candidates invited yet/i);
    await waitFor(() =>
      expect(screen.getByTestId('invite-candidates-header')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('invite-candidates-header'));
    await screen.findByLabelText(/Full name \(row 1\)/i);
    await user.type(
      screen.getByLabelText(/Full name \(row 1\)/i),
      'New Person',
    );
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'new@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(
      await screen.findByTestId('invite-batch-success'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Done/i }));

    await waitFor(() =>
      expect(screen.getByTestId('invite-candidates-header')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('invite-candidates-header'));
    await screen.findByLabelText(/Full name \(row 1\)/i);
    expect(screen.getByLabelText(/Full name \(row 1\)/i)).toHaveValue('');
    expect(screen.getByLabelText(/Email \(row 1\)/i)).toHaveValue('');
    expect(
      screen.queryByTestId('invite-batch-success'),
    ).not.toBeInTheDocument();
  });

  it('does not pre-check candidates when opening the invite modal', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/trials/trial-1/invite-candidates': jsonResponse({
        invites: [
          {
            candidateSessionId: '99',
            name: 'New Person',
            email: 'new@example.com',
            inviteUrl: 'https://example.com/candidate/session/invite-token',
            status: 'sent',
          },
        ],
      }),
    });

    renderPage();
    await screen.findByText(/No candidates invited yet/i);

    const candidatesUrl = '/api/trials/trial-1/candidates';
    const candidateCallsBefore = fetchMock.mock.calls.filter(
      (call) => getUrl(call[0]) === candidatesUrl,
    ).length;

    await waitFor(() =>
      expect(screen.getByTestId('invite-candidates-header')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('invite-candidates-header'));
    await screen.findByLabelText(/Full name \(row 1\)/i);
    await waitFor(() => {
      const candidateCallsAfterOpen = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === candidatesUrl,
      ).length;
      expect(candidateCallsAfterOpen).toBeLessThanOrEqual(
        candidateCallsBefore + 1,
      );
    });

    await user.type(
      screen.getByLabelText(/Full name \(row 1\)/i),
      'New Person',
    );
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'new@example.com',
    );
    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    await waitFor(() => {
      const inviteCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/invite-candidates',
      ).length;
      expect(inviteCalls).toBe(1);
    });
  });
});
