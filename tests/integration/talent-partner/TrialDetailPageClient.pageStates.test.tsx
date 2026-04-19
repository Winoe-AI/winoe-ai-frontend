import {
  fetchMock,
  getUrl,
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - page states', () => {
  it('shows page-level not found state and skips candidates/actions on 404', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': jsonResponse({ message: 'Not found' }, 404),
    });

    renderPage();

    expect(await screen.findByText(/Trial not found/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Approve v\d+/i }),
    ).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/trials/trial-1/candidates');
  });

  it('shows page-level access denied state and skips candidates/actions on 403', async () => {
    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': jsonResponse({ message: 'Forbidden' }, 403),
    });

    renderPage();

    expect(
      await screen.findByText(/You don't have access to this trial/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Invite candidate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Approve v\d+/i }),
    ).not.toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map((call) => getUrl(call[0]));
    expect(calledUrls).not.toContain('/api/trials/trial-1/candidates');
  });
});
