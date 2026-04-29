import fs from 'fs/promises';
import path from 'path';
import { chromium, type FullConfig, type Page } from '@playwright/test';
import { generateSessionCookie } from '@auth0/nextjs-auth0/testing';
import {
  parseEnvFile,
  readEnv,
  resolveClaimNamespace,
  type EnvMap,
} from '../flow-qa/global-setup.env';
import {
  resolveBaseURL,
  resolveStorageDir,
} from '../flow-qa/global-setup.paths';
import {
  buildSession,
  resolveDevIdentity,
  toStorageStateCookie,
  writeStorageState,
} from '../flow-qa/global-setup.session';

type LiveRole = 'talent_partner' | 'candidate';

type LiveIdentity = {
  connection: string;
  email: string;
  fileName: string;
  mode: LiveRole;
  password: string;
  returnTo: string;
};

const REQUIRED_QA_AUTH_ENV_KEYS = [
  'QA_E2E_TALENT_PARTNER_EMAIL',
  'QA_E2E_TALENT_PARTNER_PASSWORD',
  'QA_E2E_CANDIDATE_EMAIL',
  'QA_E2E_CANDIDATE_PASSWORD',
] as const;
const LOCAL_DEV_ROLE_EMAILS = {
  talent_partner: 'talent_partner1@local.test',
  candidate: 'candidate1@local.test',
} as const;

async function loadEnvMapFrom(paths: string[]): Promise<EnvMap> {
  const merged: EnvMap = {};
  for (const envPath of paths) {
    try {
      const content = await fs.readFile(envPath, 'utf8');
      Object.assign(merged, parseEnvFile(content));
    } catch {
      continue;
    }
  }
  return merged;
}

function resolveSupportedEnvPaths(repoRoot: string): string[] {
  return [
    path.join(repoRoot, '.env.local'),
    path.resolve(repoRoot, '..', 'winoe-backend', '.env'),
  ];
}

function requireEnv(key: string, envMap: EnvMap): string {
  const value = readEnv(key, envMap);
  if (value) return value;
  throw new Error(
    `Contract-live requires ${key}. Set it in the environment or one of the supported local env files.`,
  );
}

function validateRequiredQaAuthEnv(envMap: EnvMap): void {
  const missing = REQUIRED_QA_AUTH_ENV_KEYS.filter(
    (key) => !readEnv(key, envMap),
  );
  if (missing.length === 0) return;

  throw new Error(
    `Contract-live browser QA requires real Auth0 QA credentials. Missing: ${missing.join(', ')}. Set them in the environment or one of the supported local env files before rerunning the lane.`,
  );
}

function hasRequiredQaAuthEnv(envMap: EnvMap): boolean {
  return REQUIRED_QA_AUTH_ENV_KEYS.every((key) =>
    Boolean(readEnv(key, envMap)),
  );
}

async function createLocalDevStorageState(params: {
  baseURL: string;
  envMap: EnvMap;
  identity: LiveIdentity;
  storagePath: string;
}): Promise<void> {
  const secret = requireEnv('WINOE_AUTH0_SECRET', params.envMap);
  const claimNamespace = resolveClaimNamespace(params.envMap);
  const roles =
    params.identity.mode === 'candidate' ? ['candidate'] : ['talent_partner'];
  const identity = resolveDevIdentity(roles);
  const session = buildSession({
    permissions:
      params.identity.mode === 'candidate'
        ? ['candidate:access']
        : ['talent_partner:access'],
    roles,
    claimNamespace,
    accessToken: identity.accessToken,
    email: identity.email,
    sub: identity.sub,
  });
  const encrypted = await generateSessionCookie(session, { secret });
  const cookie = toStorageStateCookie({
    value: encrypted,
    baseURL: params.baseURL,
  });
  await writeStorageState(params.storagePath, cookie);
}

function resolveIdentity(role: LiveRole, envMap: EnvMap): LiveIdentity {
  if (role === 'talent_partner') {
    return {
      connection: requireEnv(
        'NEXT_PUBLIC_WINOE_AUTH0_TALENT_PARTNER_CONNECTION',
        envMap,
      ),
      email: requireEnv('QA_E2E_TALENT_PARTNER_EMAIL', envMap),
      fileName: 'talent-partner-only.json',
      mode: 'talent_partner',
      password: requireEnv('QA_E2E_TALENT_PARTNER_PASSWORD', envMap),
      returnTo: '/dashboard',
    };
  }
  return {
    connection: requireEnv(
      'NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION',
      envMap,
    ),
    email: requireEnv('QA_E2E_CANDIDATE_EMAIL', envMap),
    fileName: 'candidate-only.json',
    mode: 'candidate',
    password: requireEnv('QA_E2E_CANDIDATE_PASSWORD', envMap),
    returnTo: '/candidate/dashboard',
  };
}

function resolveLocalDevIdentity(role: LiveRole, envMap: EnvMap): LiveIdentity {
  if (role === 'talent_partner') {
    return {
      connection: 'local-dev',
      email:
        readEnv('QA_E2E_TALENT_PARTNER_EMAIL', envMap) ||
        LOCAL_DEV_ROLE_EMAILS.talent_partner,
      fileName: 'talent-partner-only.json',
      mode: 'talent_partner',
      password: 'local-dev',
      returnTo: '/dashboard',
    };
  }
  return {
    connection: 'local-dev',
    email:
      readEnv('QA_E2E_CANDIDATE_EMAIL', envMap) ||
      LOCAL_DEV_ROLE_EMAILS.candidate,
    fileName: 'candidate-only.json',
    mode: 'candidate',
    password: 'local-dev',
    returnTo: '/candidate/dashboard',
  };
}

function buildAuthStartUrl(baseURL: string, identity: LiveIdentity): string {
  const url = new URL('/auth/start', baseURL);
  url.searchParams.set('returnTo', identity.returnTo);
  url.searchParams.set('mode', identity.mode);
  url.searchParams.set('connection', identity.connection);
  return url.toString();
}

async function isVisible(
  locator: ReturnType<Page['locator']>,
): Promise<boolean> {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

async function clickPrimaryAuthButton(page: Page): Promise<void> {
  const selectors = [
    'button:visible:not([aria-hidden="true"]):has-text("Continue")',
    'button:visible:not([aria-hidden="true"]):has-text("Log in")',
    'button:visible:not([aria-hidden="true"]):has-text("Login")',
    'button:visible:not([aria-hidden="true"]):has-text("Sign in")',
    'button:visible:not([aria-hidden="true"]):has-text("Authorize")',
    'button:visible:not([aria-hidden="true"]):has-text("Accept")',
    'input[type="submit"]:visible:not([aria-hidden="true"])[value="Continue"]',
    'input[type="submit"]:visible:not([aria-hidden="true"])[value="Log in"]',
    'input[type="submit"]:visible:not([aria-hidden="true"])[value="Login"]',
    'input[type="submit"]:visible:not([aria-hidden="true"])[value="Sign in"]',
  ];
  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if (await button.count()) {
      await button.evaluate((el) => {
        (el as HTMLElement).click();
      });
      return;
    }
  }
  await page.keyboard.press('Enter');
}

async function fillAuth0Credentials(
  page: Page,
  identity: LiveIdentity,
): Promise<void> {
  const emailInput = page
    .locator('input[type="email"], input[name="email"], input[name="username"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"]')
    .first();

  if (await isVisible(emailInput)) {
    await emailInput.fill(identity.email);
  } else {
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    await emailInput.fill(identity.email);
  }

  if (!(await isVisible(passwordInput))) {
    await clickPrimaryAuthButton(page);
    await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  }

  await passwordInput.fill(identity.password);
  await clickPrimaryAuthButton(page);
}

async function maybeApproveConsent(
  page: Page,
  baseOrigin: string,
): Promise<void> {
  if (new URL(page.url()).origin === baseOrigin) return;
  const approveButton = page
    .locator(
      'button:has-text("Authorize"), button:has-text("Accept"), button:has-text("Continue")',
    )
    .first();
  if (await isVisible(approveButton)) {
    try {
      await approveButton.click({ noWaitAfter: true, force: true });
    } catch {
      if (new URL(page.url()).origin !== baseOrigin) {
        throw new Error(
          `Failed to approve Auth0 consent while on ${page.url()}.`,
        );
      }
    }
  }
}

async function createStorageState(params: {
  baseURL: string;
  identity: LiveIdentity;
  storagePath: string;
}): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: params.baseURL });
  const page = await context.newPage();
  const baseOrigin = new URL(params.baseURL).origin;

  try {
    await page.goto(buildAuthStartUrl(params.baseURL, params.identity), {
      waitUntil: 'domcontentloaded',
    });
    await fillAuth0Credentials(page, params.identity);
    await maybeApproveConsent(page, baseOrigin);
    await page.waitForURL(
      (url) =>
        url.origin === baseOrigin &&
        url.pathname.startsWith(params.identity.returnTo),
      { timeout: 120_000 },
    );
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(
      ([origin, returnTo]) =>
        window.location.origin === origin &&
        window.location.pathname.startsWith(returnTo) &&
        document.readyState === 'complete',
      [baseOrigin, params.identity.returnTo],
      { timeout: 30_000 },
    );
    await context.storageState({ path: params.storagePath });
  } finally {
    await browser.close();
  }
}

async function reuseStorageStateIfAvailable(params: {
  storagePath: string;
  sourcePath?: string | null;
}): Promise<boolean> {
  const { storagePath, sourcePath } = params;
  if (sourcePath) {
    try {
      const resolvedSource = path.resolve(sourcePath);
      const sourceExists = await fs
        .access(resolvedSource)
        .then(() => true)
        .catch(() => false);
      if (sourceExists) {
        const samePath = path.resolve(storagePath) === resolvedSource;
        if (!samePath) {
          await fs.copyFile(resolvedSource, storagePath);
        }
        return true;
      }
    } catch {
      // Fall back to interactive creation below.
    }
  }

  return await fs
    .access(storagePath)
    .then(() => true)
    .catch(() => false);
}

export default async function globalSetup(config: FullConfig) {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const envMap = await loadEnvMapFrom(resolveSupportedEnvPaths(repoRoot));
  const baseURL = resolveBaseURL(config);
  const storageDir = resolveStorageDir(repoRoot);

  await fs.mkdir(storageDir, { recursive: true });

  const useRealAuthBootstrap = hasRequiredQaAuthEnv(envMap);
  if (useRealAuthBootstrap) {
    validateRequiredQaAuthEnv(envMap);
  }

  for (const role of ['talent_partner', 'candidate'] as const) {
    const identity = useRealAuthBootstrap
      ? resolveIdentity(role, envMap)
      : resolveLocalDevIdentity(role, envMap);
    if (useRealAuthBootstrap) {
      const sourcePath =
        role === 'talent_partner'
          ? readEnv('CONTRACT_LIVE_TALENT_PARTNER_STORAGE_STATE', envMap)
          : readEnv('CONTRACT_LIVE_CANDIDATE_STORAGE_STATE', envMap);
      const reused = await reuseStorageStateIfAvailable({
        storagePath: path.join(storageDir, identity.fileName),
        sourcePath,
      });
      if (reused) {
        continue;
      }
      await createStorageState({
        baseURL,
        identity,
        storagePath: path.join(storageDir, identity.fileName),
      });
      continue;
    }
    // Local-dev auth cookies are cheap to recreate and can go stale when the
    // auth secret or generated session payload changes between runs.
    await createLocalDevStorageState({
      baseURL,
      envMap,
      identity,
      storagePath: path.join(storageDir, identity.fileName),
    });
  }
}
