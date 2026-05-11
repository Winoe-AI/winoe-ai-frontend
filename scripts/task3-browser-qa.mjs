#!/usr/bin/env node
/**
 * Task 3 browser QA — run from repo root with frontend dev server up:
 *   BASE_URL=http://localhost:3000 ARTIFACT_DIR=./qa_verifications/task3 npm run qa:task3
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const artifactDir = path.resolve(
  process.env.ARTIFACT_DIR ||
    path.join(repoRoot, 'qa_verifications', 'task3-browser-qa-artifacts'),
);
const qaRole = (process.env.QA_ROLE || 'talent_partner').trim();
const qaTalentPartnerEmail = (
  process.env.TASK3_QA_TALENT_PARTNER_EMAIL ||
  process.env.QA_E2E_TALENT_PARTNER_EMAIL ||
  'talent_partner1@local.test'
).trim();

const REQUIRED_TRIAL_TITLE = (
  process.env.TASK3_QA_TRIAL_TITLE || 'Senior Backend Engineer'
).trim();

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(artifactDir, `${name}.png`),
    fullPage: true,
  });
}

async function tryOpenCommandPalette(page) {
  const dialogSel = page.getByRole('dialog', { name: 'Command Palette' });
  await page
    .locator('body')
    .click({ position: { x: 10, y: 10 } })
    .catch(() => {
      /* best effort focus reset */
    });
  for (const key of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(key);
    try {
      await dialogSel.waitFor({ state: 'visible', timeout: 2500 });
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

async function tryToggleSidebar(page) {
  const sidebar = page.locator('nav[aria-label="Sidebar"]');
  const before = await sidebar.evaluate((el) => getComputedStyle(el).width);
  await page
    .locator('body')
    .click({ position: { x: 10, y: 10 } })
    .catch(() => {
      /* best effort focus reset */
    });
  for (const key of ['Control+\\', 'Meta+\\']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(400);
    const after = await sidebar.evaluate((el) => getComputedStyle(el).width);
    if (after !== before) {
      return { before, after, key };
    }
  }
  return { before, after: before, key: null };
}

async function run() {
  await ensureDir(artifactDir);
  const browser = await chromium.launch({ headless: true });
  const results = {
    baseUrl,
    artifactDir,
    qaRole,
    qaTalentPartnerEmail,
    login: {},
    dashboard: {},
    commandPalette: {},
    darkMode: {},
    responsive: {},
    urls: {},
    failures: [],
  };

  const fail = (msg) => {
    results.failures.push(msg);
  };
  const isFocusInsideDialog = async (page) =>
    page.evaluate(() => {
      const dialog = document.querySelector(
        '[role="dialog"][aria-label="Command Palette"]',
      );
      const active = document.activeElement;
      return !!dialog && !!active && dialog.contains(active);
    });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    results.urls.loginInitial = page.url();
    results.login.directRender =
      page.url().includes('/login') && !page.url().includes('/auth/login');
    results.login.ctaVisible = await page
      .getByRole('button', { name: 'Continue with email' })
      .isVisible();
    results.login.placeholderVisible = await page
      .getByPlaceholder('you@company.com')
      .isVisible();
    await screenshot(page, 'login-idle');

    const magicEmail = 'qa@winoe.ai';
    await page.getByPlaceholder('you@company.com').fill(magicEmail);
    await page.getByRole('button', { name: 'Continue with email' }).click();
    await screenshot(page, 'login-submitting');
    try {
      await page.getByRole('heading', { name: 'Check your email' }).waitFor({
        timeout: 15000,
      });
      const body = page.getByText(/We sent a magic link to/);
      await body.waitFor({ timeout: 5000 });
      results.login.sentStateVisible = true;
      results.login.sentBodyHasExpiry = (await body.textContent())?.includes(
        'The link expires in 15 minutes.',
      );
    } catch {
      results.login.sentStateVisible = false;
      fail('login: sent state not visible within timeout');
    }
    await screenshot(page, 'login-sent');

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('you@company.com').fill('fail@company.com');
    await page.getByRole('button', { name: 'Continue with email' }).click();
    try {
      const err = page.getByText(
        /We couldn't find a Talent Partner account for/,
      );
      await err.waitFor({ timeout: 15000 });
      const t = await err.textContent();
      results.login.errorStateVisible =
        t?.includes('Contact your team admin to request access.') ?? false;
    } catch {
      results.login.errorStateVisible = false;
      fail('login: error state not visible');
    }
    await screenshot(page, 'login-error');

    if (qaRole !== 'talent_partner') {
      results.failures.push(
        'Set QA_ROLE=talent_partner for full dashboard checks.',
      );
    }

    await page.goto(
      `${baseUrl}/api/dev/qa-login?role=talent_partner&email=${encodeURIComponent(qaTalentPartnerEmail)}&returnTo=%2Fdashboard%2Ftrials`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForURL(/\/dashboard(\/trials)?/, { timeout: 30000 });
    results.dashboard.tpReachable = true;
    results.urls.afterQaLogin = page.url();

    let dashboardStatus = 0;
    try {
      const dr = await page.request.get(`${baseUrl}/api/dashboard`);
      dashboardStatus = dr.status();
      results.dashboard.apiDashboardStatus = dashboardStatus;
      if (dashboardStatus === 401) {
        fail('/api/dashboard returned 401');
      }
    } catch (e) {
      fail(`/api/dashboard request failed: ${e}`);
    }

    await page
      .getByRole('heading', { name: 'Trials' })
      .waitFor({ timeout: 20000 })
      .catch(() => fail('dashboard: Trials heading missing'));
    await screenshot(page, 'dashboard-trials-landing');

    const trialTitleCell = page.getByText(REQUIRED_TRIAL_TITLE, {
      exact: true,
    });
    await trialTitleCell
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => {});
    results.dashboard.rowSeniorBackend = await trialTitleCell
      .first()
      .isVisible()
      .catch(() => false);
    if (!results.dashboard.rowSeniorBackend) {
      fail(
        `dashboard: trial link "${REQUIRED_TRIAL_TITLE}" not found (seed DB?)`,
      );
    }

    results.dashboard.tableHeaders = {};
    for (const header of [
      'Trial',
      'Candidates',
      'Status',
      'Started',
      'Score range',
    ]) {
      results.dashboard.tableHeaders[header] = await page
        .getByRole('columnheader', { name: header })
        .isVisible();
    }
    results.dashboard.filters = {};
    for (const filter of [
      'All',
      'Active',
      'Awaiting Candidate',
      'Completed',
      'Terminated',
    ]) {
      results.dashboard.filters[filter] = await page
        .getByRole('button', { name: filter })
        .isVisible();
    }

    await page.getByRole('button', { name: 'Active' }).click();
    await page.waitForTimeout(200);
    await screenshot(page, 'dashboard-filter-active');
    await page.getByRole('button', { name: 'All' }).click();

    await page.getByPlaceholder('Search trials...').fill('zzzz-no-match-qa');
    await page.waitForTimeout(200);
    results.dashboard.filteredEmptyVisible = await page
      .getByText('No matching trials.')
      .isVisible();
    await screenshot(page, 'dashboard-filtered-empty');
    await page.getByPlaceholder('Search trials...').fill('');

    const sidebarToggle = await tryToggleSidebar(page);
    results.dashboard.sidebarWidths = sidebarToggle;
    if (!sidebarToggle.key) {
      fail('sidebar: shortcut did not change width (tried Ctrl/Meta+\\)');
    }
    await screenshot(page, 'dashboard-collapsed-sidebar');

    const paletteOpened = await tryOpenCommandPalette(page);
    results.commandPalette.opened = paletteOpened;
    if (!paletteOpened) {
      fail('command palette: not opened with Ctrl/Cmd+K');
    } else {
      results.commandPalette.quickActionsVisible = await page
        .getByText('Quick Actions', { exact: true })
        .first()
        .isVisible();
      results.commandPalette.navigateToVisible = await page
        .getByText('Navigate to', { exact: true })
        .first()
        .isVisible();

      const search = page.getByLabel('Search commands');
      await search.fill(REQUIRED_TRIAL_TITLE.slice(0, 8));
      await page.waitForTimeout(250);
      const opt = page
        .locator('[role="option"]')
        .filter({ hasText: REQUIRED_TRIAL_TITLE });
      const optVisible = await opt
        .first()
        .isVisible()
        .catch(() => false);
      results.commandPalette.trialOptionVisible = optVisible;
      if (optVisible) {
        await opt.first().click();
        await page.waitForURL(/\/dashboard\/trials\/.+/, { timeout: 20000 });
        results.commandPalette.navigateToTrialDetail = true;
        await page.goBack();
        await page.waitForURL(/\/dashboard(\/trials)?/, { timeout: 20000 });
      } else {
        fail(
          'command palette: trial option not found after typing title prefix',
        );
      }

      await tryOpenCommandPalette(page);
      results.commandPalette.recentVisible =
        (await page.getByText('Recent').count()) > 0;
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      results.commandPalette.tabTrapActive = await isFocusInsideDialog(page);
      if (!results.commandPalette.tabTrapActive) {
        fail('command palette: tab trap did not keep focus in dialog');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      results.commandPalette.closedWithEscape =
        (await page
          .getByRole('dialog', { name: 'Command Palette' })
          .count()) === 0;
      if (!results.commandPalette.closedWithEscape) {
        fail('command palette: Escape did not close palette');
      }
    }

    const darkContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    });
    const darkPage = await darkContext.newPage();
    await darkPage.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await screenshot(darkPage, 'dark-login');
    await darkPage.goto(
      `${baseUrl}/api/dev/qa-login?role=talent_partner&email=${encodeURIComponent(qaTalentPartnerEmail)}&returnTo=%2Fdashboard%2Ftrials`,
      { waitUntil: 'domcontentloaded' },
    );
    await darkPage.waitForURL(/\/dashboard(\/trials)?/, { timeout: 30000 });
    await screenshot(darkPage, 'dark-dashboard');
    if (await tryOpenCommandPalette(darkPage)) {
      await screenshot(darkPage, 'dark-command-palette');
      await darkPage.keyboard.press('Escape');
    }
    results.darkMode.loginAndDashboardCaptured = true;
    await darkContext.close();

    for (const [label, w, h] of [
      ['dashboard-1280x720', 1280, 720],
      ['dashboard-1440x900', 1440, 900],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
      });
      const p = await ctx.newPage();
      await p.goto(
        `${baseUrl}/api/dev/qa-login?role=talent_partner&email=${encodeURIComponent(qaTalentPartnerEmail)}&returnTo=%2Fdashboard%2Ftrials`,
        { waitUntil: 'domcontentloaded' },
      );
      await p.waitForURL(/\/dashboard(\/trials)?/, { timeout: 30000 });
      await screenshot(p, label);
      await ctx.close();
    }
    results.responsive.captured = true;

    const candidateContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const candidatePage = await candidateContext.newPage();
    await candidatePage.goto(
      `${baseUrl}/api/dev/qa-login?role=candidate&returnTo=%2Fdashboard%2Ftrials`,
      { waitUntil: 'domcontentloaded' },
    );
    results.urls.candidateBoundary = candidatePage.url();
    results.dashboard.candidateBlocked =
      candidatePage.url().includes('/not-authorized') ||
      candidatePage.url().includes('/login');
    if (!results.dashboard.candidateBlocked) {
      fail('candidate: expected redirect away from TP dashboard');
    }
    await screenshot(candidatePage, 'candidate-boundary');
    await candidateContext.close();

    results.summary = {
      failed: results.failures.length,
      ok: results.failures.length === 0,
    };

    await fs.writeFile(
      path.join(artifactDir, 'browser-results.json'),
      JSON.stringify(results, null, 2),
      'utf8',
    );

    console.log(
      results.failures.length
        ? `Task 3 browser QA FAILED (${results.failures.length}): ${results.failures.join(' | ')}`
        : 'Task 3 browser QA passed (see browser-results.json).',
    );

    if (results.failures.length) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

run().catch(async (err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  await fs.mkdir(artifactDir, { recursive: true }).catch(() => {});
  await fs.writeFile(
    path.join(artifactDir, 'browser-results.error.txt'),
    message,
    'utf8',
  );
  console.error(message);
  process.exitCode = 1;
});
