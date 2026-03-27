import type { Page } from '@playwright/test';
import type { CandidateInvitesMockOptions } from './types';
import { fulfillJson } from './shared';

export function defaultCandidateInvites() {
  return [
    {
      candidateSessionId: 77,
      token: 'test-token',
      title: 'Frontend Platform Modernization',
      role: 'Senior Frontend Engineer',
      status: 'in_progress',
      progress: { completed: 2, total: 5 },
      expiresAt: null,
      lastActivityAt: '2026-03-18T10:00:00.000Z',
      isExpired: false,
    },
  ];
}

export async function installCandidateInvitesMocks(
  page: Page,
  options: CandidateInvitesMockOptions = {},
) {
  await page.route('**/api/backend/candidate/invites**', async (route) => {
    const request = route.request();
    if (request.method().toUpperCase() !== 'GET') {
      await fulfillJson(
        route,
        { message: `Unhandled method for invites mock: ${request.method()}` },
        405,
      );
      return;
    }
    if (options.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
    if ((options.status ?? 200) >= 400) {
      await fulfillJson(
        route,
        { message: options.message ?? 'Unable to load invites.' },
        options.status ?? 500,
      );
      return;
    }
    await fulfillJson(route, options.invites ?? defaultCandidateInvites(), 200);
  });
}
