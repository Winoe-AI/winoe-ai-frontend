import type { Route } from '@playwright/test';
import type { PollStatusMock } from './types';

export function nowIso() {
  return new Date().toISOString();
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export function withDefaults(result: PollStatusMock): Record<string, unknown> {
  return {
    status: result.status,
    message: result.message,
    passed: result.passed ?? null,
    failed: result.failed ?? null,
    total: result.total ?? null,
    stdout: result.stdout ?? null,
    stderr: result.stderr ?? null,
    workflowUrl: result.workflowUrl ?? null,
    commitSha: result.commitSha ?? null,
  };
}
