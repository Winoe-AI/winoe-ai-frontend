import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
  waitFor,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - candidate rows and gating', () => {
  it('renders candidate rows with status badges', async () => {
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
          candidateSessionId: '11',
          inviteEmail: 'a@example.com',
          candidateName: 'Alex',
          status: 'in_progress',
          inviteEmailStatus: 'rate_limited',
          verificationStatus: 'pending',
          progressSummary: { currentDay: '2', totalDays: '5' },
          startedAt: '2025-01-01T00:00:00Z',
          completedAt: null,
          hasReport: false,
        },
        {
          candidateSessionId: 22,
          inviteEmail: 'b@example.com',
          candidateName: 'Blake',
          status: 'completed',
          verificationStatus: 'awaiting_email',
          startedAt: '2025-01-02T00:00:00Z',
          completedAt: '2025-01-03T00:00:00Z',
          hasReport: true,
        },
      ]),
    });

    renderPage();

    expect(await screen.findByText(/Trial ID: trial-1/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Project brief narrative/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Preferred language\/framework/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Node\.js \+ Postgres/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Alex')).toBeInTheDocument();
    expect(await screen.findByText('Blake')).toBeInTheDocument();
    expect(await screen.findByText(/In progress/i)).toBeInTheDocument();
    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(await screen.findByText('Rate limited')).toBeInTheDocument();
    expect(await screen.findByText('awaiting email')).toBeInTheDocument();
    expect(await screen.findByText('2 / 5')).toBeInTheDocument();
    const completed = await screen.findAllByText(/Completed/i);
    expect(completed.length).toBeGreaterThanOrEqual(2);
  });

  it('gates approve and invite actions by lifecycle status', async () => {
    const user = userEvent.setup();
    let detailFetchCount = 0;

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': () => {
        detailFetchCount += 1;
        if (detailFetchCount === 1)
          return jsonResponse({
            id: 'trial-1',
            status: 'ready_for_review',
            title: 'Trial trial-1',
            templateKey: 'python-fastapi',
            scenario: { id: 10, versionIndex: 1, status: 'ready' },
            tasks: [
              {
                dayIndex: 1,
                title: 'Discovery',
                description: 'Define requirements.',
              },
            ],
          });
        return jsonResponse({
          id: 'trial-1',
          status: 'approved',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
          scenario: { id: 10, versionIndex: 1, status: 'approved' },
          tasks: [
            {
              dayIndex: 1,
              title: 'Discovery',
              description: 'Define requirements.',
            },
          ],
        });
      },
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/trials/trial-1/scenario/10/approve': jsonResponse({
        trialId: 'trial-1',
        status: 'approved',
        activeScenarioVersionId: 10,
        pendingScenarioVersionId: null,
      }),
      '/api/trials/trial-1/activate': jsonResponse({
        trialId: 'trial-1',
        status: 'active_inviting',
        activeScenarioVersionId: 10,
        pendingScenarioVersionId: null,
      }),
    });

    renderPage();

    const approveBtn = await screen.findByRole('button', {
      name: /Approve v1/i,
    });
    const inviteBtn = await screen.findByRole('button', {
      name: /Invite candidate/i,
    });
    expect(approveBtn).toBeEnabled();
    expect(inviteBtn).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /Activate trial/i }),
    ).not.toBeInTheDocument();

    await user.click(approveBtn);
    await waitFor(() => {
      const approveCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/scenario/10/approve',
      );
      expect(approveCalls.length).toBe(1);
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /Approve v1/i }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Activate trial/i }),
      ).toBeInTheDocument(),
    );
    const activateBtn = await screen.findByRole('button', {
      name: /Activate trial/i,
    });
    expect(activateBtn).toBeEnabled();
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeDisabled();
    await user.click(activateBtn);
    await waitFor(() => {
      const activateCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/activate',
      );
      expect(activateCalls.length).toBe(1);
    });
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeEnabled();
  });
});
