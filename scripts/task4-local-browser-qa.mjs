/**
 * Task 4 browser QA (localhost:3000 + backend :8000).
 *
 *   cd winoe-ai-frontend && node scripts/task4-local-browser-qa.mjs
 *
 * Optional: TASK4_QA_ARTIFACT_DIR=/abs/path/to/artifact/folder
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const baseUrl = 'http://localhost:3000';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const artifactDir =
  process.env.TASK4_QA_ARTIFACT_DIR?.trim() ||
  path.resolve(
    frontendRoot,
    '../qa_verifications/task-4-trial-creation-flow/20260511-201220',
  );

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({
    path: path.join(artifactDir, `${name}.png`),
    fullPage: true,
  });
}

async function expectDisabled(locator, wantDisabled, key, results) {
  const disabled = await locator.isDisabled();
  results[`check_${key}`] = {
    wantDisabled,
    disabled,
    pass: disabled === wantDisabled,
  };
  if (disabled !== wantDisabled) {
    throw new Error(
      `Button state mismatch for ${key}: expected disabled=${wantDisabled} got ${disabled}`,
    );
  }
}

async function main() {
  const results = {
    successPath: {},
    createFailure: {},
    sseFailure: {},
    errors: [],
    sseRequestUrls: [],
  };

  await fs.mkdir(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const createBodies = [];
    const createResponses = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('generation-progress')) {
        results.sseRequestUrls.push(u);
      }
      if (
        req.method() === 'POST' &&
        u.includes('/api/v1/trials') &&
        !u.includes('generation-progress')
      ) {
        const raw = req.postData();
        try {
          createBodies.push({
            url: u,
            body: raw ? JSON.parse(raw) : null,
          });
        } catch {
          createBodies.push({ url: u, bodyRaw: raw });
        }
      }
    });
    page.on('response', (res) => {
      const u = res.url();
      if (
        res.request().method() === 'POST' &&
        u.includes('/api/v1/trials') &&
        !u.includes('generation-progress')
      ) {
        createResponses.push({ url: u, status: res.status() });
      }
    });

    await page.goto(
      `${baseUrl}/api/dev/qa-login?role=talent_partner&returnTo=%2Fdashboard%2Ftrials`,
      { waitUntil: 'domcontentloaded', timeout: 30_000 },
    );
    await page.waitForURL(/\/dashboard(\/trials)?/, { timeout: 30_000 });
    await page.getByRole('heading', { name: 'Trials' }).waitFor({
      timeout: 20_000,
    });
    results.successPath.dashboardLoaded = true;
    await shot(page, '01-dashboard-trials');

    await page.getByRole('button', { name: 'New Trial' }).click();
    await page.waitForURL(/\/talent-partner\/trials\/new/);
    results.successPath.headerNewTrial = true;
    await shot(page, '02-dashboard-header-new-trial');

    await page.goto(`${baseUrl}/dashboard/trials`, {
      waitUntil: 'domcontentloaded',
    });
    await page
      .getByRole('heading', { name: 'Trials' })
      .waitFor({ timeout: 15_000 });
    await page.locator('main').click({ position: { x: 20, y: 20 } });
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog', { name: 'Command Palette' }).waitFor({
      timeout: 10_000,
    });
    await page.getByText('Create new Trial').first().click();
    await page.waitForURL(/\/talent-partner\/trials\/new/);
    results.successPath.commandPaletteNewTrial = true;
    await shot(page, '03-command-palette-create-new-trial');

    await page.goto(`${baseUrl}/talent-partner/trials/new`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('heading', { name: 'New Trial' }).waitFor();
    results.successPath.canonicalNewTrial = page.url();
    await shot(page, '04-canonical-talent-partner-trials-new');

    await page.goto(`${baseUrl}/dashboard/trials/new`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('heading', { name: 'New Trial' }).waitFor();
    results.successPath.legacyNewTrial = page.url();
    await shot(page, '05-legacy-dashboard-trials-new');

    await page.goto(`${baseUrl}/talent-partner/trials/new`, {
      waitUntil: 'domcontentloaded',
    });

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expectDisabled(
      continueBtn,
      true,
      'step1-continue-empty-role',
      results,
    );

    await page.getByLabel(/Role title/i).fill('Senior Backend Engineer');
    await page.locator('#seniority').selectOption({ label: 'Senior' });
    await page.getByLabel(/Preferred language\/framework/i).fill('');
    await expectDisabled(
      continueBtn,
      false,
      'step1-continue-role-senior-no-pref',
      results,
    );

    await page
      .getByLabel(/Preferred language\/framework/i)
      .fill('Python + FastAPI');
    await shot(page, '06-step1-filled');

    await continueBtn.click();
    await page
      .getByText('Tell Winoe about the work', { exact: false })
      .waitFor();

    const genBtn = page.getByRole('button', {
      name: 'Generate Trial preview',
    });
    await expectDisabled(genBtn, true, 'step2-gen-empty-notes', results);

    const focusText =
      'This engineer will build internal workflow APIs for operations teams. They need to design clear service boundaries, model data carefully, handle errors cleanly, and communicate tradeoffs. We want to see pragmatic architecture, testing discipline, and thoughtful documentation.';
    await page.locator('#focus-notes').fill(focusText);

    for (const label of [
      'System design',
      'API design',
      'Testing discipline',
      'Error handling',
    ]) {
      await page.getByRole('button', { name: label }).click();
    }
    await expectDisabled(genBtn, false, 'step2-gen-ready', results);
    await shot(page, '07-step2-filled');

    await genBtn.click();
    await page.getByRole('heading', { name: 'Drafting your Trial' }).waitFor({
      timeout: 120_000,
    });
    results.successPath.generationPanelVisible = true;
    await shot(page, '08-generation-loading-early');

    const lateTimer = setTimeout(async () => {
      try {
        if (page.url().includes('/talent-partner/trials/new')) {
          await shot(page, '09-generation-loading-late');
        }
      } catch {
        /* page may have closed */
      }
    }, 12_000);

    await page.waitForURL(/\/talent-partner\/trials\/[^/]+\/preview/, {
      timeout: 240_000,
    });
    clearTimeout(lateTimer);

    results.successPath.previewUrl = page.url();
    await shot(page, '10-preview-after-redirect');

    await fs.writeFile(
      path.join(artifactDir, 'network-create-requests.json'),
      JSON.stringify(
        {
          bodies: createBodies,
          responses: createResponses,
          sseUrls: results.sseRequestUrls,
        },
        null,
        2,
      ),
      'utf8',
    );

    const lastCreate = createBodies[createBodies.length - 1];
    if (lastCreate?.body) {
      const b = lastCreate.body;
      results.successPath.createBodyKeys = Object.keys(b);
      results.successPath.hasLegacyTemplateFields = [
        'template_key',
        'template_repository',
        'template_repo',
        'tech_stack',
        'techStack',
      ].some((k) => k in b);
      results.successPath.postStatus = createResponses.at(-1)?.status;
    }

    const trialIdMatch = page.url().match(/\/trials\/([^/]+)\/preview/);
    results.successPath.trialId = trialIdMatch ? trialIdMatch[1] : null;

    const tpStorageState = await context.storageState();
    await context.close();

    /* --- Create failure (mocked 503) --- */
    const ctx2 = await browser.newContext({
      storageState: tpStorageState,
      viewport: { width: 1440, height: 900 },
    });
    const p2 = await ctx2.newPage();
    await p2.route(
      (url) => url.pathname === '/api/v1/trials',
      async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service unavailable' }),
        });
      },
    );
    await p2.goto(`${baseUrl}/talent-partner/trials/new`, {
      waitUntil: 'domcontentloaded',
    });
    await p2
      .getByRole('heading', { name: 'New Trial' })
      .waitFor({ timeout: 20_000 });
    await p2.waitForLoadState('networkidle').catch(() => {});
    await p2.locator('#role-title').fill('Create failure QA role title');
    await p2.locator('#seniority').selectOption({ value: 'senior' });
    const continue2 = p2.getByRole('button', { name: 'Continue' });
    for (let i = 0; i < 80; i += 1) {
      if (!(await continue2.isDisabled())) break;
      await sleep(100);
    }
    if (await continue2.isDisabled()) {
      throw new Error(
        'Continue stayed disabled on create-failure wizard step 1',
      );
    }
    await continue2.click();
    await p2.locator('#focus-notes').fill('Some notes for failure path test.');
    await p2.getByRole('button', { name: 'Generate Trial preview' }).click();
    await p2
      .getByText(/Winoe could not start drafting this Trial/i)
      .waitFor({ timeout: 15_000 });
    results.createFailure.pass = true;
    await shot(p2, '11-failure-create-503');
    await ctx2.close();

    /* --- SSE failure: abort generation-progress (simulated transport failure) --- */
    const ctx3 = await browser.newContext({
      storageState: tpStorageState,
      viewport: { width: 1440, height: 900 },
    });
    const p3 = await ctx3.newPage();
    await p3.goto(`${baseUrl}/talent-partner/trials/new`, {
      waitUntil: 'domcontentloaded',
    });
    await p3
      .getByRole('heading', { name: 'New Trial' })
      .waitFor({ timeout: 20_000 });
    await p3.waitForLoadState('networkidle').catch(() => {});
    await p3.locator('#role-title').fill('SSE Failure Probe Role');
    await p3.locator('#seniority').selectOption({ value: 'mid' });
    const continue3 = p3.getByRole('button', { name: 'Continue' });
    for (let i = 0; i < 80; i += 1) {
      if (!(await continue3.isDisabled())) break;
      await sleep(100);
    }
    if (await continue3.isDisabled()) {
      throw new Error('Continue stayed disabled on SSE-failure wizard step 1');
    }
    await continue3.click();
    await p3.locator('#focus-notes').fill(focusText.slice(0, 400));
    await p3.route(
      /\/api\/v1\/trials\/[^/]+\/generation-progress/,
      async (route) => {
        await route.abort('connectionreset');
      },
    );
    await p3.getByRole('button', { name: 'Generate Trial preview' }).click();
    await p3.getByRole('heading', { name: 'Drafting your Trial' }).waitFor({
      timeout: 120_000,
    });
    await p3.getByText(/Reconnecting to Winoe/i).waitFor({ timeout: 90_000 });
    results.sseFailure.method = 'playwright_route_abort_generation_progress';
    results.sseFailure.reconnectingSeen = true;
    await shot(p3, '12-failure-sse-reconnecting');
    await p3
      .getByText(/We lost the connection while Winoe was drafting/i)
      .waitFor({ timeout: 120_000 });
    results.sseFailure.sseFailedSeen = true;
    await shot(p3, '13-failure-sse-permanent');

    await ctx3.close();

    await fs.writeFile(
      path.join(artifactDir, 'browser-results.json'),
      JSON.stringify(results, null, 2),
      'utf8',
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.stack || err.message : String(err);
    results.errors.push(message);
    await fs.writeFile(
      path.join(artifactDir, 'browser-results.error.txt'),
      message,
      'utf8',
    );
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch(() => process.exit(1));
