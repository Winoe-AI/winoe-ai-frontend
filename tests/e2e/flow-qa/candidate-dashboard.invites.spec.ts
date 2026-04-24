import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { installCandidateInvitesMocks } from './fixtures/candidateMocks';

test.describe('Candidate dashboard invite listing', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('renders the 5-day trial states and review CTA variants', async ({
    page,
  }) => {
    await installCandidateInvitesMocks(page, {
      invites: [
        {
          candidateSessionId: 1,
          token: 'token-invited',
          title: 'Invited Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'not_started',
          progress: null,
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 2,
          token: 'token-awaiting',
          title: 'Awaiting Start Date Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'in_progress',
          progress: { completed: 0, total: 5 },
          scheduledStartAt: '2026-04-26T03:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 3,
          token: 'token-scheduled',
          title: 'Scheduled Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'in_progress',
          progress: { completed: 0, total: 5 },
          scheduledStartAt: '2026-04-23T03:00:00.000Z',
          dayWindows: [
            {
              dayIndex: 1,
              windowStartAt: '2026-04-25T03:00:00.000Z',
              windowEndAt: '2026-04-25T11:00:00.000Z',
            },
          ],
          currentDayWindow: {
            dayIndex: 1,
            windowStartAt: '2026-04-25T03:00:00.000Z',
            windowEndAt: '2026-04-25T11:00:00.000Z',
            state: 'upcoming',
          },
          scheduleLockedAt: '2026-04-24T03:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 4,
          token: 'token-open',
          title: 'Day Open Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'in_progress',
          progress: { completed: 1, total: 5 },
          currentDayWindow: {
            dayIndex: 2,
            windowStartAt: '2026-04-24T01:00:00.000Z',
            windowEndAt: '2026-04-24T09:00:00.000Z',
            state: 'active',
          },
          scheduleLockedAt: '2026-04-24T00:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 5,
          token: 'token-closed',
          title: 'Day Closed Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'in_progress',
          progress: { completed: 2, total: 5 },
          currentDayWindow: {
            dayIndex: 5,
            windowStartAt: '2026-04-23T03:00:00.000Z',
            windowEndAt: '2026-04-23T11:00:00.000Z',
            state: 'closed',
          },
          scheduleLockedAt: '2026-04-24T00:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 6,
          token: 'token-complete',
          title: 'Complete Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'completed',
          progress: { completed: 5, total: 5 },
          completedAt: '2026-04-24T02:00:00.000Z',
          scheduleLockedAt: '2026-04-24T00:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 7,
          token: 'token-report-ready',
          title: 'Report Ready Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'completed',
          progress: { completed: 5, total: 5 },
          reportReady: true,
          hasReport: true,
          scheduleLockedAt: '2026-04-24T00:00:00.000Z',
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
        {
          candidateSessionId: 8,
          token: 'token-terminated',
          title: 'Terminated Trial',
          role: 'Backend Engineer',
          companyName: 'QA180 Co',
          talentPartnerName: 'Talent Partner',
          status: 'in_progress',
          progress: { completed: 0, total: 5 },
          terminatedAt: '2026-04-24T03:00:00.000Z',
          isTerminated: true,
          expiresAt: null,
          lastActivityAt: '2026-04-24T03:00:00.000Z',
          isExpired: false,
        },
      ],
    });

    await page.goto('/candidate/dashboard');

    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /your invitations/i }),
    ).toBeVisible();

    await expect(page.getByText('Invited Trial')).toBeVisible();
    await expect(page.getByText('Awaiting Start Date Trial')).toBeVisible();
    await expect(page.getByText('Scheduled Trial')).toBeVisible();
    await expect(page.getByText('Day Open Trial')).toBeVisible();
    await expect(page.getByText('Day Closed Trial')).toBeVisible();
    await expect(page.getByText('Complete Trial')).toBeVisible();
    await expect(page.getByText('Report Ready Trial')).toBeVisible();
    await expect(page.getByText('Terminated Trial')).toBeVisible();

    await expect(page.getByText('Invited', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Awaiting start date', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Scheduled', { exact: true })).toBeVisible();
    await expect(page.getByText('Day 2 open', { exact: true })).toBeVisible();
    await expect(page.getByText('Day 5 closed', { exact: true })).toBeVisible();
    await expect(page.getByText('Complete', { exact: true })).toBeVisible();
    await expect(page.getByText('Report ready', { exact: true })).toBeVisible();
    await expect(page.getByText('Terminated', { exact: true })).toBeVisible();

    await expect(page.getByText('Progress: 1/5', { exact: true })).toHaveCount(
      1,
    );
    await expect(page.getByText('Progress: 2/5', { exact: true })).toHaveCount(
      1,
    );
    await expect(page.getByText('Progress: 5/5', { exact: true })).toHaveCount(
      2,
    );

    await expect(
      page.getByRole('button', { name: 'Review submissions' }),
    ).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Ended' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Ended' })).toBeDisabled();

    await expect(page.getByText(/this trial has ended/i)).toBeVisible();
  });
});
