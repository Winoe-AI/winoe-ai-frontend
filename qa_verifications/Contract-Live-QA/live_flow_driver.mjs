import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const command = process.argv[2]?.trim() || '';
const baseURL =
  process.env.CONTRACT_LIVE_BASE_URL?.trim() || 'http://localhost:3000';
const artifactsDir = process.env.CONTRACT_LIVE_ARTIFACTS_DIR?.trim();

if (!artifactsDir) {
  throw new Error('CONTRACT_LIVE_ARTIFACTS_DIR is required.');
}

const apiDir = path.join(artifactsDir, 'api');
const storageDir = path.join(artifactsDir, 'storage');
const contractLiveDir = path.dirname(new URL(import.meta.url).pathname);

fs.mkdirSync(apiDir, { recursive: true });
fs.mkdirSync(storageDir, { recursive: true });

function resolveStorageState(role) {
  const envKey =
    role === 'recruiter'
      ? 'CONTRACT_LIVE_RECRUITER_STORAGE_STATE'
      : 'CONTRACT_LIVE_CANDIDATE_STORAGE_STATE';
  return (
    process.env[envKey]?.trim() ||
    path.join(
      storageDir,
      role === 'recruiter' ? 'recruiter-only.json' : 'candidate-only.json',
    )
  );
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveFreshSummaryPath() {
  return (
    process.env.CONTRACT_LIVE_SUMMARY_FILE?.trim() ||
    path.join(apiDir, 'fresh-live-summary.json')
  );
}

function writeJson(name, value) {
  const filePath = path.join(apiDir, name);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return filePath;
}

function nowIsoSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function trimToNull(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseTokenFromInviteUrl(inviteUrl) {
  const trimmed = trimToNull(inviteUrl);
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return trimToNull(segments[segments.length - 1] ?? null);
  } catch {
    return null;
  }
}

function resolveLiveContext() {
  const summaryPath = resolveFreshSummaryPath();
  const summary = fs.existsSync(summaryPath) ? readJsonFile(summaryPath) : {};
  const inviteUrl =
    trimToNull(process.env.CONTRACT_LIVE_INVITE_URL) ||
    trimToNull(summary.inviteUrl);
  const inviteToken =
    trimToNull(process.env.CONTRACT_LIVE_INVITE_TOKEN) ||
    trimToNull(summary.inviteToken) ||
    parseTokenFromInviteUrl(inviteUrl);
  const simulationId = trimToNull(
    process.env.CONTRACT_LIVE_SIMULATION_ID ||
      String(summary.simulationId ?? ''),
  );
  const candidateSessionIdRaw =
    trimToNull(process.env.CONTRACT_LIVE_CANDIDATE_SESSION_ID) ||
    trimToNull(String(summary.candidateSessionId ?? ''));
  const parsedCandidateSessionId = Number(candidateSessionIdRaw);
  return {
    summaryPath,
    summary,
    inviteUrl,
    inviteToken,
    simulationId,
    candidateSessionId: Number.isFinite(parsedCandidateSessionId)
      ? parsedCandidateSessionId
      : null,
  };
}

function requireInviteToken(context) {
  if (!context.inviteToken) {
    throw new Error(
      `Invite token is required. Provide CONTRACT_LIVE_INVITE_TOKEN or a summary file at ${context.summaryPath}.`,
    );
  }
  return context.inviteToken;
}

function requireSimulationId(context) {
  if (!context.simulationId) {
    throw new Error(
      `Simulation id is required. Provide CONTRACT_LIVE_SIMULATION_ID or a summary file at ${context.summaryPath}.`,
    );
  }
  return context.simulationId;
}

function requireCandidateSessionId(context) {
  if (!context.candidateSessionId) {
    throw new Error(
      `Candidate session id is required. Provide CONTRACT_LIVE_CANDIDATE_SESSION_ID or a summary file at ${context.summaryPath}.`,
    );
  }
  return context.candidateSessionId;
}

function resolveDay4DemoFile() {
  const configuredPath = trimToNull(process.env.CONTRACT_LIVE_DAY4_VIDEO_FILE);
  const demoFilePath = configuredPath
    ? path.resolve(configuredPath)
    : path.join(contractLiveDir, 'fixtures', 'day4-demo.mp4');
  if (!fs.existsSync(demoFilePath)) {
    throw new Error(
      `Day 4 demo video fixture not found at ${demoFilePath}. Set CONTRACT_LIVE_DAY4_VIDEO_FILE or restore qa_verifications/Contract-Live-QA/fixtures/day4-demo.mp4.`,
    );
  }
  return demoFilePath;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withPage(role, work) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL,
    storageState: resolveStorageState(role),
  });
  const page = await context.newPage();
  try {
    await page.goto(
      role === 'recruiter' ? '/dashboard' : '/candidate/dashboard',
      {
        waitUntil: 'domcontentloaded',
      },
    );
    await page.waitForLoadState('networkidle');
    return await work(page);
  } finally {
    await browser.close();
  }
}

async function browserFetchJson(page, url, options = {}) {
  return await page.evaluate(
    async ({ url: innerUrl, options: innerOptions }) => {
      const headers = {
        ...(innerOptions.headers || {}),
      };
      if (
        innerOptions.body != null &&
        !Object.keys(headers).some(
          (key) => key.toLowerCase() === 'content-type',
        )
      ) {
        headers['content-type'] = 'application/json';
      }
      const res = await fetch(innerUrl, {
        ...innerOptions,
        headers,
        body: innerOptions.body ?? undefined,
      });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        text,
        json,
      };
    },
    { url, options },
  );
}

async function pollUntil(
  page,
  label,
  fn,
  predicate,
  { attempts, delayMs, snapshotName },
) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await fn();
    if (snapshotName) {
      writeJson(snapshotName, {
        attempt,
        label,
        response: last,
      });
    }
    if (predicate(last)) {
      return last;
    }
    await sleep(delayMs);
  }
  throw new Error(
    `${label} did not reach the expected state after ${attempts} attempts: ${JSON.stringify(
      last,
      null,
      2,
    )}`,
  );
}

function getResponseErrorCode(response) {
  const json = response?.json;
  if (!json || typeof json !== 'object') return null;
  const direct =
    typeof json.errorCode === 'string' ? json.errorCode.trim() : '';
  if (direct) return direct;
  const nested = json.details;
  if (!nested || typeof nested !== 'object') return null;
  const nestedCode =
    typeof nested.errorCode === 'string' ? nested.errorCode.trim() : '';
  return nestedCode || null;
}

function isRetryableInviteNotReady(response) {
  return (
    response?.status === 409 &&
    getResponseErrorCode(response) === 'PRECOMMIT_BUNDLE_NOT_READY' &&
    response?.json?.retryable === true
  );
}

async function inviteCandidateWithBundleRetry(
  page,
  simulationId,
  { candidateName, candidateEmail },
) {
  let lastDetail = null;
  let lastInvite = null;
  for (let attempt = 1; attempt <= 36; attempt += 1) {
    const invite = await browserFetchJson(
      page,
      `/api/simulations/${simulationId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({
          candidateName,
          inviteEmail: candidateEmail,
        }),
      },
    );
    lastInvite = invite;
    writeJson(
      `simulation-${simulationId}-invite-attempt-${attempt}.json`,
      invite,
    );
    if (invite.ok) {
      writeJson(`simulation-${simulationId}-invite.json`, invite);
      return { invite, lastDetail, attempts: attempt };
    }
    if (!isRetryableInviteNotReady(invite)) {
      writeJson(`simulation-${simulationId}-invite.json`, invite);
      throw new Error(`Invite failed: ${invite.status} ${invite.text}`);
    }
    lastDetail = await browserFetchJson(
      page,
      `/api/simulations/${simulationId}`,
      {
        method: 'GET',
      },
    );
    writeJson(
      `simulation-${simulationId}-detail-invite-retry-${attempt}.json`,
      {
        attempt,
        detail: lastDetail,
        invite,
      },
    );
    if (attempt >= 36) {
      break;
    }
    await sleep(10000);
  }
  throw new Error(
    `Invite did not become ready after bundle retries: ${JSON.stringify(
      { invite: lastInvite, detail: lastDetail },
      null,
      2,
    )}`,
  );
}

async function capturePage(page, name, extra = {}) {
  writeJson(name, {
    capturedAt: new Date().toISOString(),
    url: page.url(),
    text: await page.locator('body').innerText(),
    extra,
  });
}

async function clickFirstVisible(locator) {
  const count = await locator.count();
  if (count === 0) return false;
  const target = locator.first();
  const visible = await target.isVisible().catch(() => false);
  if (!visible) return false;
  await target.click();
  return true;
}

async function gotoCandidateSession(page, inviteToken) {
  await page.goto(`/candidate/session/${inviteToken}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/auth/login')) {
    throw new Error(`Candidate session redirected to login: ${page.url()}`);
  }
}

async function ensureDayVisible(page, day) {
  await page
    .getByText(new RegExp(`^Day ${day} •`, 'i'))
    .first()
    .waitFor({ state: 'visible', timeout: 60000 });
}

async function waitForText(page, pattern, timeout = 60000) {
  await page.getByText(pattern).first().waitFor({ state: 'visible', timeout });
}

async function fetchCandidateBootstrap(page, inviteToken, outputName) {
  const response = await browserFetchJson(
    page,
    `/api/backend/candidate/session/${inviteToken}`,
    { method: 'GET' },
  );
  if (outputName) writeJson(outputName, response);
  return response;
}

async function fetchCandidateCurrentTask(page, candidateSessionId, outputName) {
  const response = await browserFetchJson(
    page,
    `/api/backend/candidate/session/${candidateSessionId}/current_task`,
    {
      method: 'GET',
      headers: { 'x-candidate-session-id': String(candidateSessionId) },
    },
  );
  if (outputName) writeJson(outputName, response);
  return response;
}

function extractCurrentTask(response) {
  const currentTask = response?.json?.currentTask;
  if (!currentTask || typeof currentTask !== 'object') return null;
  return currentTask;
}

function defaultDay1Response() {
  return [
    '# Architecture brief',
    '',
    '- API surface: FastAPI endpoints with explicit request/response contracts.',
    '- Runtime safety: add retryable failure paths, bounded polling, and evidence logging.',
    '- Delivery plan: fix live blockers first, then prove the recruiter, candidate, and review flows.',
  ].join('\n');
}

function defaultDay5Reflection() {
  return {
    challenges:
      'The main challenge was closing fresh live-path failures without hiding them behind mocks or admin-only overrides.',
    decisions:
      'I prioritized runtime correctness, truthful evidence capture, and deterministic fallbacks for transient provider failures.',
    tradeoffs:
      'I accepted slower end-to-end validation in exchange for using the real stack, real auth, and real worker execution.',
    communication:
      'I left behind concrete logs, repeatable commands, and updated remediation notes so the next handoff can be audited quickly.',
    next: 'Next I would tighten live diagnostics around task transitions, transcript latency, and fit-profile generation observability.',
  };
}

function buildDay5ReflectionMarkdown(reflection) {
  return [
    '# Reflection Essay',
    '',
    '## Challenges',
    reflection.challenges,
    '',
    '## Decisions',
    reflection.decisions,
    '',
    '## Tradeoffs',
    reflection.tradeoffs,
    '',
    '## Communication / Presentation',
    reflection.communication,
    '',
    '## What I Would Do Next',
    reflection.next,
  ].join('\n');
}

async function waitForRunTestsTerminalState(page, day) {
  return await pollUntil(
    page,
    `candidate day ${day} run-tests terminal state`,
    async () => ({
      text: await page.locator('#main-content').innerText(),
    }),
    (response) =>
      /all checks passed/i.test(response.text) ||
      /tests failed/i.test(response.text) ||
      /re-run tests/i.test(response.text) ||
      /retry tests/i.test(response.text),
    {
      attempts: 72,
      delayMs: 5000,
      snapshotName: `candidate-day${day}-run-tests-poll.json`,
    },
  );
}

async function waitForTranscriptReady(page) {
  return await pollUntil(
    page,
    'candidate day 4 transcript ready',
    async () => ({
      text: await page.locator('#main-content').innerText(),
    }),
    (response) =>
      /full transcript/i.test(response.text) ||
      /transcript ready/i.test(response.text) ||
      /demo presentation recording/i.test(response.text),
    {
      attempts: 72,
      delayMs: 5000,
      snapshotName: 'candidate-day4-transcript-poll.json',
    },
  );
}

async function runRecruiterFreshFlow() {
  return await withPage('recruiter', async (page) => {
    const title = `Fresh Contract Live ${nowIsoSafe()}`;
    const candidateName =
      process.env.CONTRACT_LIVE_CANDIDATE_NAME?.trim() || 'Robie Candidate';
    const candidateEmail =
      process.env.CONTRACT_LIVE_CANDIDATE_EMAIL?.trim() ||
      'robiemelaku@gmail.com';

    const createPayload = {
      title,
      role: 'Backend Engineer',
      techStack: 'Python, FastAPI, pytest',
      seniority: 'mid',
      templateKey: 'python-fastapi',
      focus: 'Fresh end-to-end proof after live bundle/runtime repairs',
      companyContext: {
        domain: 'B2B developer tooling',
        productArea: 'workflow automation platform',
      },
      ai: {
        noticeVersion: 'mvp1',
        evalEnabledByDay: {
          1: true,
          2: true,
          3: true,
          4: true,
          5: true,
        },
      },
    };

    const created = await browserFetchJson(page, '/api/simulations', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    });
    writeJson('simulation-create.json', created);
    if (!created.ok) {
      throw new Error(
        `Simulation create failed: ${created.status} ${created.text}`,
      );
    }

    const simulationId = String(created.json?.id ?? '').trim();
    if (!simulationId) {
      throw new Error(
        `Simulation create did not return an id: ${created.text}`,
      );
    }

    const readyDetail = await pollUntil(
      page,
      'simulation ready_for_review',
      async () => {
        return await browserFetchJson(
          page,
          `/api/simulations/${simulationId}`,
          {
            method: 'GET',
          },
        );
      },
      (response) =>
        response.ok &&
        response.json?.status === 'ready_for_review' &&
        Boolean(
          response.json?.pendingScenarioVersionId ??
          response.json?.activeScenarioVersionId,
        ),
      {
        attempts: 90,
        delayMs: 5000,
        snapshotName: `simulation-${simulationId}-detail-ready-check.json`,
      },
    );

    const scenarioVersionId = String(
      readyDetail.json?.pendingScenarioVersionId ??
        readyDetail.json?.activeScenarioVersionId ??
        '',
    ).trim();
    if (!scenarioVersionId) {
      throw new Error(
        `Simulation ${simulationId} is missing a scenario version id.`,
      );
    }

    const approve = await browserFetchJson(
      page,
      `/api/backend/simulations/${simulationId}/scenario/${scenarioVersionId}/approve`,
      { method: 'POST' },
    );
    writeJson(`simulation-${simulationId}-approve.json`, approve);
    if (!approve.ok) {
      throw new Error(
        `Scenario approve failed: ${approve.status} ${approve.text}`,
      );
    }

    const activate = await browserFetchJson(
      page,
      `/api/backend/simulations/${simulationId}/activate`,
      {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      },
    );
    writeJson(`simulation-${simulationId}-activate.json`, activate);
    if (!activate.ok) {
      throw new Error(
        `Simulation activate failed: ${activate.status} ${activate.text}`,
      );
    }

    const activeDetail = await pollUntil(
      page,
      'simulation active_inviting',
      async () => {
        return await browserFetchJson(
          page,
          `/api/simulations/${simulationId}`,
          {
            method: 'GET',
          },
        );
      },
      (response) => response.ok && response.json?.status === 'active_inviting',
      {
        attempts: 30,
        delayMs: 2000,
        snapshotName: `simulation-${simulationId}-detail-active.json`,
      },
    );

    const {
      invite,
      lastDetail: inviteRetryDetail,
      attempts: inviteAttempts,
    } = await inviteCandidateWithBundleRetry(page, simulationId, {
      candidateName,
      candidateEmail,
    });

    const candidates = await browserFetchJson(
      page,
      `/api/simulations/${simulationId}/candidates`,
      {
        method: 'GET',
      },
    );
    writeJson(`simulation-${simulationId}-candidates.json`, candidates);

    const postInviteDetail = await browserFetchJson(
      page,
      `/api/simulations/${simulationId}`,
      {
        method: 'GET',
      },
    );
    writeJson(
      `simulation-${simulationId}-detail-post-invite.json`,
      postInviteDetail,
    );

    const summary = {
      simulationId,
      scenarioVersionId,
      title,
      candidateName,
      candidateEmail,
      candidateSessionId: invite.json?.candidateSessionId ?? null,
      inviteToken: invite.json?.token ?? null,
      inviteUrl: invite.json?.inviteUrl ?? null,
      inviteAttempts,
      finalStatus:
        postInviteDetail.json?.status ?? activeDetail.json?.status ?? null,
      bundleStatus:
        postInviteDetail.json?.scenario?.precommitBundleStatus ??
        postInviteDetail.json?.ai?.activeScenarioSnapshot?.bundleStatus ??
        inviteRetryDetail?.json?.scenario?.precommitBundleStatus ??
        inviteRetryDetail?.json?.ai?.activeScenarioSnapshot?.bundleStatus ??
        activeDetail.json?.scenario?.precommitBundleStatus ??
        activeDetail.json?.ai?.activeScenarioSnapshot?.bundleStatus ??
        null,
    };
    writeJson('fresh-live-summary.json', summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

async function runCandidateScheduleFlow() {
  const context = resolveLiveContext();
  const inviteToken = requireInviteToken(context);
  const scheduleDate = trimToNull(process.env.CONTRACT_LIVE_SCHEDULE_DATE);
  const candidateTimezone =
    trimToNull(process.env.CONTRACT_LIVE_CANDIDATE_TIMEZONE) ||
    'America/New_York';

  if (!scheduleDate) {
    throw new Error(
      'CONTRACT_LIVE_SCHEDULE_DATE is required for candidate-schedule.',
    );
  }

  return await withPage('candidate', async (page) => {
    await gotoCandidateSession(page, inviteToken);
    const bootstrapBefore = await fetchCandidateBootstrap(
      page,
      inviteToken,
      'candidate-bootstrap-before-schedule.json',
    );
    if (!bootstrapBefore.ok) {
      throw new Error(
        `Candidate bootstrap failed before scheduling: ${bootstrapBefore.status} ${bootstrapBefore.text}`,
      );
    }
    await capturePage(page, 'candidate-schedule-landing.json', {
      inviteToken,
      scheduleDate,
      candidateTimezone,
    });

    const startButtonClicked = await clickFirstVisible(
      page.getByRole('button', { name: /start simulation/i }),
    );
    if (startButtonClicked) {
      await page.waitForLoadState('networkidle');
    }

    await page.getByLabel(/start date/i).fill(scheduleDate);
    const timezoneInput = page.getByLabel(/timezone/i);
    if ((await timezoneInput.count()) > 0) {
      await timezoneInput.fill(candidateTimezone);
      await timezoneInput.press('Tab').catch(() => {});
    }
    await capturePage(page, 'candidate-schedule-draft.json', {
      inviteToken,
      scheduleDate,
      candidateTimezone,
    });

    await page.getByRole('button', { name: /^continue$/i }).click();
    await waitForText(page, /5-day schedule preview/i);
    await capturePage(page, 'candidate-schedule-preview.json', {
      inviteToken,
      scheduleDate,
      candidateTimezone,
    });

    const scheduleResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/candidate/session/${inviteToken}/schedule`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /confirm schedule/i }).click();
    const scheduleResponse = await scheduleResponsePromise;
    const scheduleText = await scheduleResponse.text();
    let scheduleJson = null;
    try {
      scheduleJson = scheduleText ? JSON.parse(scheduleText) : null;
    } catch {
      scheduleJson = { raw: scheduleText };
    }
    const scheduleCapture = {
      ok: scheduleResponse.ok(),
      status: scheduleResponse.status(),
      url: scheduleResponse.url(),
      json: scheduleJson,
      text: scheduleText,
    };
    writeJson('candidate-schedule-response.json', scheduleCapture);
    if (!scheduleResponse.ok()) {
      throw new Error(
        `Candidate schedule failed: ${scheduleResponse.status()} ${scheduleText}`,
      );
    }

    await page.waitForLoadState('networkidle');
    await page.reload({ waitUntil: 'networkidle' });
    const bootstrapAfter = await fetchCandidateBootstrap(
      page,
      inviteToken,
      'candidate-bootstrap-after-schedule.json',
    );
    await capturePage(page, 'candidate-schedule-post-confirm.json', {
      inviteToken,
      scheduleDate,
      candidateTimezone,
    });

    const summary = {
      inviteToken,
      candidateSessionId:
        bootstrapAfter.json?.candidateSessionId ?? context.candidateSessionId,
      scheduledStartAt:
        scheduleJson?.scheduledStartAt ??
        bootstrapAfter.json?.scheduledStartAt ??
        null,
      candidateTimezone:
        scheduleJson?.candidateTimezone ??
        bootstrapAfter.json?.candidateTimezone ??
        null,
      scheduleLockedAt:
        scheduleJson?.scheduleLockedAt ??
        bootstrapAfter.json?.scheduleLockedAt ??
        null,
      currentDayWindow: bootstrapAfter.json?.currentDayWindow ?? null,
      pageUrl: page.url(),
    };
    writeJson('candidate-schedule-summary.json', summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

async function runCandidateDayFlow() {
  const context = resolveLiveContext();
  const inviteToken = requireInviteToken(context);
  const candidateSessionId = requireCandidateSessionId(context);
  const requestedDay = Number(
    trimToNull(process.env.CONTRACT_LIVE_DAY) ||
      trimToNull(process.env.CONTRACT_LIVE_EXPECT_DAY) ||
      '',
  );

  if (!Number.isInteger(requestedDay) || requestedDay < 1 || requestedDay > 5) {
    throw new Error('candidate-day requires CONTRACT_LIVE_DAY=1..5.');
  }

  return await withPage('candidate', async (page) => {
    await gotoCandidateSession(page, inviteToken);
    await clickFirstVisible(
      page.getByRole('button', { name: /start simulation/i }),
    );
    await page.waitForLoadState('networkidle');
    await ensureDayVisible(page, requestedDay);

    const currentTaskBefore = await fetchCandidateCurrentTask(
      page,
      candidateSessionId,
      `candidate-day${requestedDay}-current-task-before.json`,
    );
    if (!currentTaskBefore.ok) {
      throw new Error(
        `Unable to load current task for day ${requestedDay}: ${currentTaskBefore.status} ${currentTaskBefore.text}`,
      );
    }
    const currentTask = extractCurrentTask(currentTaskBefore);
    const taskId = Number(currentTask?.id);
    const actualDayIndex = Number(currentTask?.dayIndex);
    if (!Number.isFinite(taskId)) {
      throw new Error(
        `Current task for day ${requestedDay} did not include a task id: ${JSON.stringify(
          currentTaskBefore.json,
          null,
          2,
        )}`,
      );
    }
    if (actualDayIndex !== requestedDay) {
      throw new Error(
        `Expected day ${requestedDay} but current task is day ${actualDayIndex}: ${JSON.stringify(
          currentTaskBefore.json,
          null,
          2,
        )}`,
      );
    }

    await capturePage(page, `candidate-day${requestedDay}-before.json`, {
      inviteToken,
      candidateSessionId,
      taskId,
    });

    if (requestedDay === 1) {
      const textArea = page.locator('textarea').first();
      await textArea.waitFor({ state: 'visible', timeout: 30000 });
      await textArea.fill(defaultDay1Response());
      await clickFirstVisible(
        page.getByRole('button', { name: /save draft/i }),
      );
      const submitResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/tasks/${taskId}/submit`) &&
          response.request().method() === 'POST',
        { timeout: 120000 },
      );
      await page.getByRole('button', { name: /submit & continue/i }).click();
      const submitResponse = await submitResponsePromise;
      writeJson(`candidate-day${requestedDay}-submit.json`, {
        ok: submitResponse.ok(),
        status: submitResponse.status(),
        url: submitResponse.url(),
        text: await submitResponse.text(),
      });
      if (!submitResponse.ok()) {
        throw new Error(
          `Day ${requestedDay} submit failed with status ${submitResponse.status()}.`,
        );
      }
    } else if (requestedDay === 2 || requestedDay === 3) {
      const codespaceLink = page.getByRole('link', {
        name: /^open codespace$/i,
      });
      await codespaceLink.first().waitFor({ state: 'visible', timeout: 60000 });
      await waitForText(page, /workspace is ready\./i, 60000);
      const workspaceHref = await codespaceLink.first().getAttribute('href');
      writeJson(`candidate-day${requestedDay}-workspace.json`, {
        href: workspaceHref,
        label: 'Open Codespace',
      });

      const runTestsButton = page
        .getByRole('button', { name: /^run tests$/i })
        .first();
      await runTestsButton.waitFor({ state: 'visible', timeout: 60000 });

      const runResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/tasks/${taskId}/run`) &&
          response.request().method() === 'POST',
        { timeout: 120000 },
      );
      await runTestsButton.click();
      const runResponse = await runResponsePromise;
      const runResponseText = await runResponse.text();
      writeJson(`candidate-day${requestedDay}-run-start.json`, {
        ok: runResponse.ok(),
        status: runResponse.status(),
        url: runResponse.url(),
        text: runResponseText,
      });
      if (!runResponse.ok()) {
        throw new Error(
          `Day ${requestedDay} run-tests start failed: ${runResponse.status()} ${runResponseText}`,
        );
      }

      await waitForText(page, /running tests/i, 30000);
      const runResult = await waitForRunTestsTerminalState(page, requestedDay);
      writeJson(`candidate-day${requestedDay}-run-result.json`, runResult);

      const submitResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/tasks/${taskId}/submit`) &&
          response.request().method() === 'POST',
        { timeout: 120000 },
      );
      await page.getByRole('button', { name: /submit & continue/i }).click();
      const submitResponse = await submitResponsePromise;
      writeJson(`candidate-day${requestedDay}-submit.json`, {
        ok: submitResponse.ok(),
        status: submitResponse.status(),
        url: submitResponse.url(),
        text: await submitResponse.text(),
      });
      if (!submitResponse.ok()) {
        throw new Error(
          `Day ${requestedDay} submit failed with status ${submitResponse.status()}.`,
        );
      }
    } else if (requestedDay === 4) {
      const transcriptReadyText = page.getByText(/full transcript/i).first();
      const transcriptAlreadyReady = await transcriptReadyText
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (!transcriptAlreadyReady) {
        const day4DemoFile = resolveDay4DemoFile();
        const consentCheckbox = page
          .getByLabel(
            /I consent to submission and processing of my demo video and transcript for evaluation/i,
          )
          .first();
        await consentCheckbox.check();
        await page.locator('input[type="file"]').setInputFiles(day4DemoFile);
        writeJson('candidate-day4-upload-fixture.json', {
          path: day4DemoFile,
          bytes: fs.statSync(day4DemoFile).size,
        });
        await page
          .getByRole('button', { name: /finalize demo/i })
          .waitFor({ state: 'visible', timeout: 30000 });
        await page.getByRole('button', { name: /finalize demo/i }).click();
        await waitForTranscriptReady(page);
      }
      await capturePage(page, 'candidate-day4-transcript-ready.json', {
        inviteToken,
        candidateSessionId,
        taskId,
      });
    } else if (requestedDay === 5) {
      const reflection = defaultDay5Reflection();
      const reflectionMarkdown = buildDay5ReflectionMarkdown(reflection);
      await clickFirstVisible(page.getByRole('button', { name: /^write$/i }));
      const editorVisible = await page
        .locator('#reflection-challenges')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (editorVisible) {
        await page
          .locator('#reflection-challenges')
          .fill(reflection.challenges);
        await page.locator('#reflection-decisions').fill(reflection.decisions);
        await page.locator('#reflection-tradeoffs').fill(reflection.tradeoffs);
        await page
          .locator('#reflection-communication')
          .fill(reflection.communication);
        await page.locator('#reflection-next').fill(reflection.next);
        await clickFirstVisible(
          page.getByRole('button', { name: /^preview$/i }),
        );
        await clickFirstVisible(page.getByRole('button', { name: /^write$/i }));
        await clickFirstVisible(
          page.getByRole('button', { name: /save draft/i }),
        );
        const submitResponsePromise = page.waitForResponse(
          (response) =>
            response.url().includes(`/tasks/${taskId}/submit`) &&
            response.request().method() === 'POST',
          { timeout: 120000 },
        );
        await page.getByRole('button', { name: /submit & continue/i }).click();
        const submitResponse = await submitResponsePromise;
        writeJson(`candidate-day${requestedDay}-submit.json`, {
          ok: submitResponse.ok(),
          status: submitResponse.status(),
          url: submitResponse.url(),
          text: await submitResponse.text(),
        });
        if (!submitResponse.ok()) {
          throw new Error(
            `Day ${requestedDay} submit failed with status ${submitResponse.status()}.`,
          );
        }
      } else {
        const draftResponse = await browserFetchJson(
          page,
          `/api/backend/tasks/${taskId}/draft`,
          {
            method: 'PUT',
            headers: { 'x-candidate-session-id': String(candidateSessionId) },
            body: JSON.stringify({
              contentText: reflectionMarkdown,
              contentJson: { reflection },
            }),
          },
        );
        writeJson(
          `candidate-day${requestedDay}-draft-upsert.json`,
          draftResponse,
        );
        if (!draftResponse.ok) {
          throw new Error(
            `Day ${requestedDay} draft upsert failed: ${draftResponse.status} ${draftResponse.text}`,
          );
        }
        const submitResponse = await browserFetchJson(
          page,
          `/api/backend/tasks/${taskId}/submit`,
          {
            method: 'POST',
            headers: { 'x-candidate-session-id': String(candidateSessionId) },
            body: JSON.stringify({
              reflection,
              contentText: reflectionMarkdown,
            }),
          },
        );
        writeJson(`candidate-day${requestedDay}-submit.json`, submitResponse);
        if (!submitResponse.ok) {
          throw new Error(
            `Day ${requestedDay} submit failed: ${submitResponse.status} ${submitResponse.text}`,
          );
        }
      }
      await page.reload({ waitUntil: 'networkidle' });
      await waitForText(page, /simulation complete/i, 60000);
    }

    await page.waitForLoadState('networkidle');
    await capturePage(page, `candidate-day${requestedDay}-after.json`, {
      inviteToken,
      candidateSessionId,
      taskId,
    });
    const currentTaskAfter = await fetchCandidateCurrentTask(
      page,
      candidateSessionId,
      `candidate-day${requestedDay}-current-task-after.json`,
    );
    const summary = {
      inviteToken,
      candidateSessionId,
      taskId,
      requestedDay,
      pageUrl: page.url(),
      currentTaskAfter: currentTaskAfter.json,
    };
    writeJson(`candidate-day${requestedDay}-summary.json`, summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

function extractCompareRows(responseJson) {
  if (Array.isArray(responseJson)) return responseJson;
  if (responseJson && Array.isArray(responseJson.rows))
    return responseJson.rows;
  if (responseJson && Array.isArray(responseJson.items))
    return responseJson.items;
  return [];
}

async function runRecruiterReviewFlow() {
  const context = resolveLiveContext();
  const simulationId = requireSimulationId(context);
  const candidateSessionId = requireCandidateSessionId(context);

  return await withPage('recruiter', async (page) => {
    await page.goto(`/dashboard/simulations/${simulationId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle');
    const compareRow = page
      .locator(`[data-testid="candidate-compare-row-${candidateSessionId}"]`)
      .first();
    await compareRow.waitFor({ state: 'visible', timeout: 60000 });
    await capturePage(page, 'recruiter-simulation-detail.json', {
      simulationId,
      candidateSessionId,
    });

    const compareResponse = await browserFetchJson(
      page,
      `/api/simulations/${simulationId}/candidates/compare`,
      { method: 'GET' },
    );
    writeJson('recruiter-compare-response.json', compareResponse);
    if (!compareResponse.ok) {
      throw new Error(
        `Recruiter compare failed: ${compareResponse.status} ${compareResponse.text}`,
      );
    }
    const compareRows = extractCompareRows(compareResponse.json);
    const compareRowPayload =
      compareRows.find(
        (row) =>
          String(row?.candidateSessionId ?? row?.candidate_session_id ?? '') ===
          String(candidateSessionId),
      ) ?? null;

    const submissionsPath = `/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}`;
    await page.goto(submissionsPath, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await waitForText(page, /submissions/i, 60000);
    await capturePage(page, 'recruiter-submissions-page.json', {
      simulationId,
      candidateSessionId,
    });

    const fitProfilePath = `/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}/fit-profile`;
    const fitProfileStatusEndpoint = `/api/candidate_sessions/${candidateSessionId}/fit_profile`;
    const fitProfileGenerateEndpoint = `/api/candidate_sessions/${candidateSessionId}/fit_profile/generate`;
    const fitProfileStatusBefore = await browserFetchJson(
      page,
      fitProfileStatusEndpoint,
      {
        method: 'GET',
      },
    );
    writeJson(
      'recruiter-fit-profile-status-before.json',
      fitProfileStatusBefore,
    );
    await page.goto(fitProfilePath, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const generateButton = page
      .getByRole('button', { name: /(?:generate fit profile|retry)/i })
      .first();
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      await page.waitForLoadState('networkidle');
    }
    const fitProfileStatusAfterClick = await browserFetchJson(
      page,
      fitProfileStatusEndpoint,
      {
        method: 'GET',
      },
    );
    writeJson(
      'recruiter-fit-profile-status-after-click.json',
      fitProfileStatusAfterClick,
    );
    const fitProfileStatusValue = String(
      fitProfileStatusAfterClick.json?.status ??
        fitProfileStatusBefore.json?.status ??
        '',
    ).trim();
    if (
      fitProfileStatusValue === 'not_started' ||
      fitProfileStatusValue === 'failed'
    ) {
      const generateResponse = await browserFetchJson(
        page,
        fitProfileGenerateEndpoint,
        {
          method: 'POST',
        },
      );
      writeJson('recruiter-fit-profile-generate.json', generateResponse);
      if (!generateResponse.ok) {
        throw new Error(
          `Fit Profile generate failed: ${generateResponse.status} ${generateResponse.text}`,
        );
      }
    }

    await pollUntil(
      page,
      'fit profile ready',
      async () => {
        await page.reload({ waitUntil: 'networkidle' });
        return {
          url: page.url(),
          text: await page.locator('body').innerText(),
        };
      },
      (response) =>
        /^http/.test(response.url) && /overall fit score/i.test(response.text),
      {
        attempts: 72,
        delayMs: 5000,
        snapshotName: 'recruiter-fit-profile-poll.json',
      },
    );
    await capturePage(page, 'recruiter-fit-profile-page.json', {
      simulationId,
      candidateSessionId,
    });

    const summary = {
      simulationId,
      candidateSessionId,
      compareRow: compareRowPayload,
      fitProfilePath,
      submissionsPath,
      fitProfileReady: true,
    };
    writeJson('recruiter-review-summary.json', summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

switch (command) {
  case 'recruiter-fresh':
    await runRecruiterFreshFlow();
    break;
  case 'candidate-schedule':
    await runCandidateScheduleFlow();
    break;
  case 'candidate-day':
    await runCandidateDayFlow();
    break;
  case 'recruiter-review':
    await runRecruiterReviewFlow();
    break;
  default:
    throw new Error(`Unknown command: ${command || '<empty>'}`);
}
