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

describe('TalentPartnerTrialDetailPage - scenario actions', () => {
  it('shows regenerate confirmation for locked scenarios', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': jsonResponse({
        id: 'trial-1',
        status: 'active_inviting',
        title: 'Trial trial-1',
        templateKey: 'python-fastapi',
        scenario: {
          id: 101,
          versionIndex: 2,
          status: 'ready',
          lockedAt: '2026-03-01T12:00:00.000Z',
        },
        tasks: [
          {
            dayIndex: 1,
            title: 'Discovery',
            description: 'Define requirements.',
          },
        ],
      }),
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/trials/trial-1/scenario/regenerate': jsonResponse({
        scenarioVersionId: 102,
        jobId: 'job-1',
        status: 'generating',
      }),
    });

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /Trial actions menu/i }),
    );
    const regenerateBtn = await screen.findByTestId(
      'regenerate-scenario-trigger',
    );
    expect(regenerateBtn).not.toBeDisabled();
    fireEvent.click(regenerateBtn);
    const dialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    expect(
      fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/scenario/regenerate',
      ).length,
    ).toBe(0);

    await user.click(within(dialog).getByRole('button', { name: /Cancel/i }));
    const regenerateBtnAgain = screen.getByTestId(
      'regenerate-scenario-trigger',
    );
    fireEvent.click(regenerateBtnAgain);
    const confirmDialog = await screen.findByRole('dialog', {
      name: /Confirm scenario regenerate/i,
    });
    await user.click(
      within(confirmDialog).getByRole('button', { name: /^Regenerate$/i }),
    );

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/scenario/regenerate',
      );
      expect(calls.length).toBe(1);
    });
  });

  it('calls approve endpoint when Approve is used', async () => {
    const user = userEvent.setup();

    mockFetchHandlers({
      '/api/trials': jsonResponse([
        {
          id: 'trial-1',
          title: 'Trial trial-1',
          templateKey: 'python-fastapi',
        },
      ]),
      '/api/trials/trial-1': jsonResponse({
        id: 'trial-1',
        status: 'ready_for_review',
        title: 'Trial trial-1',
        templateKey: 'python-fastapi',
        scenario: { id: '10', versionIndex: 1, status: 'ready' },
        tasks: [
          {
            dayIndex: 1,
            title: 'Discovery',
            description: 'Define requirements.',
          },
        ],
      }),
      '/api/trials/trial-1/candidates': jsonResponse([]),
      '/api/trials/trial-1/scenario/10/approve': jsonResponse(
        { message: 'Approve failed' },
        500,
      ),
    });

    renderPage();
    await user.click(
      await screen.findByRole('button', {
        name: /Approve v1/i,
      }),
    );
    await waitFor(() => {
      const approveCalls = fetchMock.mock.calls.filter(
        (call) => getUrl(call[0]) === '/api/trials/trial-1/scenario/10/approve',
      );
      expect(approveCalls.length).toBe(1);
    });
  });
});
