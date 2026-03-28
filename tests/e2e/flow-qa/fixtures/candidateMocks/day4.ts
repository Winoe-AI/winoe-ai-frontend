import type { Page } from '@playwright/test';
import type { Day4HandoffMockState } from './types';
import { fulfillJson } from './shared';
import { handleDay4BackendRoute } from './day4BackendRoute';

export async function installCandidateDay4HandoffMocks(
  page: Page,
  options?: { token?: string; candidateSessionId?: number; taskId?: number },
): Promise<Day4HandoffMockState> {
  const token = options?.token ?? 'test-token';
  const candidateSessionId = options?.candidateSessionId ?? 77;
  const taskId = options?.taskId ?? 4;
  const state: Day4HandoffMockState = { completeBody: null, initBody: null };
  let completed = false;
  let deleted = false;
  let statusAfterCompleteCalls = 0;

  await page.route('**/api/backend/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const pathname = new URL(request.url()).pathname;
    const next = await handleDay4BackendRoute(route, {
      pathname,
      method,
      token,
      candidateSessionId,
      taskId,
      completed,
      deleted,
      statusAfterCompleteCalls,
      state,
    });
    completed = next.completed;
    deleted = next.deleted;
    statusAfterCompleteCalls = next.statusAfterCompleteCalls;
    if (next.handled) return;
    await fulfillJson(
      route,
      { message: `Unhandled handoff route ${pathname}` },
      404,
    );
  });

  await page.route('https://storage.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });
  await page.route('https://cdn.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });
  return state;
}
