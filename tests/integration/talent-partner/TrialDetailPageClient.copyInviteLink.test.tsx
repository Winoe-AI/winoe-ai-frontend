import {
  jsonResponse,
  mockFetchHandlers,
  renderPage,
  screen,
  userEvent,
} from './TrialDetailPageClient.testlib';

describe('TalentPartnerTrialDetailPage - copy invite link', () => {
  it('copies invite links and shows manual fallback when clipboard fails', async () => {
    const user = userEvent.setup();
    const clipboardWrite = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWrite },
      configurable: true,
    });

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
          inviteUrl: 'https://example.com/invite',
          startedAt: null,
          completedAt: null,
          hasReport: false,
        },
      ]),
    });

    renderPage();
    await user.click(
      await screen.findByRole('button', { name: /Copy invite link/i }),
    );
    expect(clipboardWrite).toHaveBeenCalled();
    const copiedMessages = await screen.findAllByText(/Invite link copied/i);
    expect(copiedMessages.length).toBeGreaterThan(0);

    clipboardWrite.mockRejectedValueOnce(new Error('nope'));
    await user.click(
      screen.getByRole('button', { name: /Copied|Copy invite link/i }),
    );
    expect(
      await screen.findByLabelText(/Manual invite link/i),
    ).toBeInTheDocument();
  });
});
