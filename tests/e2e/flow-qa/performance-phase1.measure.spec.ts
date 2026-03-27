import { expect, test } from '@playwright/test';
import { PERF_MODE } from './performance-phase1/config';
import { runPerformancePass } from './performance-phase1/runPass';

test.describe.configure({ mode: 'serial' });

test.describe('@perf Performance Pass 2 Baseline', () => {
  test('captures full-route and interaction medians with raw samples', async ({ browser }) => {
    test.setTimeout(3_600_000);
    const { routes, pageMedian } = await runPerformancePass(browser);
    const successfulRouteCount = pageMedian.filter((entry) => entry.status === 'ok' || entry.status === 'partial').length;
    if (PERF_MODE === 'mock') expect(successfulRouteCount).toBe(routes.length);
    else expect(successfulRouteCount).toBeGreaterThan(0);
  });
});
