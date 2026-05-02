import fs from 'fs';
import dns from 'dns';
import path from 'path';
import { chromium } from 'playwright';

const command = process.argv[2]?.trim() || '';
const baseURL =
  process.env.CONTRACT_LIVE_BASE_URL?.trim() || 'http://127.0.0.1:3000';
const frontendOrigin =
  process.env.CONTRACT_LIVE_FRONTEND_ORIGIN?.trim() || 'http://localhost:3000';
const backendBaseURL =
  process.env.CONTRACT_LIVE_BACKEND_URL?.trim() || 'http://127.0.0.1:8000';
dns.setDefaultResultOrder('ipv4first');
const artifactsDir = process.env.CONTRACT_LIVE_ARTIFACTS_DIR?.trim();
const LOCAL_DEV_USER_EMAILS = {
  talent_partner: 'talent_partner1@local.test',
  candidate: 'candidate1@local.test',
};
let activeDevUserEmail = null;
let activeDevUserRole = null;
let activeCandidateSessionId = null;

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
    role === 'talent_partner'
      ? 'CONTRACT_LIVE_TALENT_PARTNER_STORAGE_STATE'
      : 'CONTRACT_LIVE_CANDIDATE_STORAGE_STATE';
  return (
    process.env[envKey]?.trim() ||
    path.join(
      storageDir,
      role === 'talent_partner'
        ? 'talent-partner-only.json'
        : 'candidate-only.json',
    )
  );
}

function requireStorageState(role) {
  const storageStatePath = resolveStorageState(role);
  if (fs.existsSync(storageStatePath)) {
    return storageStatePath;
  }
  const availableFiles = fs.existsSync(storageDir)
    ? fs.readdirSync(storageDir).sort()
    : [];
  throw new Error(
    [
      `Error reading storage state for ${role}.`,
      `Expected: ${storageStatePath}`,
      `Available in ${storageDir}: ${availableFiles.length ? availableFiles.join(', ') : '<none>'}`,
    ].join('\n'),
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

function resolveActiveDevUserEmail(role, overrideEmail = null) {
  const explicitEmail = trimToNull(overrideEmail);
  if (explicitEmail) return explicitEmail;
  if (role === 'talent_partner') {
    return (
      trimToNull(process.env.CONTRACT_LIVE_TALENT_PARTNER_EMAIL) ||
      trimToNull(process.env.QA_E2E_TALENT_PARTNER_EMAIL) ||
      LOCAL_DEV_USER_EMAILS.talent_partner
    );
  }
  return (
    trimToNull(process.env.CONTRACT_LIVE_CANDIDATE_EMAIL) ||
    trimToNull(process.env.QA_E2E_CANDIDATE_EMAIL) ||
    LOCAL_DEV_USER_EMAILS.candidate
  );
}

function parseDateInput(dateInput) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function getTimeZoneOffsetMs(timeZone, date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));
  const utcTs = Date.UTC(year, month - 1, day, hour, minute, second);
  return utcTs - date.getTime();
}

function isValidIanaTimezone(timeZone) {
  const normalized = trimToNull(timeZone);
  if (!normalized) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(
      new Date(),
    );
    return true;
  } catch {
    return false;
  }
}

function localDateAtHourToUtcIso({
  dateInput,
  timezone,
  hour = 9,
  minute = 0,
}) {
  const parsed = parseDateInput(dateInput);
  if (!parsed) throw new Error('Invalid date format.');
  if (!isValidIanaTimezone(timezone)) throw new Error('Invalid timezone.');
  const utcGuess = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    hour,
    minute,
    0,
    0,
  );
  const initialOffset = getTimeZoneOffsetMs(timezone, new Date(utcGuess));
  let utcTs = utcGuess - initialOffset;
  const adjustedOffset = getTimeZoneOffsetMs(timezone, new Date(utcTs));
  if (adjustedOffset !== initialOffset) utcTs = utcGuess - adjustedOffset;
  return new Date(utcTs).toISOString().replace('.000Z', 'Z');
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
  const trialId = trimToNull(
    process.env.CONTRACT_LIVE_TRIAL_ID || String(summary.trialId ?? ''),
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
    trialId,
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

function requireTrialId(context) {
  if (!context.trialId) {
    throw new Error(
      `Trial id is required. Provide CONTRACT_LIVE_TRIAL_ID or a summary file at ${context.summaryPath}.`,
    );
  }
  return context.trialId;
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

async function withPage(
  role,
  work,
  candidateSessionId = null,
  devUserEmailOverride = null,
) {
  const browser = await chromium.launch({ headless: true });
  const activeEmail = resolveActiveDevUserEmail(role, devUserEmailOverride);
  const extraHTTPHeaders = {};
  if (activeEmail) {
    extraHTTPHeaders['x-dev-user-email'] = activeEmail;
    extraHTTPHeaders['authorization'] = `Bearer ${role}:${activeEmail}`;
  }
  if (candidateSessionId != null) {
    extraHTTPHeaders['x-candidate-session-id'] = String(candidateSessionId);
  }
  const context = await browser.newContext({
    baseURL,
    storageState: requireStorageState(role),
    extraHTTPHeaders,
  });
  const page = await context.newPage();
  activeDevUserEmail = activeEmail;
  activeDevUserRole = role;
  activeCandidateSessionId = candidateSessionId;
  await page.route('**/api/backend/**', async (route) => {
    const headers = {
      ...route.request().headers(),
    };
    if (activeDevUserEmail) {
      headers['x-dev-user-email'] = activeDevUserEmail;
      headers['authorization'] = `Bearer ${role}:${activeDevUserEmail}`;
    }
    if (activeCandidateSessionId != null) {
      headers['x-candidate-session-id'] = String(activeCandidateSessionId);
    }
    await route.continue({ headers });
  });
  try {
    if (role === 'talent_partner') {
      await page.goto('/dashboard', {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForLoadState('domcontentloaded');
    }
    return await work(page);
  } finally {
    activeDevUserEmail = null;
    activeDevUserRole = null;
    activeCandidateSessionId = null;
    await browser.close();
  }
}

async function browserFetchJson(page, url, options = {}) {
  const cookieJar = await page.context().cookies(baseURL);
  const cookieHeader = cookieJar
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  const headers = {
    ...(activeDevUserEmail ? { 'x-dev-user-email': activeDevUserEmail } : {}),
    ...(activeDevUserEmail && activeDevUserRole
      ? {
          authorization: `Bearer ${activeDevUserRole}:${activeDevUserEmail}`,
        }
      : {}),
    ...(activeCandidateSessionId != null
      ? {
          'x-candidate-session-id': String(activeCandidateSessionId),
        }
      : {}),
    ...(url.startsWith('/api/backend/') ? { origin: frontendOrigin } : {}),
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
    ...(options.headers || {}),
  };
  const requestOptions = {
    ...options,
    headers,
  };
  if (options.body != null) {
    if (
      !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
    ) {
      headers['content-type'] = 'application/json';
    }
    const rawBody = String(options.body);
    try {
      requestOptions.data = JSON.parse(rawBody);
    } catch {
      requestOptions.data = rawBody;
    }
    delete requestOptions.body;
  }

  const absoluteUrl = new URL(
    url.startsWith('/api/backend/')
      ? url.replace(/^\/api\/backend/, '/api')
      : url,
    url.startsWith('/api/backend/') ? backendBaseURL : baseURL,
  ).toString();
  const res = await page.request.fetch(absoluteUrl, requestOptions);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return {
    ok: res.ok(),
    status: res.status(),
    statusText: res.statusText(),
    url: res.url(),
    text,
    json,
  };
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
  trialId,
  { candidateName, candidateEmail },
) {
  let lastDetail = null;
  let lastInvite = null;
  for (let attempt = 1; attempt <= 36; attempt += 1) {
    const invite = await browserFetchJson(
      page,
      `/api/trials/${trialId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({
          candidateName,
          inviteEmail: candidateEmail,
        }),
      },
    );
    lastInvite = invite;
    writeJson(`trial-${trialId}-invite-attempt-${attempt}.json`, invite);
    if (invite.ok) {
      writeJson(`trial-${trialId}-invite.json`, invite);
      return { invite, lastDetail, attempts: attempt };
    }
    if (!isRetryableInviteNotReady(invite)) {
      writeJson(`trial-${trialId}-invite.json`, invite);
      throw new Error(`Invite failed: ${invite.status} ${invite.text}`);
    }
    lastDetail = await browserFetchJson(page, `/api/trials/${trialId}`, {
      method: 'GET',
    });
    writeJson(`trial-${trialId}-detail-invite-retry-${attempt}.json`, {
      attempt,
      detail: lastDetail,
      invite,
    });
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
  const screenshotName = `${name.replace(/\.json$/i, '')}.png`;
  const screenshotPath = path.join(artifactsDir, screenshotName);
  writeJson(name, {
    capturedAt: new Date().toISOString(),
    url: page.url(),
    text: await page.locator('body').innerText(),
    extra,
  });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function captureButtonState(page, name) {
  const locator = page.getByRole('button', { name });
  const count = await locator.count();
  if (count === 0) {
    return {
      count: 0,
      visible: false,
      disabled: null,
      label: typeof name === 'string' ? name : String(name),
    };
  }
  const button = locator.first();
  return {
    count,
    visible: await button.isVisible().catch(() => false),
    disabled: await button.isDisabled().catch(() => null),
    label: typeof name === 'string' ? name : String(name),
  };
}

async function scheduleCandidateSessionViaApi(page, inviteToken, payload) {
  const response = await browserFetchJson(
    page,
    `/api/backend/candidate/session/${encodeURIComponent(inviteToken)}/schedule`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  writeJson('candidate-schedule-response.json', response);
  if (!response.ok) {
    throw new Error(
      `Candidate schedule failed: ${response.status} ${response.text}`,
    );
  }
  return response;
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

async function gotoCandidateSession(
  page,
  inviteToken,
  options = { waitForReady: true },
) {
  await page.goto(`/candidate/session/${inviteToken}`, {
    waitUntil: 'commit',
    timeout: 60000,
  });
  await page
    .waitForLoadState('domcontentloaded', { timeout: 60000 })
    .catch(() => {});
  if (page.url().includes('/auth/login')) {
    throw new Error(`Candidate session redirected to login: ${page.url()}`);
  }
  if (options.waitForReady !== false) {
    await waitForCandidateSessionReady(page, 60000);
  }
}

async function ensureDayVisible(page, day) {
  const patterns = [
    new RegExp(`^Day ${day}\\s+open(?:\\b|\\s|$)`, 'i'),
    new RegExp(`^Day ${day}\\s+is not open yet(?:\\b|\\s|$)`, 'i'),
    /^Day closed$/i,
    /GitHub Codespace ready\./i,
    /Codespace workspace/i,
    /Primary work environment/i,
    /Open Codespace/i,
    /Day 2 and Day 3 implementation work must happen in GitHub Codespaces only\./i,
  ];
  for (const pattern of patterns) {
    const locator = page.getByText(pattern).first();
    if (await locator.isVisible().catch(() => false)) {
      return;
    }
    try {
      await locator.waitFor({ state: 'visible', timeout: 20000 });
      return;
    } catch {
      // Try the next real UI state. The candidate session banner may be open,
      // waiting to open, or briefly transitioning after the Start trial click.
    }
  }
  throw new Error(`Timed out waiting for Day ${day} to become visible.`);
}

async function waitForText(page, pattern, timeout = 60000) {
  await page.getByText(pattern).first().waitFor({ state: 'visible', timeout });
}

async function waitForCodespaceReadyMarkers(page, timeout = 60000) {
  const readinessChecks = [
    {
      label: 'GitHub Codespace ready.',
      locator: page.getByText(/GitHub Codespace ready\./i).first(),
    },
    {
      label: 'Codespace workspace',
      locator: page.getByText(/Codespace workspace/i).first(),
    },
    {
      label: 'Primary work environment',
      locator: page.getByText(/Primary work environment/i).first(),
    },
    {
      label: 'Open Codespace',
      locator: page.getByRole('link', { name: /^open codespace$/i }).first(),
    },
    {
      label:
        'Day 2 and Day 3 implementation work must happen in GitHub Codespaces only.',
      locator: page
        .getByText(
          /Day 2 and Day 3 implementation work must happen in GitHub Codespaces only\./i,
        )
        .first(),
    },
  ];
  const deadline = Date.now() + timeout;
  let lastVisibleLabel = null;
  while (Date.now() < deadline) {
    for (const check of readinessChecks) {
      if (await check.locator.isVisible().catch(() => false)) {
        return check.label;
      }
      lastVisibleLabel = check.label;
    }
    await sleep(500);
  }
  throw new Error(
    `Timed out waiting for Codespace readiness markers. Last checked marker: ${lastVisibleLabel ?? '<none>'}.`,
  );
}

async function waitForOpenCodespaceLink(page, timeout = 60000) {
  const codespaceLink = page
    .getByRole('link', {
      name: /^open codespace$/i,
    })
    .first();
  const retryButton = page.getByRole('button', { name: /try again/i }).first();
  const deadline = Date.now() + timeout;
  let lastState = null;

  while (Date.now() < deadline) {
    if (await codespaceLink.isVisible().catch(() => false)) {
      return;
    }

    if (await retryButton.isVisible().catch(() => false)) {
      lastState = 'retry-button-visible';
      await retryButton.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    } else {
      lastState = 'link-not-visible';
      await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
    }

    await sleep(2000);
  }

  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '');
  throw new Error(
    `Timed out waiting for Open Codespace link. Last state: ${lastState ?? '<none>'}. Body: ${bodyText}`,
  );
}

async function waitForCandidateSessionReady(page, timeout = 60000) {
  const readinessChecks = [
    {
      label: 'Start trial',
      locator: page.getByRole('button', { name: /start trial/i }).first(),
    },
    {
      label: 'Trial locked until start',
      locator: page.getByText(/trial locked until start/i).first(),
    },
    {
      label: 'Pick your start date',
      locator: page.getByText(/pick your start date/i).first(),
    },
    {
      label: '5-day timeline',
      locator: page.getByText(/5-day timeline/i).first(),
    },
    {
      label: 'Loading your tasks and workspace',
      locator: page.getByText(/loading your tasks and workspace\./i).first(),
    },
  ];
  const deadline = Date.now() + timeout;
  let lastVisibleLabel = null;
  while (Date.now() < deadline) {
    for (const check of readinessChecks) {
      if (await check.locator.isVisible().catch(() => false)) {
        return check.label;
      }
      lastVisibleLabel = check.label;
    }
    await sleep(500);
  }
  throw new Error(
    `Timed out waiting for candidate session readiness. Last checked marker: ${lastVisibleLabel ?? '<none>'}.`,
  );
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

async function controlCandidateSessionDayWindow(
  page,
  candidateSessionId,
  targetDayIndex,
  candidateTimezone,
) {
  const adminKey =
    trimToNull(process.env.WINOE_ADMIN_API_KEY) ||
    trimToNull(process.env.ADMIN_API_KEY);
  if (!adminKey) {
    throw new Error(
      'WINOE_ADMIN_API_KEY is required to control candidate day windows.',
    );
  }

  const response = await fetch(
    `${backendBaseURL}/api/admin/candidate_sessions/${candidateSessionId}/day_windows/control`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify({
        targetDayIndex,
        reason: `contract-live day ${targetDayIndex} window retime`,
        candidateTimezone: candidateTimezone || undefined,
      }),
    },
  );
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  const result = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    text,
    json,
  };
  writeJson(`candidate-day${targetDayIndex}-day-window-control.json`, result);
  if (!response.ok) {
    throw new Error(
      `Candidate day-window control failed for day ${targetDayIndex}: ${response.status} ${text}`,
    );
  }
  return result;
}

async function submitCandidateTaskViaApi(
  page,
  taskId,
  candidateSessionId,
  payload,
  outputName = 'candidate-task-submit-api.json',
) {
  const response = await browserFetchJson(
    page,
    `/api/backend/tasks/${taskId}/submit`,
    {
      method: 'POST',
      headers: {
        'x-candidate-session-id': String(candidateSessionId),
      },
      body: JSON.stringify(payload),
    },
  );
  writeJson(outputName, response);
  if (!response.ok) {
    throw new Error(
      `Task submit API failed: ${response.status} ${response.text}`,
    );
  }
  return response;
}

async function initCandidateWorkspaceViaApi(
  page,
  taskId,
  candidateSessionId,
  githubUsername,
  outputName = 'candidate-workspace-init-api.json',
) {
  const response = await browserFetchJson(
    page,
    `/api/backend/tasks/${taskId}/codespace/init`,
    {
      method: 'POST',
      headers: { 'x-candidate-session-id': String(candidateSessionId) },
      body: JSON.stringify({ githubUsername }),
    },
  );
  writeJson(outputName, response);
  if (!response.ok) {
    throw new Error(
      `Workspace init API failed: ${response.status} ${response.text}`,
    );
  }
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
    '- Delivery plan: fix live blockers first, then prove the talent_partner, candidate, and review flows.',
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
    next: 'Next I would tighten live diagnostics around task transitions, transcript latency, and winoe-report generation observability.',
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

async function runTalentPartnerFreshFlow() {
  return await withPage('talent_partner', async (page) => {
    const title = `Fresh Contract Live ${nowIsoSafe()}`;
    const candidateName =
      process.env.CONTRACT_LIVE_CANDIDATE_NAME?.trim() || 'Robie Candidate';
    const candidateEmail =
      process.env.CONTRACT_LIVE_CANDIDATE_EMAIL?.trim() ||
      'robiemelaku@gmail.com';

    const createPayload = {
      title,
      role: 'Backend Engineer',
      seniority: 'Mid',
      preferredLanguageFramework: 'Python, FastAPI, pytest',
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

    const created = await browserFetchJson(page, '/api/trials', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    });
    writeJson('trial-create.json', created);
    if (!created.ok) {
      throw new Error(`Trial create failed: ${created.status} ${created.text}`);
    }

    const trialId = String(created.json?.id ?? '').trim();
    if (!trialId) {
      throw new Error(`Trial create did not return an id: ${created.text}`);
    }

    const readyDetail = await pollUntil(
      page,
      'trial ready_for_review',
      async () => {
        return await browserFetchJson(page, `/api/trials/${trialId}`, {
          method: 'GET',
        });
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
        snapshotName: `trial-${trialId}-detail-ready-check.json`,
      },
    );

    const scenarioVersionId = String(
      readyDetail.json?.pendingScenarioVersionId ??
        readyDetail.json?.activeScenarioVersionId ??
        '',
    ).trim();
    if (!scenarioVersionId) {
      throw new Error(`Trial ${trialId} is missing a scenario version id.`);
    }

    const approve = await browserFetchJson(
      page,
      `/api/backend/trials/${trialId}/scenario/${scenarioVersionId}/approve`,
      { method: 'POST' },
    );
    writeJson(`trial-${trialId}-approve.json`, approve);
    if (!approve.ok) {
      throw new Error(
        `Scenario approve failed: ${approve.status} ${approve.text}`,
      );
    }

    const activate = await browserFetchJson(
      page,
      `/api/trials/${trialId}/activate`,
      {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      },
    );
    writeJson(`trial-${trialId}-activate.json`, activate);
    if (!activate.ok) {
      throw new Error(
        `Trial activate failed: ${activate.status} ${activate.text}`,
      );
    }

    const activeDetail = await pollUntil(
      page,
      'trial active_inviting',
      async () => {
        return await browserFetchJson(page, `/api/trials/${trialId}`, {
          method: 'GET',
        });
      },
      (response) => response.ok && response.json?.status === 'active_inviting',
      {
        attempts: 30,
        delayMs: 2000,
        snapshotName: `trial-${trialId}-detail-active.json`,
      },
    );

    const {
      invite,
      lastDetail: inviteRetryDetail,
      attempts: inviteAttempts,
    } = await inviteCandidateWithBundleRetry(page, trialId, {
      candidateName,
      candidateEmail,
    });

    const candidates = await browserFetchJson(
      page,
      `/api/trials/${trialId}/candidates`,
      {
        method: 'GET',
      },
    );
    writeJson(`trial-${trialId}-candidates.json`, candidates);

    const postInviteDetail = await browserFetchJson(
      page,
      `/api/trials/${trialId}`,
      {
        method: 'GET',
      },
    );
    writeJson(`trial-${trialId}-detail-post-invite.json`, postInviteDetail);

    const summary = {
      trialId,
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
  const githubUsername =
    trimToNull(process.env.CONTRACT_LIVE_GITHUB_USERNAME) || 'robelmelaku';

  if (!scheduleDate) {
    throw new Error(
      'CONTRACT_LIVE_SCHEDULE_DATE is required for candidate-schedule.',
    );
  }

  return await withPage(
    'candidate',
    async (page) => {
      await gotoCandidateSession(page, inviteToken, { waitForReady: false });
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
      const claimResponse = await browserFetchJson(
        page,
        `/api/backend/candidate/session/${inviteToken}/claim`,
        { method: 'POST' },
      );
      writeJson('candidate-claim-before-schedule.json', claimResponse);
      if (!claimResponse.ok) {
        throw new Error(
          `Candidate claim failed before scheduling: ${claimResponse.status} ${claimResponse.text}`,
        );
      }
      await capturePage(page, 'candidate-schedule-landing.json', {
        inviteToken,
        scheduleDate,
        candidateTimezone,
      });

      const startButton = page.getByRole('button', { name: /start trial/i });
      const scheduleStartDate = page.getByLabel(/start date/i);
      if ((await startButton.count()) > 0) {
        await startButton.first().waitFor({ state: 'visible', timeout: 60000 });
        const startButtonClicked = await clickFirstVisible(startButton);
        if (startButtonClicked) {
          await page.waitForLoadState('networkidle');
        }
      }
      await scheduleStartDate.waitFor({ state: 'visible', timeout: 60000 });

      await scheduleStartDate.fill(scheduleDate);
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

      const continueButton = page.getByRole('button', { name: /^continue$/i });
      await continueButton.click();
      await page.waitForTimeout(500);
      const githubValidationVisible = await page
        .getByText(/enter your github username/i)
        .first()
        .isVisible()
        .catch(() => false);
      if (!githubValidationVisible) {
        throw new Error(
          'Candidate schedule should block empty GitHub username before continuing.',
        );
      }

      await page.getByLabel(/github username/i).fill(githubUsername);
      const scheduledStartAtUtc = localDateAtHourToUtcIso({
        dateInput: scheduleDate,
        timezone: candidateTimezone,
        hour: 9,
        minute: 0,
      });
      const scheduleResponse = await scheduleCandidateSessionViaApi(
        page,
        inviteToken,
        {
          scheduledStartAt: scheduledStartAtUtc,
          candidateTimezone,
          githubUsername,
        },
      );
      const scheduleJson = scheduleResponse.json;

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
        githubUsername:
          scheduleJson?.githubUsername ??
          bootstrapAfter.json?.githubUsername ??
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
    },
    context.candidateSessionId,
  );
}

async function runCandidateDayFlow() {
  const context = resolveLiveContext();
  const inviteToken = requireInviteToken(context);
  const candidateSessionId = requireCandidateSessionId(context);
  const candidateTimezone =
    trimToNull(process.env.CONTRACT_LIVE_CANDIDATE_TIMEZONE) ||
    'America/New_York';
  const githubUsername =
    trimToNull(process.env.CONTRACT_LIVE_GITHUB_USERNAME) || 'robelmelaku';
  const requestedDay = Number(
    trimToNull(process.env.CONTRACT_LIVE_DAY) ||
      trimToNull(process.env.CONTRACT_LIVE_EXPECT_DAY) ||
      '',
  );

  if (!Number.isInteger(requestedDay) || requestedDay < 1 || requestedDay > 5) {
    throw new Error('candidate-day requires CONTRACT_LIVE_DAY=1..5.');
  }

  return await withPage(
    'candidate',
    async (page) => {
      await gotoCandidateSession(page, inviteToken);
      const startTrialButton = page.getByRole('button', {
        name: /start trial/i,
      });
      const startTrialVisible = await startTrialButton
        .first()
        .isVisible()
        .catch(() => false);
      if (!startTrialVisible) {
        await controlCandidateSessionDayWindow(
          page,
          candidateSessionId,
          requestedDay,
          candidateTimezone,
        );
        await page.reload({ waitUntil: 'networkidle' });
        await waitForCandidateSessionReady(page, 60000);
      }
      await clickFirstVisible(startTrialButton);
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
      const closedByBackend =
        currentTaskBefore.json?.currentWindow?.isOpen === false ||
        currentTaskBefore.json?.currentWindow?.state === 'closed';
      if (!Number.isFinite(taskId)) {
        throw new Error(
          `Current task for day ${requestedDay} did not include a task id: ${JSON.stringify(
            currentTaskBefore.json,
            null,
            2,
          )}`,
        );
      }
      if (requestedDay === 1 && actualDayIndex > requestedDay) {
        writeJson(`candidate-day${requestedDay}-already-advanced.json`, {
          requestedDay,
          actualDayIndex,
          currentTask: currentTaskBefore.json?.currentTask ?? null,
          completedTaskIds: currentTaskBefore.json?.completedTaskIds ?? null,
          note: 'Day 1 was already advanced in the live session state, so the driver records the current task and continues with later phases.',
        });
        const summary = {
          inviteToken,
          candidateSessionId,
          taskId,
          requestedDay,
          pageUrl: page.url(),
          closedByBackend,
          currentTaskAfter: currentTaskBefore.json,
          skippedAlreadyAdvanced: true,
        };
        writeJson(`candidate-day${requestedDay}-summary.json`, summary);
        process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
        return;
      }
      if (actualDayIndex !== requestedDay) {
        if (
          requestedDay >= 4 &&
          Number.isFinite(actualDayIndex) &&
          actualDayIndex < requestedDay
        ) {
          await controlCandidateSessionDayWindow(
            page,
            candidateSessionId,
            requestedDay,
            candidateTimezone,
          );
          await page.reload({ waitUntil: 'networkidle' });
          const currentTaskAfterControl = await fetchCandidateCurrentTask(
            page,
            candidateSessionId,
            `candidate-day${requestedDay}-current-task-after-control.json`,
          );
          const reopenedDayIndex = Number(
            currentTaskAfterControl.json?.currentTask?.dayIndex,
          );
          if (reopenedDayIndex !== requestedDay) {
            throw new Error(
              `Day ${requestedDay} window control did not expose the requested day. Current task: ${JSON.stringify(
                currentTaskAfterControl.json,
                null,
                2,
              )}`,
            );
          }
        } else {
          throw new Error(
            `Expected day ${requestedDay} but current task is day ${actualDayIndex}: ${JSON.stringify(
              currentTaskBefore.json,
              null,
              2,
            )}`,
          );
        }
      }

      await capturePage(page, `candidate-day${requestedDay}-before.json`, {
        inviteToken,
        candidateSessionId,
        taskId,
      });

      if (requestedDay === 1) {
        const submitResponse = await submitCandidateTaskViaApi(
          page,
          taskId,
          candidateSessionId,
          { contentText: defaultDay1Response() },
          `candidate-day${requestedDay}-submit-api.json`,
        );
        writeJson(`candidate-day${requestedDay}-submit.json`, {
          ok: submitResponse.ok,
          status: submitResponse.status,
          url: submitResponse.url,
          text: submitResponse.text,
          mode: 'api',
        });
        await page.waitForTimeout(1000);
        const currentTaskAfter = await fetchCandidateCurrentTask(
          page,
          candidateSessionId,
          `candidate-day${requestedDay}-current-task-after.json`,
        );
        const nextDayIndex = Number(
          currentTaskAfter.json?.currentTask?.dayIndex,
        );
        if (
          !Number.isFinite(nextDayIndex) ||
          nextDayIndex !== requestedDay + 1
        ) {
          throw new Error(
            `Day ${requestedDay} submit did not advance to the next task. Current task: ${JSON.stringify(
              currentTaskAfter.json,
              null,
              2,
            )}`,
          );
        }
      } else if (requestedDay === 2 || requestedDay === 3) {
        if (closedByBackend) {
          await controlCandidateSessionDayWindow(
            page,
            candidateSessionId,
            requestedDay,
            candidateTimezone,
          );
          await page.reload({ waitUntil: 'networkidle' });
          const currentTaskAfterControl = await fetchCandidateCurrentTask(
            page,
            candidateSessionId,
            `candidate-day${requestedDay}-current-task-after-control.json`,
          );
          const reopenedDayIndex = Number(
            currentTaskAfterControl.json?.currentTask?.dayIndex,
          );
          if (reopenedDayIndex !== requestedDay) {
            throw new Error(
              `Day ${requestedDay} window control did not expose the requested day. Current task: ${JSON.stringify(
                currentTaskAfterControl.json,
                null,
                2,
              )}`,
            );
          }
        } else {
          // The backend can advance the current task while the already-loaded
          // page remains on the stale locked state. Reload once so the live UI
          // reflects the active day before we wait for workspace/test controls.
          await page.reload({ waitUntil: 'networkidle' });
        }

        const codespaceLink = page.getByRole('link', {
          name: /^open codespace$/i,
        });
        const readinessLabel = await waitForCodespaceReadyMarkers(page, 60000);
        await initCandidateWorkspaceViaApi(
          page,
          taskId,
          candidateSessionId,
          githubUsername,
          `candidate-day${requestedDay}-workspace-init.json`,
        );
        await page.reload({ waitUntil: 'networkidle' });
        await waitForOpenCodespaceLink(page, 60000);
        const workspaceHref = await codespaceLink.first().getAttribute('href');
        writeJson(`candidate-day${requestedDay}-workspace.json`, {
          href: workspaceHref,
          label: 'Open Codespace',
          readinessLabel,
        });

        const runResponse = await browserFetchJson(
          page,
          `/api/backend/tasks/${taskId}/run`,
          {
            method: 'POST',
            headers: { 'x-candidate-session-id': String(candidateSessionId) },
            body: JSON.stringify({}),
          },
        );
        writeJson(`candidate-day${requestedDay}-run-start.json`, {
          ok: runResponse.ok,
          status: runResponse.status,
          url: runResponse.url,
          text: runResponse.text,
        });
        if (!runResponse.ok) {
          throw new Error(
            `Day ${requestedDay} run-tests start failed: ${runResponse.status} ${runResponse.text}`,
          );
        }

        await page.reload({ waitUntil: 'networkidle' });
        const runResult = {
          source: 'backend-run-response',
          backendRun: {
            ok: runResponse.ok,
            status: runResponse.status,
            url: runResponse.url,
            text: runResponse.text,
          },
          pageText: await page
            .locator('#main-content')
            .innerText()
            .catch(() => ''),
        };
        writeJson(`candidate-day${requestedDay}-run-result.json`, runResult);

        const submitResponse = await browserFetchJson(
          page,
          `/api/backend/tasks/${taskId}/submit`,
          {
            method: 'POST',
            headers: { 'x-candidate-session-id': String(candidateSessionId) },
            body: JSON.stringify({}),
          },
        );
        writeJson(`candidate-day${requestedDay}-submit.json`, {
          ok: submitResponse.ok,
          status: submitResponse.status,
          url: submitResponse.url,
          text: submitResponse.text,
        });
        if (!submitResponse.ok) {
          throw new Error(
            `Day ${requestedDay} submit failed with status ${submitResponse.status}.`,
          );
        }
      } else if (requestedDay === 4) {
        const transcriptReadyText = page.getByText(/full transcript/i).first();
        const transcriptAlreadyReady = await transcriptReadyText
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        if (!transcriptAlreadyReady) {
          const day4DemoFile = resolveDay4DemoFile();
          writeJson('candidate-day4-upload-fixture.json', {
            path: day4DemoFile,
            bytes: fs.statSync(day4DemoFile).size,
            mimeType: 'video/mp4',
          });
          const uploadInitResponse = await browserFetchJson(
            page,
            `/api/backend/tasks/${taskId}/handoff/upload/init`,
            {
              method: 'POST',
              headers: { 'x-candidate-session-id': String(candidateSessionId) },
              body: JSON.stringify({
                contentType: 'video/mp4',
                sizeBytes: fs.statSync(day4DemoFile).size,
                filename: path.basename(day4DemoFile),
                assetType: 'recording',
              }),
            },
          );
          writeJson(
            `candidate-day${requestedDay}-upload-init.json`,
            uploadInitResponse,
          );
          if (!uploadInitResponse.ok) {
            throw new Error(
              `Day ${requestedDay} upload init failed: ${uploadInitResponse.status} ${uploadInitResponse.text}`,
            );
          }

          const uploadInit = uploadInitResponse.json ?? {};
          const uploadUrl = trimToNull(uploadInit.uploadUrl);
          const recordingId = trimToNull(uploadInit.recordingId);
          if (!uploadUrl || !recordingId) {
            throw new Error(
              `Day ${requestedDay} upload init returned an invalid payload: ${JSON.stringify(
                uploadInitResponse.json,
                null,
                2,
              )}`,
            );
          }

          const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'video/mp4' },
            body: fs.readFileSync(day4DemoFile),
          });
          const uploadResultText = await uploadResult.text();
          writeJson(`candidate-day${requestedDay}-upload-put.json`, {
            ok: uploadResult.ok,
            status: uploadResult.status,
            url: uploadUrl,
            text: uploadResultText,
          });
          if (!uploadResult.ok) {
            throw new Error(
              `Day ${requestedDay} upload failed: ${uploadResult.status} ${uploadResultText}`,
            );
          }

          const consentResponse = await browserFetchJson(
            page,
            `/api/backend/candidate/session/${candidateSessionId}/privacy/consent`,
            {
              method: 'POST',
              headers: { 'x-candidate-session-id': String(candidateSessionId) },
              body: JSON.stringify({
                noticeVersion: 'mvp1',
                aiNoticeVersion: 'mvp1',
              }),
            },
          );
          writeJson(
            `candidate-day${requestedDay}-consent.json`,
            consentResponse,
          );
          if (!consentResponse.ok) {
            throw new Error(
              `Day ${requestedDay} consent save failed: ${consentResponse.status} ${consentResponse.text}`,
            );
          }

          const completeResponse = await browserFetchJson(
            page,
            `/api/backend/tasks/${taskId}/handoff/upload/complete`,
            {
              method: 'POST',
              headers: { 'x-candidate-session-id': String(candidateSessionId) },
              body: JSON.stringify({
                recordingId,
                consentAccepted: true,
                noticeVersion: 'mvp1',
                aiNoticeVersion: 'mvp1',
              }),
            },
          );
          writeJson(
            `candidate-day${requestedDay}-upload-complete.json`,
            completeResponse,
          );
          if (!completeResponse.ok) {
            throw new Error(
              `Day ${requestedDay} upload completion failed: ${completeResponse.status} ${completeResponse.text}`,
            );
          }

          await page.reload({ waitUntil: 'networkidle' });
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
        const completionPage = await page.context().newPage();
        await completionPage.goto(`/candidate/session/${inviteToken}`, {
          waitUntil: 'networkidle',
        });
        await waitForText(completionPage, /trial complete/i, 60000);

        const completedTaskAfter = await fetchCandidateCurrentTask(
          completionPage,
          candidateSessionId,
          `candidate-day${requestedDay}-current-task-after.json`,
        );
        const completedAt = completedTaskAfter.json?.completedAt ?? null;
        const completionDate = completedAt
          ? new Date(completedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : null;
        if (completionDate) {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const bodyText = await completionPage.locator('body').innerText();
            const completionDateVisible = bodyText.includes(completionDate);
            const completionUnavailableVisible =
              /completion date[\s\S]*?unavailable/i.test(bodyText);
            if (completionDateVisible && !completionUnavailableVisible) {
              break;
            }
            if (attempt < 2) {
              await completionPage.reload({ waitUntil: 'networkidle' });
              await waitForText(completionPage, /trial complete/i, 60000);
            }
          }
        }
        await page.waitForLoadState('networkidle');
        await capturePage(
          completionPage,
          `candidate-day${requestedDay}-after.json`,
          {
            inviteToken,
            candidateSessionId,
            taskId,
          },
        );
        const currentTaskAfter = await fetchCandidateCurrentTask(
          completionPage,
          candidateSessionId,
          `candidate-day${requestedDay}-current-task-after.json`,
        );
        const summary = {
          inviteToken,
          candidateSessionId,
          taskId,
          requestedDay,
          pageUrl: completionPage.url(),
          closedByBackend,
          currentTaskAfter: currentTaskAfter.json,
        };
        writeJson(`candidate-day${requestedDay}-summary.json`, summary);
        process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
        await completionPage.close();
        return;
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
        closedByBackend,
        currentTaskAfter: currentTaskAfter.json,
      };
      writeJson(`candidate-day${requestedDay}-summary.json`, summary);
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    },
    candidateSessionId,
    context.summary?.candidateEmail ?? null,
  );
}

function extractCompareRows(responseJson) {
  if (Array.isArray(responseJson)) return responseJson;
  if (responseJson && Array.isArray(responseJson.rows))
    return responseJson.rows;
  if (responseJson && Array.isArray(responseJson.items))
    return responseJson.items;
  return [];
}

async function runTalentPartnerReviewFlow() {
  const context = resolveLiveContext();
  const trialId = requireTrialId(context);
  const candidateSessionId = requireCandidateSessionId(context);
  const inviteToken = requireInviteToken(context);

  return await withPage('talent_partner', async (page) => {
    await page.goto(`/dashboard/trials/${trialId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForLoadState('networkidle');
    const compareRow = page
      .locator(`[data-testid="candidate-compare-row-${candidateSessionId}"]`)
      .first();
    const compareRowVisible = await compareRow
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    await capturePage(page, 'talent_partner-trial-detail.json', {
      trialId,
      candidateSessionId,
      compareRowVisible,
    });

    const compareResponse = await browserFetchJson(
      page,
      `/api/trials/${trialId}/candidates/compare`,
      { method: 'GET' },
    );
    writeJson('talent_partner-compare-response.json', compareResponse);
    if (!compareResponse.ok) {
      throw new Error(
        `TalentPartner compare failed: ${compareResponse.status} ${compareResponse.text}`,
      );
    }
    const compareRows = extractCompareRows(compareResponse.json);
    const compareRowPayload =
      compareRows.find(
        (row) =>
          String(row?.candidateSessionId ?? row?.candidate_session_id ?? '') ===
          String(candidateSessionId),
      ) ?? null;

    const submissionsPath = `/dashboard/trials/${trialId}/candidates/${candidateSessionId}`;
    await page.goto(submissionsPath, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForLoadState('networkidle');
    await waitForText(page, /submissions/i, 60000);
    const submissionsScreenshot = await capturePage(
      page,
      'talent_partner-submissions-page.json',
      {
        trialId,
        candidateSessionId,
      },
    );
    writeJson('talent_partner-submissions-page-screenshot.json', {
      path: submissionsScreenshot,
    });
    const reviewText = await page.locator('body').innerText();
    if (
      !/Implementation evidence comes from the official Trial repository and Codespace-captured work\./i.test(
        reviewText,
      ) ||
      !/Day 2 and Day 3 evidence from the official Trial repository and Codespace-captured work/i.test(
        reviewText,
      )
    ) {
      throw new Error(
        'Talent Partner submissions page did not expose the expected evidence-oriented Codespace copy.',
      );
    }

    const candidateReviewSummary = await withPage(
      'candidate',
      async (candidatePage) => {
        await candidatePage.goto(`/candidate/session/${inviteToken}/review`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await candidatePage.waitForLoadState('networkidle');
        await waitForText(candidatePage, /read-only review/i, 60000);
        await waitForText(candidatePage, /day 1 — design doc/i, 60000);
        await waitForText(
          candidatePage,
          /day 2 — implementation kickoff/i,
          60000,
        );
        await waitForText(
          candidatePage,
          /day 3 — implementation wrap-up/i,
          60000,
        );
        await waitForText(candidatePage, /day 4 — handoff \+ demo/i, 60000);
        await waitForText(candidatePage, /day 5 — reflection essay/i, 60000);
        const forbiddenControlChecks = [
          ['textarea', candidatePage.locator('textarea')],
          ['markdown editor', candidatePage.getByText(/markdown editor/i)],
          [
            'upload control',
            candidatePage.getByRole('button', { name: /attach files/i }),
          ],
          [
            'save draft',
            candidatePage.getByRole('button', { name: /save draft/i }),
          ],
          [
            'submit',
            candidatePage.getByRole('button', {
              name: /^submit(?:\s+and\s+lock)?$/i,
            }),
          ],
          [
            'run tests',
            candidatePage.getByRole('button', { name: /run tests/i }),
          ],
          [
            'recording controls',
            candidatePage.getByRole('button', { name: /record/i }),
          ],
        ];
        for (const [label, locator] of forbiddenControlChecks) {
          const visible = await locator
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
          if (visible) {
            throw new Error(
              `Read-only review page exposed a forbidden control: ${label}.`,
            );
          }
        }
        const candidateReviewScreenshot = await capturePage(
          candidatePage,
          'candidate-review-page.json',
          {
            trialId,
            candidateSessionId,
            inviteToken,
          },
        );
        writeJson('candidate-review-page-screenshot.json', {
          path: candidateReviewScreenshot,
        });
        return {
          candidateReviewPath: `/candidate/session/${inviteToken}/review`,
        };
      },
      candidateSessionId,
      context.summary?.candidateEmail ?? null,
    );
    const summary = {
      trialId,
      candidateSessionId,
      compareRow: compareRowPayload,
      submissionsPath,
      submissionsScreenshot,
      ...candidateReviewSummary,
    };
    writeJson('talent_partner-review-summary.json', summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

async function runTalentPartnerTerminateFlow() {
  const context = resolveLiveContext();
  const trialId = requireTrialId(context);
  const candidateSessionId = requireCandidateSessionId(context);
  const inviteToken = requireInviteToken(context);

  return await withPage('talent_partner', async (page) => {
    await page.goto(`/dashboard/trials/${trialId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle');

    const trialBefore = await browserFetchJson(page, `/api/trials/${trialId}`, {
      method: 'GET',
    });
    writeJson('talent_partner-terminate-before-trial.json', trialBefore);
    if (!trialBefore.ok) {
      throw new Error(
        `Trial detail before termination failed: ${trialBefore.status} ${trialBefore.text}`,
      );
    }

    const terminateResponse = await browserFetchJson(
      page,
      `/api/trials/${trialId}/terminate`,
      {
        method: 'POST',
        body: JSON.stringify({
          confirm: true,
          reason: 'phase 3 live verification cleanup',
        }),
      },
    );
    writeJson('talent_partner-terminate-response.json', terminateResponse);
    if (!terminateResponse.ok) {
      throw new Error(
        `Trial terminate failed: ${terminateResponse.status} ${terminateResponse.text}`,
      );
    }

    const cleanupJobId = Array.isArray(terminateResponse.json?.cleanupJobIds)
      ? terminateResponse.json.cleanupJobIds[0]
      : null;
    if (!cleanupJobId) {
      throw new Error(
        `Terminate response did not include a cleanup job id: ${JSON.stringify(terminateResponse.json, null, 2)}`,
      );
    }

    const trialAfter = await browserFetchJson(page, `/api/trials/${trialId}`, {
      method: 'GET',
    });
    writeJson('talent_partner-terminate-after-trial.json', trialAfter);

    const jobStatus = await pollUntil(
      page,
      'trial cleanup job terminal state',
      async () => {
        return await browserFetchJson(
          page,
          `/api/backend/jobs/${cleanupJobId}`,
          {
            method: 'GET',
          },
        );
      },
      (response) =>
        response.ok &&
        ['completed', 'failed'].includes(
          String(response.json?.status ?? '').trim(),
        ),
      {
        attempts: 36,
        delayMs: 2000,
        snapshotName: 'talent_partner-terminate-job-poll.json',
      },
    );
    writeJson('talent_partner-terminate-job-final.json', jobStatus);

    const reterminateResponse = await browserFetchJson(
      page,
      `/api/trials/${trialId}/terminate`,
      {
        method: 'POST',
        body: JSON.stringify({
          confirm: true,
        }),
      },
    );
    writeJson(
      'talent_partner-terminate-idempotent-response.json',
      reterminateResponse,
    );

    const inviteAfterTerminate = await browserFetchJson(
      page,
      `/api/trials/${trialId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({
          candidateName: 'Blocked Invite',
          inviteEmail: 'blocked-after-terminate@example.com',
        }),
      },
    );
    writeJson(
      'talent_partner-terminate-invite-after.json',
      inviteAfterTerminate,
    );

    const candidateInviteResolve = await withPage(
      'candidate',
      async (candidatePage) => {
        const resolveResponse = await browserFetchJson(
          candidatePage,
          `/api/backend/candidate/session/${inviteToken}`,
          { method: 'GET' },
        );
        writeJson('candidate-terminate-resolve.json', resolveResponse);
        const claimResponse = await browserFetchJson(
          candidatePage,
          `/api/backend/candidate/session/${inviteToken}/claim`,
          { method: 'POST' },
        );
        writeJson('candidate-terminate-claim.json', claimResponse);
        return { resolveResponse, claimResponse };
      },
    );

    const summary = {
      trialId,
      candidateSessionId,
      inviteToken,
      cleanupJobId,
      terminationStatus: terminateResponse.json?.status ?? null,
      terminationJobStatus: jobStatus.json?.status ?? null,
      postTerminationInviteStatus: inviteAfterTerminate.status,
      candidateResolveStatus: candidateInviteResolve.resolveResponse.status,
      candidateClaimStatus: candidateInviteResolve.claimResponse.status,
      idempotentTerminationStatus: reterminateResponse.status,
    };
    writeJson('talent_partner-terminate-summary.json', summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  });
}

switch (command) {
  case 'talent_partner-fresh':
    await runTalentPartnerFreshFlow();
    break;
  case 'candidate-day5':
    if (!trimToNull(process.env.CONTRACT_LIVE_DAY)) {
      process.env.CONTRACT_LIVE_DAY = '5';
    }
    await runCandidateDayFlow();
    break;
  case 'candidate-schedule':
    await runCandidateScheduleFlow();
    break;
  case 'candidate-day':
    await runCandidateDayFlow();
    break;
  case 'talent_partner-review':
    await runTalentPartnerReviewFlow();
    break;
  case 'talent_partner-terminate':
    await runTalentPartnerTerminateFlow();
    break;
  default:
    throw new Error(`Unknown command: ${command || '<empty>'}`);
}
