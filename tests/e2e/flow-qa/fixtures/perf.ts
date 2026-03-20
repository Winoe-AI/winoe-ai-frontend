import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

type MeasureOptions = {
  page: Page;
  path: string;
  ready: Locator;
  budgetMs: number;
  annotation: string;
  responseUrlPart?: string;
  expectedStatus?: number;
};

const PERF_PROJECT_NAME = 'perf-serial';

export function annotatePerf(metric: string, loadMs: number): void {
  test.info().annotations.push({
    type: metric,
    description: String(loadMs),
  });
}

export function assertPerfBudget(loadMs: number, budgetMs: number): void {
  const projectName = test.info().project.name;
  const enforceFromEnv = process.env.QA_ENFORCE_PERF_BUDGETS === '1';
  if (projectName !== PERF_PROJECT_NAME && !enforceFromEnv) return;
  expect(loadMs).toBeLessThan(budgetMs);
}

export async function gotoWithPerf(options: MeasureOptions): Promise<{
  loadMs: number;
  response: Response | null;
}> {
  const start = Date.now();
  let response: Response | null = null;

  if (options.responseUrlPart) {
    const [matched] = await Promise.all([
      options.page.waitForResponse(
        (resp) =>
          resp.url().includes(options.responseUrlPart as string) &&
          resp.status() === (options.expectedStatus ?? 200),
      ),
      options.page.goto(options.path),
    ]);
    response = matched;
  } else {
    await options.page.goto(options.path);
  }

  await expect(options.ready).toBeVisible();

  const loadMs = Date.now() - start;
  annotatePerf(options.annotation, loadMs);
  assertPerfBudget(loadMs, options.budgetMs);
  return { loadMs, response };
}
