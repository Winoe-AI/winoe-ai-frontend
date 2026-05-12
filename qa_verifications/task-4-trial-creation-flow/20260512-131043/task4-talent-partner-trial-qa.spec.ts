import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const outDir = path.join(__dirname, 'screenshots');
const artifacts = path.join(__dirname, 'artifacts');

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
});

test('Task 4 — Talent Partner trial wizard (happy path + request shape)', async ({
  page,
}) => {
  const postBodies: unknown[] = [];
  page.on('request', (req) => {
    if (
      req.method() === 'POST' &&
      req.url().includes('/api/v1/trials') &&
      !req.url().includes('generation')
    ) {
      try {
        postBodies.push(JSON.parse(req.postData() || '{}'));
      } catch {
        postBodies.push(req.postData());
      }
    }
  });

  await page.goto(
    '/api/dev/qa-login?role=talent_partner&returnTo=%2Fdashboard',
    { waitUntil: 'networkidle' },
  );
  await expect(page).toHaveURL(/\/dashboard/);
  await page.screenshot({
    path: path.join(outDir, '01-dashboard.png'),
    fullPage: true,
  });

  await page.getByRole('link', { name: 'New Trial' }).click();
  await expect(page).toHaveURL(/\/talent-partner\/trials\/new/);
  await page.screenshot({
    path: path.join(outDir, '01b-dashboard-header-new-trial.png'),
    fullPage: true,
  });
  await page.goto('/dashboard', { waitUntil: 'networkidle' });

  await page.goto('/talent-partner/trials/new', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'New Trial' })).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, '02-canonical-trials-new.png'),
    fullPage: true,
  });

  await page.goto('/dashboard/trials/new', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'New Trial' })).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, '03-legacy-dashboard-trials-new.png'),
    fullPage: true,
  });

  await page.goto('/talent-partner/trials/new', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'New Trial' })).toBeVisible();

  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueBtn).toBeDisabled();
  await page.getByLabel(/Role title/i).fill('Senior Backend Engineer');
  await page.locator('#seniority').selectOption({ label: 'Senior' });
  await expect(continueBtn).toBeEnabled();
  await page
    .getByLabel(/Preferred language\/framework/i)
    .fill('Python + FastAPI');
  await page.screenshot({
    path: path.join(outDir, '04-step1-filled.png'),
    fullPage: true,
  });

  await continueBtn.click();
  await expect(page.getByText('Context', { exact: true })).toBeVisible();
  const genBtn = page.getByRole('button', { name: 'Generate Trial preview' });
  await expect(genBtn).toBeDisabled();
  await page
    .getByLabel(/Tell Winoe about the work/i)
    .fill(
      'This engineer will build internal workflow APIs for operations teams. They need to design clear service boundaries, model data carefully, handle errors cleanly, and communicate tradeoffs. We want to see pragmatic architecture, testing discipline, and thoughtful documentation.',
    );
  for (const label of [
    'System design',
    'API design',
    'Testing discipline',
    'Error handling',
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  await expect(genBtn).toBeEnabled();
  await page.screenshot({
    path: path.join(outDir, '05-step2-filled.png'),
    fullPage: true,
  });

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/trials') &&
        res.request().method() === 'POST' &&
        (res.status() === 202 || res.status() === 200),
    ),
    genBtn.click(),
  ]);

  expect(postBodies.length).toBeGreaterThanOrEqual(1);
  const body = postBodies[postBodies.length - 1] as Record<string, unknown>;
  fs.writeFileSync(
    path.join(artifacts, 'create-trial-post-body.json'),
    JSON.stringify(body, null, 2),
  );
  expect(body.role_title).toBe('Senior Backend Engineer');
  expect(body.seniority).toBe('senior');
  expect(body.preferred_language_framework).toBe('Python + FastAPI');
  expect(typeof body.focus_notes).toBe('string');
  expect(body.evaluation_focus_areas).toEqual([
    'System design',
    'API design',
    'Testing discipline',
    'Error handling',
  ]);
  for (const legacy of [
    'template_key',
    'template_repository',
    'template_repo',
    'tech_stack',
    'techStack',
  ]) {
    expect(body).not.toHaveProperty(legacy);
  }

  await expect(
    page.getByRole('heading', { name: 'Drafting your Trial' }),
  ).toBeVisible({
    timeout: 120_000,
  });
  await page.screenshot({
    path: path.join(outDir, '06-generation-loading-early.png'),
    fullPage: true,
  });

  await page.waitForTimeout(10_000);
  await page.screenshot({
    path: path.join(outDir, '07-generation-loading-mid.png'),
    fullPage: true,
  });

  await expect(page).toHaveURL(/\/talent-partner\/trials\/[^/]+\/preview/, {
    timeout: 240_000,
  });
  await page.screenshot({
    path: path.join(outDir, '08-preview-after-redirect.png'),
    fullPage: true,
  });

  const idMatch = page.url().match(/\/trials\/([^/]+)\/preview/);
  const trialId = idMatch?.[1] ?? '';
  expect(trialId).toBeTruthy();
  fs.writeFileSync(
    path.join(artifacts, 'created-trial-id.txt'),
    `${trialId}\n`,
  );
});

test('Task 4 — SSE / stream failure surfaces reconnect or loss copy', async ({
  page,
}) => {
  await page.route('**/api/v1/trials/*/generation-progress**', (route) =>
    route.abort('failed'),
  );

  await page.goto(
    '/api/dev/qa-login?role=talent_partner&returnTo=%2Fdashboard',
    { waitUntil: 'networkidle' },
  );
  await page.goto('/talent-partner/trials/new', { waitUntil: 'networkidle' });

  await page.getByLabel(/Role title/i).fill('Senior Backend Engineer');
  await page.locator('#seniority').selectOption({ label: 'Senior' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .getByLabel(/Tell Winoe about the work/i)
    .fill(
      'This engineer will build internal workflow APIs for operations teams. They need to design clear service boundaries, model data carefully, handle errors cleanly, and communicate tradeoffs. We want to see pragmatic architecture, testing discipline, and thoughtful documentation.',
    );
  await page
    .getByRole('button', { name: 'System design', exact: true })
    .click();

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/trials') &&
        res.request().method() === 'POST' &&
        (res.status() === 202 || res.status() === 200),
    ),
    page.getByRole('button', { name: 'Generate Trial preview' }).click(),
  ]);

  await expect(
    page.getByText(/Reconnecting to Winoe|We lost the connection/i),
  ).toBeVisible({ timeout: 120_000 });
  await page.screenshot({
    path: path.join(outDir, '09-failure-stream-abort.png'),
    fullPage: true,
  });
});
