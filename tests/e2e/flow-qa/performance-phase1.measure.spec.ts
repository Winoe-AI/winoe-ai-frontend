import fs from 'fs/promises';
import path from 'path';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  installCandidateDay4HandoffMocks,
  installCandidateInvitesMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';

type PerfMode = 'mock' | 'live';
type StorageRole = 'none' | 'recruiter' | 'candidate' | 'authenticated';
type RouteGroup =
  | 'public'
  | 'auth'
  | 'candidateDashboard'
  | 'candidateSession'
  | 'recruiter';

type WaterfallType = 'none' | 'sequential' | 'parallel';

type ApiTimelineEntry = {
  url: string;
  startMs: number;
  endMs: number;
  durationMs: number;
};

type PageSampleMetric = {
  runLabel: string;
  mode: PerfMode;
  sample: number;
  routeId: string;
  page: string;
  route: string;
  routeTemplate: string;
  resolvedUrl: string;
  storageRole: StorageRole;
  status: 'ok' | 'failed';
  httpStatus: number | null;
  error: string | null;
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  cls: number;
  tbtMs: number;
  apiCalls: number;
  apiWaitMs: number;
  bundleKb: number;
  mountLatencyMs: number;
  jsChunkCount: number;
  assetCount: number;
  assetKb: number;
  waterfallType: WaterfallType;
  apiTimeline: ApiTimelineEntry[];
};

type InteractionSampleMetric = {
  runLabel: string;
  mode: PerfMode;
  sample: number;
  interaction: string;
  status: 'ok' | 'failed';
  latencyMs: number;
  error: string | null;
};

type RouteDefinition = {
  id: string;
  page: string;
  routeTemplate: string;
  component: string;
  group: RouteGroup;
  storageRole: StorageRole;
  userType: 'public' | 'candidate' | 'recruiter';
  interactionPattern: string;
  complexity: 'low' | 'medium' | 'high';
  resolveRoute: (ids: RuntimeIds) => string;
  ready: (page: Page, ids: RuntimeIds) => Promise<void>;
};

type RuntimeIds = {
  simulationId: string;
  createdSimulationId: string;
  candidateSessionId: string;
  inviteToken: string;
};

type RouteMetricEval = {
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  cls: number;
  tbtMs: number;
  apiCalls: number;
  apiWaitMs: number;
  bundleKb: number;
  jsChunkCount: number;
  assetCount: number;
  assetKb: number;
  waterfallType: WaterfallType;
  apiTimeline: ApiTimelineEntry[];
};

type PerfWindowState = {
  __tenonPerf?: {
    lcp?: number;
    cls?: number;
    tbtMs?: number;
  };
};

const PERF_MODE: PerfMode =
  process.env.TENON_PERF_MODE?.trim().toLowerCase() === 'live'
    ? 'live'
    : 'mock';

const SAMPLE_COUNT = Math.max(
  1,
  Number.parseInt(process.env.TENON_PERF_SAMPLE_COUNT?.trim() || '3', 10) || 3,
);

const runLabel = process.env.TENON_PERF_RUN_LABEL?.trim() || 'baseline';
const defaultPassDate = new Date().toISOString().slice(0, 10);
const defaultPassName = process.env.TENON_PERF_PASS_NAME?.trim() || 'pass1';

const passDir =
  process.env.TENON_PERF_PASS_DIR?.trim() ||
  path.join(
    process.cwd(),
    'code-quality',
    'performance',
    'passes',
    defaultPassDate,
    defaultPassName,
  );

const outputFile =
  process.env.TENON_PERF_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', `perf-${runLabel}-${PERF_MODE}.json`);

const interactionOutputFile =
  process.env.TENON_PERF_INTERACTION_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', `interaction-${runLabel}-${PERF_MODE}.json`);

const pageInventoryFile =
  process.env.TENON_PERF_PAGE_INVENTORY_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', 'page-inventory.json');

const rawArtifactsDir =
  process.env.TENON_PERF_RAW_ARTIFACTS_DIR?.trim() ||
  path.join(passDir, 'artifacts', `perf-raw-${runLabel}-${PERF_MODE}`);

const BASE_URL = process.env.QA_E2E_BASE_URL?.trim() || 'http://127.0.0.1:3200';

const DEFAULT_IDS: RuntimeIds = {
  simulationId: process.env.TENON_PERF_SIMULATION_ID?.trim() || 'sim-123',
  createdSimulationId:
    process.env.TENON_PERF_CREATED_SIMULATION_ID?.trim() || 'sim-created-456',
  candidateSessionId:
    process.env.TENON_PERF_CANDIDATE_SESSION_ID?.trim() || '77',
  inviteToken: process.env.TENON_PERF_INVITE_TOKEN?.trim() || 'test-token',
};

const ALLOW_LIVE_CREATE_MUTATION =
  process.env.TENON_PERF_LIVE_CREATE_MUTATION === '1';

function toInt(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.round(value);
}

function toFixed(value: number | null | undefined, digits: number): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function storagePath(role: StorageRole): string | undefined {
  if (role === 'recruiter') return storageStates.recruiterOnly;
  if (role === 'candidate') return storageStates.candidateOnly;
  if (role === 'authenticated') return storageStates.authenticated;
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function modeOf<T extends string>(values: T[]): T {
  if (!values.length) return 'none' as T;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let winner = values[0];
  let winnerCount = -1;
  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }
  return winner;
}

async function disableCache(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
}

async function installVitalsObserver(page: Page) {
  await page.addInitScript(() => {
    const state = {
      lcp: 0,
      cls: 0,
      tbtMs: 0,
    };

    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          state.lcp = last.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      const flushLcp = () => {
        const entries = lcpObserver.takeRecords();
        const last = entries[entries.length - 1];
        if (last) {
          state.lcp = last.startTime;
        }
      };

      addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          flushLcp();
        }
      });
      addEventListener('pagehide', flushLcp);
    } catch {
      // Ignore unsupported observer setup.
    }

    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shift = entry as LayoutShift;
          if (shift.hadRecentInput) continue;
          state.cls += shift.value;
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Ignore unsupported observer setup.
    }

    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 50) {
            state.tbtMs += entry.duration - 50;
          }
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Ignore unsupported observer setup.
    }

    (window as unknown as PerfWindowState).__tenonPerf = state;
  });
}

async function collectRouteMetrics(page: Page): Promise<RouteMetricEval> {
  return page.evaluate(() => {
    const perfWindow = window as unknown as PerfWindowState;

    const navEntry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | null;
    const fcpEntry = performance.getEntriesByName(
      'first-contentful-paint',
    )[0] as PerformanceEntry | null;

    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];

    const sizeFor = (entry: PerformanceResourceTiming) => {
      if (entry.transferSize && entry.transferSize > 0) {
        return entry.transferSize;
      }
      if (entry.encodedBodySize && entry.encodedBodySize > 0) {
        return entry.encodedBodySize;
      }
      return entry.decodedBodySize || 0;
    };

    const normalizeUrl = (rawUrl: string) => {
      try {
        const parsed = new URL(rawUrl);
        return `${parsed.pathname}${parsed.search}`;
      } catch {
        return rawUrl;
      }
    };

    const apiResources = resources.filter((entry) =>
      entry.name.includes('/api/'),
    );

    const apiTimeline = apiResources
      .map((entry) => {
        const startMs = entry.startTime;
        const durationMs = entry.duration;
        const endMs = startMs + durationMs;
        return {
          url: normalizeUrl(entry.name),
          startMs,
          endMs,
          durationMs,
        };
      })
      .sort((a, b) => a.startMs - b.startMs);

    let waterfallType: WaterfallType = 'none';
    if (apiTimeline.length > 0) {
      let hasOverlap = false;
      let latestEndMs = apiTimeline[0].endMs;
      for (let i = 1; i < apiTimeline.length; i += 1) {
        const current = apiTimeline[i];
        if (current.startMs < latestEndMs - 1) {
          hasOverlap = true;
          break;
        }
        latestEndMs = Math.max(latestEndMs, current.endMs);
      }
      waterfallType = hasOverlap ? 'parallel' : 'sequential';
    }

    const jsResources = resources.filter((entry) => {
      try {
        const parsed = new URL(entry.name);
        return /\/\_next\/static\/.*\.js(\?.*)?$/.test(parsed.pathname);
      } catch {
        return /\/\_next\/static\/.*\.js(\?.*)?$/.test(entry.name);
      }
    });

    const assetResources = resources.filter((entry) => {
      if (entry.name.startsWith('data:')) return false;
      return !entry.name.includes('/api/');
    });

    const bundleBytes = jsResources.reduce(
      (sum, entry) => sum + sizeFor(entry),
      0,
    );
    const assetBytes = assetResources.reduce(
      (sum, entry) => sum + sizeFor(entry),
      0,
    );
    const apiWaitMs = apiResources.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );

    const uniqueJsChunks = new Set(
      jsResources.map((entry) => {
        try {
          const parsed = new URL(entry.name);
          return parsed.pathname;
        } catch {
          return entry.name;
        }
      }),
    );

    return {
      fcpMs: fcpEntry?.startTime ?? 0,
      lcpMs: perfWindow.__tenonPerf?.lcp ?? 0,
      ttiMs: navEntry?.domInteractive ?? 0,
      cls: perfWindow.__tenonPerf?.cls ?? 0,
      tbtMs: perfWindow.__tenonPerf?.tbtMs ?? 0,
      apiCalls: apiResources.length,
      apiWaitMs,
      bundleKb: bundleBytes / 1024,
      jsChunkCount: uniqueJsChunks.size,
      assetCount: assetResources.length,
      assetKb: assetBytes / 1024,
      waterfallType,
      apiTimeline: apiTimeline.map((item) => ({
        url: item.url,
        startMs: item.startMs,
        endMs: item.endMs,
        durationMs: item.durationMs,
      })),
    };
  });
}

async function waitForAnyVisible(checks: Array<() => Promise<void>>) {
  const reasons: string[] = [];
  try {
    await Promise.any(
      checks.map((check) =>
        check().catch((error) => {
          reasons.push(getErrorMessage(error));
          throw error;
        }),
      ),
    );
  } catch {
    throw new Error(
      `No expected ready state became visible: ${reasons.join(' | ')}`,
    );
  }
}

async function setupMockRoutesForGroup(
  page: Page,
  group: RouteGroup,
  ids: RuntimeIds,
) {
  if (PERF_MODE !== 'mock') return;

  const candidateSessionId = Number.parseInt(ids.candidateSessionId, 10) || 77;

  if (group === 'recruiter') {
    await installRecruiterApiMocks(page, {
      simulationId: ids.simulationId,
      createSimulationId: ids.createdSimulationId,
      candidateSessionId,
      dashboardDelayMs: 550,
    });
    return;
  }

  if (group === 'candidateDashboard') {
    await installCandidateInvitesMocks(page, { delayMs: 350 });
    return;
  }

  if (group === 'candidateSession') {
    await installCandidateSessionMocks(page, {
      token: ids.inviteToken,
      candidateSessionId,
      initialTask: makeCandidateTask({
        id: 1,
        dayIndex: 1,
        type: 'design',
        title: 'Architecture brief',
        description: 'Write your architecture plan.',
      }),
      completedTaskIds: [],
    });
  }
}

function routeDefinitions(): RouteDefinition[] {
  return [
    {
      id: 'marketing-home',
      page: 'Marketing Home',
      routeTemplate: '/',
      component: 'src/app/(marketing)/page.tsx',
      group: 'public',
      storageRole: 'none',
      userType: 'public',
      interactionPattern: 'Landing read',
      complexity: 'low',
      resolveRoute: () => '/',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /welcome/i }).first(),
        ).toBeVisible();
      },
    },
    {
      id: 'auth-login',
      page: 'Auth Login',
      routeTemplate: '/auth/login',
      component: 'src/app/(auth)/auth/login/page.tsx',
      group: 'auth',
      storageRole: 'none',
      userType: 'public',
      interactionPattern: 'Auth gateway',
      complexity: 'low',
      resolveRoute: () => '/auth/login?mode=recruiter',
      ready: async (page) => {
        await waitForAnyVisible([
          () =>
            expect(
              page.getByRole('heading', {
                name: /sign in|recruiter login/i,
              }),
            ).toBeVisible({ timeout: 10_000 }),
          async () => {
            await page.waitForURL(/auth0\.com\/u\/login|\/authorize/i, {
              timeout: 10_000,
            });
          },
        ]);
      },
    },
    {
      id: 'auth-logout',
      page: 'Auth Logout',
      routeTemplate: '/auth/logout',
      component: 'src/app/(auth)/auth/logout/page.tsx',
      group: 'auth',
      storageRole: 'none',
      userType: 'public',
      interactionPattern: 'Auth confirmation',
      complexity: 'low',
      resolveRoute: () => '/auth/logout',
      ready: async (page) => {
        await waitForAnyVisible([
          () =>
            expect(page.getByRole('heading', { name: /log out/i })).toBeVisible(
              {
                timeout: 10_000,
              },
            ),
          async () => {
            await page.waitForURL(/auth0\.com\/oidc\/logout/i, {
              timeout: 10_000,
            });
          },
        ]);
      },
    },
    {
      id: 'auth-error',
      page: 'Auth Error',
      routeTemplate: '/auth/error',
      component: 'src/app/(auth)/auth/error/page.tsx',
      group: 'auth',
      storageRole: 'none',
      userType: 'public',
      interactionPattern: 'Auth failure',
      complexity: 'low',
      resolveRoute: () => '/auth/error?error=state_mismatch&mode=recruiter',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /sign-in failed/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'not-authorized',
      page: 'Not Authorized',
      routeTemplate: '/not-authorized',
      component: 'src/app/(auth)/not-authorized/page.tsx',
      group: 'auth',
      storageRole: 'none',
      userType: 'public',
      interactionPattern: 'Access denied state',
      complexity: 'low',
      resolveRoute: () => '/not-authorized?mode=recruiter',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /not authorized/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'candidate-dashboard',
      page: 'Candidate Dashboard',
      routeTemplate: '/candidate/dashboard',
      component: 'src/app/(candidate)/candidate/dashboard/page.tsx',
      group: 'candidateDashboard',
      storageRole: 'candidate',
      userType: 'candidate',
      interactionPattern: 'List + continue entry',
      complexity: 'medium',
      resolveRoute: () => '/candidate/dashboard',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /candidate dashboard/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'candidate-session',
      page: 'Candidate Session',
      routeTemplate: '/candidate/session/[token]',
      component: 'src/app/(candidate)/candidate/session/[token]/page.tsx',
      group: 'candidateSession',
      storageRole: 'candidate',
      userType: 'candidate',
      interactionPattern: 'Task workspace',
      complexity: 'high',
      resolveRoute: (ids) =>
        `/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
      ready: async (page) => {
        await waitForAnyVisible([
          () =>
            expect(
              page.getByRole('button', { name: /start simulation/i }),
            ).toBeVisible({ timeout: 15_000 }),
          () =>
            expect(
              page.getByRole('heading', { name: /day\s*\d/i }).first(),
            ).toBeVisible({
              timeout: 15_000,
            }),
          () =>
            expect(page.locator('textarea').first()).toBeVisible({
              timeout: 15_000,
            }),
        ]);
      },
    },
    {
      id: 'candidate-what-we-evaluate',
      page: 'Candidate What We Evaluate',
      routeTemplate: '/candidate/what-we-evaluate',
      component: 'src/app/(candidate)/candidate/what-we-evaluate/page.tsx',
      group: 'candidateDashboard',
      storageRole: 'candidate',
      userType: 'candidate',
      interactionPattern: 'Static guidance read',
      complexity: 'low',
      resolveRoute: () => '/candidate/what-we-evaluate',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /what we evaluate/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'recruiter-dashboard',
      page: 'Recruiter Dashboard',
      routeTemplate: '/dashboard',
      component: 'src/app/(recruiter)/dashboard/page.tsx',
      group: 'recruiter',
      storageRole: 'recruiter',
      userType: 'recruiter',
      interactionPattern: 'Overview + list',
      complexity: 'medium',
      resolveRoute: () => '/dashboard',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /^dashboard$/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'recruiter-create',
      page: 'Recruiter Create Simulation',
      routeTemplate: '/dashboard/simulations/new',
      component: 'src/app/(recruiter)/dashboard/simulations/new/page.tsx',
      group: 'recruiter',
      storageRole: 'recruiter',
      userType: 'recruiter',
      interactionPattern: 'Form entry + submit',
      complexity: 'medium',
      resolveRoute: () => '/dashboard/simulations/new',
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /new simulation/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'recruiter-simulation-detail',
      page: 'Recruiter Simulation Detail',
      routeTemplate: '/dashboard/simulations/[id]',
      component: 'src/app/(recruiter)/dashboard/simulations/[id]/page.tsx',
      group: 'recruiter',
      storageRole: 'recruiter',
      userType: 'recruiter',
      interactionPattern: 'Plan + candidates',
      complexity: 'high',
      resolveRoute: (ids) =>
        `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}`,
      ready: async (page) => {
        await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();
      },
    },
    {
      id: 'recruiter-candidate-submissions',
      page: 'Recruiter Candidate Submissions',
      routeTemplate:
        '/dashboard/simulations/[id]/candidates/[candidateSessionId]',
      component:
        'src/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/page.tsx',
      group: 'recruiter',
      storageRole: 'recruiter',
      userType: 'recruiter',
      interactionPattern: 'Artifacts review',
      complexity: 'high',
      resolveRoute: (ids) =>
        `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}`,
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /submissions/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'recruiter-fit-profile',
      page: 'Recruiter Candidate Fit Profile',
      routeTemplate:
        '/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile',
      component:
        'src/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile/page.tsx',
      group: 'recruiter',
      storageRole: 'recruiter',
      userType: 'recruiter',
      interactionPattern: 'Fit profile report',
      complexity: 'high',
      resolveRoute: (ids) =>
        `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}/fit-profile`,
      ready: async (page) => {
        await expect(
          page.getByRole('heading', { name: /fit profile/i }),
        ).toBeVisible();
      },
    },
    {
      id: 'candidate-legacy-redirect',
      page: 'Candidate Legacy Redirect',
      routeTemplate: '/candidate-sessions/[token]',
      component:
        'src/app/(candidate)/(legacy)/candidate-sessions/[token]/page.tsx',
      group: 'candidateSession',
      storageRole: 'candidate',
      userType: 'candidate',
      interactionPattern: 'Legacy redirect + bootstrap',
      complexity: 'medium',
      resolveRoute: (ids) =>
        `/candidate-sessions/${encodeURIComponent(ids.inviteToken)}`,
      ready: async (page, ids) => {
        await page.waitForURL(
          `**/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
        );
        await waitForAnyVisible([
          () =>
            expect(
              page.getByRole('button', { name: /start simulation/i }),
            ).toBeVisible({ timeout: 15_000 }),
          () =>
            expect(page.locator('textarea').first()).toBeVisible({
              timeout: 15_000,
            }),
        ]);
      },
    },
  ];
}

function buildPageInventory(routes: RouteDefinition[]) {
  return {
    generatedAt: new Date().toISOString(),
    routes: routes.map((route) => ({
      routeId: route.id,
      page: route.page,
      routeTemplate: route.routeTemplate,
      component: route.component,
      group: route.group,
      storageRole: route.storageRole,
      userType: route.userType,
      interactionPattern: route.interactionPattern,
      complexity: route.complexity,
    })),
  };
}

async function discoverLiveIds(browser: Browser): Promise<RuntimeIds> {
  const next: RuntimeIds = { ...DEFAULT_IDS };

  const envSimulationId = process.env.TENON_PERF_SIMULATION_ID?.trim();
  const envCandidateSessionId =
    process.env.TENON_PERF_CANDIDATE_SESSION_ID?.trim();
  const envInviteToken = process.env.TENON_PERF_INVITE_TOKEN?.trim();

  if (envSimulationId) next.simulationId = envSimulationId;
  if (envCandidateSessionId) next.candidateSessionId = envCandidateSessionId;
  if (envInviteToken) next.inviteToken = envInviteToken;

  if (!envSimulationId || !envCandidateSessionId) {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: storagePath('recruiter'),
    });
    const page = await context.newPage();
    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: /^dashboard$/i }),
      ).toBeVisible({
        timeout: 12_000,
      });

      const discoveredSimulationId = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        for (const anchor of anchors) {
          const href = anchor.getAttribute('href');
          if (!href) continue;
          const match = href.match(/^\/dashboard\/simulations\/([^/]+)$/);
          if (!match) continue;
          if (match[1] === 'new') continue;
          return decodeURIComponent(match[1]);
        }
        return null;
      });

      if (discoveredSimulationId && !envSimulationId) {
        next.simulationId = discoveredSimulationId;
      }

      if (next.simulationId) {
        await page.goto(
          `/dashboard/simulations/${encodeURIComponent(next.simulationId)}`,
          { waitUntil: 'domcontentloaded' },
        );
        await expect(page.getByText(/5-day simulation plan/i)).toBeVisible({
          timeout: 12_000,
        });

        const discoveredCandidateSessionId = await page.evaluate(() => {
          const row = document.querySelector(
            '[data-testid^="candidate-row-"]',
          ) as HTMLElement | null;
          if (!row) return null;
          const testId = row.getAttribute('data-testid') || '';
          const match = testId.match(/^candidate-row-(.+)$/);
          return match?.[1] ?? null;
        });

        if (discoveredCandidateSessionId && !envCandidateSessionId) {
          next.candidateSessionId = discoveredCandidateSessionId;
        }
      }
    } catch {
      // Keep defaults if discovery fails.
    } finally {
      await context.close();
    }
  }

  if (!envInviteToken) {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: storagePath('candidate'),
    });
    const page = await context.newPage();

    try {
      await page.goto('/candidate/dashboard', {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page.getByRole('heading', { name: /candidate dashboard/i }),
      ).toBeVisible({ timeout: 12_000 });

      const continueButton = page
        .getByRole('button', { name: /start simulation|continue/i })
        .first();

      if ((await continueButton.count()) > 0) {
        await Promise.all([
          page.waitForURL(/\/candidate\/session\/[^/?#]+/, {
            timeout: 12_000,
          }),
          continueButton.click(),
        ]);

        const url = new URL(page.url());
        const match = url.pathname.match(/\/candidate\/session\/([^/]+)$/);
        if (match?.[1]) {
          next.inviteToken = decodeURIComponent(match[1]);
        }
      }
    } catch {
      // Keep default token if discovery fails.
    } finally {
      await context.close();
    }
  }

  return next;
}

async function measureRouteSample(params: {
  browser: Browser;
  route: RouteDefinition;
  ids: RuntimeIds;
  sample: number;
}): Promise<PageSampleMetric> {
  const { browser, route, ids, sample } = params;
  const resolvedRoute = route.resolveRoute(ids);
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: storagePath(route.storageRole),
  });
  const page = await context.newPage();

  const result: PageSampleMetric = {
    runLabel,
    mode: PERF_MODE,
    sample,
    routeId: route.id,
    page: route.page,
    route: resolvedRoute,
    routeTemplate: route.routeTemplate,
    resolvedUrl: '',
    storageRole: route.storageRole,
    status: 'failed',
    httpStatus: null,
    error: null,
    fcpMs: 0,
    lcpMs: 0,
    ttiMs: 0,
    cls: 0,
    tbtMs: 0,
    apiCalls: 0,
    apiWaitMs: 0,
    bundleKb: 0,
    mountLatencyMs: 0,
    jsChunkCount: 0,
    assetCount: 0,
    assetKb: 0,
    waterfallType: 'none',
    apiTimeline: [],
  };

  try {
    await setupMockRoutesForGroup(page, route.group, ids);
    await installVitalsObserver(page);
    await disableCache(page);

    const startMs = Date.now();
    const response = await page.goto(resolvedRoute, {
      waitUntil: 'domcontentloaded',
    });

    result.httpStatus = response?.status() ?? null;

    await route.ready(page, ids);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(250);

    result.mountLatencyMs = Date.now() - startMs;

    const metrics = await collectRouteMetrics(page);

    result.fcpMs = toInt(metrics.fcpMs);
    result.lcpMs = toInt(metrics.lcpMs);
    result.ttiMs = toInt(metrics.ttiMs);
    result.cls = toFixed(metrics.cls, 4);
    result.tbtMs = toInt(metrics.tbtMs);
    result.apiCalls = metrics.apiCalls;
    result.apiWaitMs = toInt(metrics.apiWaitMs);
    result.bundleKb = toFixed(metrics.bundleKb, 1);
    result.jsChunkCount = metrics.jsChunkCount;
    result.assetCount = metrics.assetCount;
    result.assetKb = toFixed(metrics.assetKb, 1);
    result.waterfallType = metrics.waterfallType;
    result.apiTimeline = metrics.apiTimeline.map((item) => ({
      url: item.url,
      startMs: toFixed(item.startMs, 1),
      endMs: toFixed(item.endMs, 1),
      durationMs: toFixed(item.durationMs, 1),
    }));

    result.resolvedUrl = page.url();
    result.status = 'ok';
  } catch (error) {
    result.error = getErrorMessage(error);
    result.resolvedUrl = page.url();
  } finally {
    await context.close();
  }

  return result;
}

async function runInteractionSample(params: {
  browser: Browser;
  ids: RuntimeIds;
  sample: number;
}): Promise<InteractionSampleMetric[]> {
  const { browser, ids, sample } = params;
  const results: InteractionSampleMetric[] = [];

  const pushSuccess = (interaction: string, latencyMs: number) => {
    results.push({
      runLabel,
      mode: PERF_MODE,
      sample,
      interaction,
      status: 'ok',
      latencyMs: toInt(latencyMs),
      error: null,
    });
  };

  const pushFailure = (interaction: string, error: unknown) => {
    results.push({
      runLabel,
      mode: PERF_MODE,
      sample,
      interaction,
      status: 'failed',
      latencyMs: 0,
      error: getErrorMessage(error),
    });
  };

  const runWithContext = async (
    role: StorageRole,
    fn: (page: Page) => Promise<void>,
  ) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: storagePath(role),
    });
    const page = await context.newPage();
    try {
      await fn(page);
    } finally {
      await context.close();
    }
  };

  try {
    await runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: ids.simulationId,
          createSimulationId: ids.createdSimulationId,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
          dashboardDelayMs: 550,
        });
      }

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const simulationLink = page
        .locator(`a[href="/dashboard/simulations/${ids.simulationId}"]`)
        .first();

      await waitForAnyVisible([
        () => expect(simulationLink).toBeVisible({ timeout: 12_000 }),
        () =>
          expect(
            page.locator('a[href^="/dashboard/simulations/"]').first(),
          ).toBeVisible({
            timeout: 12_000,
          }),
      ]);

      const navStart = Date.now();
      await Promise.all([
        page.waitForURL(/\/dashboard\/simulations\/[^/]+$/),
        (await simulationLink.isVisible())
          ? simulationLink.click()
          : page.locator('a[href^="/dashboard/simulations/"]').first().click(),
      ]);
      await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();
      pushSuccess(
        'Recruiter navigation latency (dashboard -> simulation detail)',
        Date.now() - navStart,
      );
    });
  } catch (error) {
    pushFailure(
      'Recruiter navigation latency (dashboard -> simulation detail)',
      error,
    );
  }

  try {
    await runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: ids.simulationId,
          createSimulationId: ids.createdSimulationId,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
        });
      }

      await page.goto('/dashboard/simulations/new', {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page.getByRole('heading', { name: /new simulation/i }),
      ).toBeVisible();

      const titleField = page.getByLabel(/title/i);
      await titleField.fill('');

      const submitStart = Date.now();

      if (PERF_MODE === 'live' && !ALLOW_LIVE_CREATE_MUTATION) {
        await page.getByRole('button', { name: /create simulation/i }).click();
        await expect(page.getByText(/title is required/i)).toBeVisible();
      } else {
        await titleField.fill(`Perf Sample ${sample}-${Date.now()}`);

        await Promise.race([
          Promise.all([
            page.waitForURL(/\/dashboard\/simulations\/[^/]+$/),
            page.getByRole('button', { name: /create simulation/i }).click(),
          ]),
          Promise.all([
            page.getByRole('button', { name: /create simulation/i }).click(),
            page
              .getByRole('alert')
              .first()
              .waitFor({ state: 'visible', timeout: 12_000 }),
          ]),
        ]);
      }

      pushSuccess(
        'Simulation create submit-feedback latency',
        Date.now() - submitStart,
      );
    });
  } catch (error) {
    pushFailure('Simulation create submit-feedback latency', error);
  }

  try {
    await runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateSessionMocks(page, {
          token: ids.inviteToken,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
          initialTask: makeCandidateTask({
            id: 1,
            dayIndex: 1,
            type: 'design',
            title: 'Architecture brief',
            description: 'Write your architecture plan.',
          }),
          completedTaskIds: [],
        });
      }

      await page.goto(
        `/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
        {
          waitUntil: 'domcontentloaded',
        },
      );
      await page
        .getByRole('button', { name: /start simulation/i })
        .click({ timeout: 5_000 })
        .catch(() => {});

      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 12_000 });

      const start = Date.now();
      await textarea.type('Performance keystroke sample for Day 1.', {
        delay: 0,
      });
      pushSuccess('Day 1 keystroke latency', Date.now() - start);
    });
  } catch (error) {
    pushFailure('Day 1 keystroke latency', error);
  }

  try {
    await runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateSessionMocks(page, {
          token: ids.inviteToken,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
          initialTask: makeCandidateTask({
            id: 5,
            dayIndex: 5,
            type: 'documentation',
            title: 'Final reflection',
            description: 'Capture your day-by-day reflection.',
          }),
          completedTaskIds: [1, 2, 3, 4],
        });
      }

      await page.goto(
        `/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
        {
          waitUntil: 'domcontentloaded',
        },
      );

      await page
        .getByRole('button', { name: /start simulation/i })
        .click({ timeout: 5_000 })
        .catch(() => {});

      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 12_000 });
      const start = Date.now();
      await textarea.type('Day 5 reflection keystroke sample.', { delay: 0 });
      pushSuccess('Day 5 keystroke latency', Date.now() - start);
    });
  } catch (error) {
    pushFailure('Day 5 keystroke latency', error);
  }

  try {
    await runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateDay4HandoffMocks(page, {
          token: ids.inviteToken,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
          taskId: 4,
        });
      }

      await page.goto(
        `/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
        {
          waitUntil: 'domcontentloaded',
        },
      );

      await page
        .getByRole('button', { name: /start simulation/i })
        .click({ timeout: 5_000 })
        .catch(() => {});

      await expect(
        page.getByRole('button', { name: /upload video/i }),
      ).toBeVisible({
        timeout: 12_000,
      });

      const progressStart = Date.now();
      await page.locator('input[type="file"]').setInputFiles({
        name: 'qa-sample.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('tenon-qa-video-content'),
      });
      await expect(page.getByText(/complete upload/i).first()).toBeVisible({
        timeout: 12_000,
      });
      pushSuccess('Day 4 upload progress latency', Date.now() - progressStart);

      const finalizeStart = Date.now();
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /^complete upload$/i }).click();
      await expect(page.getByText(/transcript ready/i)).toBeVisible({
        timeout: 15_000,
      });
      pushSuccess(
        'Day 4 upload finalization latency',
        Date.now() - finalizeStart,
      );
    });
  } catch (error) {
    pushFailure('Day 4 upload progress latency', error);
    pushFailure('Day 4 upload finalization latency', error);
  }

  try {
    await runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: ids.simulationId,
          createSimulationId: ids.createdSimulationId,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
        });
      }

      await page.goto(
        `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(
        page.getByRole('heading', { name: /submissions/i }),
      ).toBeVisible({
        timeout: 12_000,
      });

      const showAll = page.getByRole('button', { name: /show all/i });
      await expect(showAll).toBeVisible({ timeout: 12_000 });

      const expandListStart = Date.now();
      await showAll.click();
      await expect(
        page.getByRole('button', { name: /hide list/i }),
      ).toBeVisible();
      pushSuccess(
        'Submissions list expand latency',
        Date.now() - expandListStart,
      );

      const expandButton = page
        .getByRole('button', { name: /^expand$/i })
        .first();
      await expect(expandButton).toBeVisible({ timeout: 12_000 });

      const expandStart = Date.now();
      await expandButton.click();
      await expect(
        page.getByRole('button', { name: /^collapse$/i }).first(),
      ).toBeVisible();
      pushSuccess('Submissions expand latency', Date.now() - expandStart);

      const collapseButton = page
        .getByRole('button', { name: /^collapse$/i })
        .first();
      const collapseStart = Date.now();
      await collapseButton.click();
      await expect(
        page.getByRole('button', { name: /^expand$/i }).first(),
      ).toBeVisible();
      pushSuccess('Submissions collapse latency', Date.now() - collapseStart);
    });
  } catch (error) {
    pushFailure('Submissions list expand latency', error);
    pushFailure('Submissions expand latency', error);
    pushFailure('Submissions collapse latency', error);
  }

  try {
    await runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: ids.simulationId,
          createSimulationId: ids.createdSimulationId,
          candidateSessionId: Number.parseInt(ids.candidateSessionId, 10) || 77,
          fitProfilePayload: { status: 'not_started' },
        });
      }

      await page.goto(
        `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}/fit-profile`,
        { waitUntil: 'domcontentloaded' },
      );

      await expect(
        page.getByRole('heading', { name: /fit profile/i }),
      ).toBeVisible({
        timeout: 12_000,
      });

      const generate = page.getByRole('button', {
        name: /generate fit profile/i,
      });
      const reload = page
        .getByRole('button', { name: /reload|refresh/i })
        .first();

      if (
        (await generate.count()) > 0 &&
        (await generate.isVisible().catch(() => false))
      ) {
        const start = Date.now();
        await generate.click();
        await waitForAnyVisible([
          () =>
            expect(page.getByText(/generating fit profile/i)).toBeVisible({
              timeout: 12_000,
            }),
          () => expect(reload).toBeVisible({ timeout: 12_000 }),
        ]);
        pushSuccess(
          'Fit-profile interactive controls latency',
          Date.now() - start,
        );
      } else {
        await expect(reload).toBeVisible({ timeout: 12_000 });
        const start = Date.now();
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('/api/candidate_sessions/') &&
              response.url().includes('/fit_profile') &&
              response.request().method() === 'GET',
            { timeout: 12_000 },
          ),
          reload.click(),
        ]).catch(async () => {
          await page.waitForTimeout(400);
        });
        pushSuccess(
          'Fit-profile interactive controls latency',
          Date.now() - start,
        );
      }
    });
  } catch (error) {
    pushFailure('Fit-profile interactive controls latency', error);
  }

  return results;
}

function aggregateRouteMetrics(
  raw: PageSampleMetric[],
  routes: RouteDefinition[],
) {
  return routes.map((route) => {
    const samples = raw.filter((entry) => entry.routeId === route.id);
    const successful = samples.filter((entry) => entry.status === 'ok');

    if (!successful.length) {
      return {
        routeId: route.id,
        page: route.page,
        routeTemplate: route.routeTemplate,
        successfulSamples: 0,
        sampleCount: samples.length,
        status: 'failed',
        error:
          samples
            .map((entry) => entry.error)
            .filter(Boolean)
            .join(' | ') || null,
      };
    }

    const representative = successful
      .slice()
      .sort((a, b) => a.mountLatencyMs - b.mountLatencyMs)[
      Math.floor(successful.length / 2)
    ];

    return {
      routeId: route.id,
      page: route.page,
      routeTemplate: route.routeTemplate,
      route: representative.route,
      resolvedUrl: representative.resolvedUrl,
      successfulSamples: successful.length,
      sampleCount: samples.length,
      status: successful.length === samples.length ? 'ok' : 'partial',
      fcpMs: toInt(median(successful.map((entry) => entry.fcpMs))),
      lcpMs: toInt(median(successful.map((entry) => entry.lcpMs))),
      ttiMs: toInt(median(successful.map((entry) => entry.ttiMs))),
      cls: toFixed(median(successful.map((entry) => entry.cls)), 4),
      tbtMs: toInt(median(successful.map((entry) => entry.tbtMs))),
      apiCalls: toInt(median(successful.map((entry) => entry.apiCalls))),
      apiWaitMs: toInt(median(successful.map((entry) => entry.apiWaitMs))),
      bundleKb: toFixed(median(successful.map((entry) => entry.bundleKb)), 1),
      mountLatencyMs: toInt(
        median(successful.map((entry) => entry.mountLatencyMs)),
      ),
      jsChunkCount: toInt(
        median(successful.map((entry) => entry.jsChunkCount)),
      ),
      assetCount: toInt(median(successful.map((entry) => entry.assetCount))),
      assetKb: toFixed(median(successful.map((entry) => entry.assetKb)), 1),
      waterfallType: modeOf(successful.map((entry) => entry.waterfallType)),
      apiTimeline: representative.apiTimeline,
    };
  });
}

function aggregateInteractionMetrics(raw: InteractionSampleMetric[]) {
  const grouped = new Map<string, InteractionSampleMetric[]>();

  for (const entry of raw) {
    const existing = grouped.get(entry.interaction) ?? [];
    existing.push(entry);
    grouped.set(entry.interaction, existing);
  }

  return [...grouped.entries()].map(([interaction, samples]) => {
    const successful = samples.filter((entry) => entry.status === 'ok');
    if (!successful.length) {
      return {
        interaction,
        successfulSamples: 0,
        sampleCount: samples.length,
        status: 'failed',
        latencyMs: 0,
        error:
          samples
            .map((entry) => entry.error)
            .filter(Boolean)
            .join(' | ') || null,
      };
    }

    return {
      interaction,
      successfulSamples: successful.length,
      sampleCount: samples.length,
      status: successful.length === samples.length ? 'ok' : 'partial',
      latencyMs: toInt(median(successful.map((entry) => entry.latencyMs))),
      error:
        successful.length === samples.length
          ? null
          : samples
              .map((entry) => entry.error)
              .filter(Boolean)
              .join(' | ') || null,
    };
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('@perf Performance Pass 2 Baseline', () => {
  test('captures full-route and interaction medians with raw samples', async ({
    browser,
  }) => {
    test.setTimeout(3_600_000);

    const routes = routeDefinitions();
    const ids =
      PERF_MODE === 'live'
        ? await discoverLiveIds(browser)
        : { ...DEFAULT_IDS };

    const allPageSamples: PageSampleMetric[] = [];
    const allInteractionSamples: InteractionSampleMetric[] = [];

    for (let sample = 1; sample <= SAMPLE_COUNT; sample += 1) {
      const samplePages: PageSampleMetric[] = [];
      for (const route of routes) {
        const pageSample = await measureRouteSample({
          browser,
          route,
          ids,
          sample,
        });
        samplePages.push(pageSample);
        allPageSamples.push(pageSample);
      }

      const sampleInteractions = await runInteractionSample({
        browser,
        ids,
        sample,
      });

      allInteractionSamples.push(...sampleInteractions);

      await fs.mkdir(rawArtifactsDir, { recursive: true });
      await fs.writeFile(
        path.join(rawArtifactsDir, `sample-${sample}.json`),
        `${JSON.stringify(
          {
            runLabel,
            mode: PERF_MODE,
            sample,
            measuredAt: new Date().toISOString(),
            ids,
            pages: samplePages,
            interactions: sampleInteractions,
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
    }

    const pageMedian = aggregateRouteMetrics(allPageSamples, routes);
    const interactionMedian = aggregateInteractionMetrics(
      allInteractionSamples,
    );

    const payload = {
      runLabel,
      mode: PERF_MODE,
      sampleCount: SAMPLE_COUNT,
      measuredAt: new Date().toISOString(),
      ids,
      pages: {
        median: pageMedian,
        raw: allPageSamples,
      },
      interactions: {
        median: interactionMedian,
        raw: allInteractionSamples,
      },
    };

    const interactionPayload = {
      runLabel,
      mode: PERF_MODE,
      sampleCount: SAMPLE_COUNT,
      measuredAt: payload.measuredAt,
      median: interactionMedian,
      raw: allInteractionSamples,
    };

    const inventoryPayload = buildPageInventory(routes);

    await Promise.all([
      fs.mkdir(path.dirname(outputFile), { recursive: true }),
      fs.mkdir(path.dirname(interactionOutputFile), { recursive: true }),
      fs.mkdir(path.dirname(pageInventoryFile), { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'),
      fs.writeFile(
        interactionOutputFile,
        `${JSON.stringify(interactionPayload, null, 2)}\n`,
        'utf8',
      ),
      fs.writeFile(
        pageInventoryFile,
        `${JSON.stringify(inventoryPayload, null, 2)}\n`,
        'utf8',
      ),
    ]);

    const successfulRouteCount = pageMedian.filter(
      (entry) => entry.status === 'ok' || entry.status === 'partial',
    ).length;

    if (PERF_MODE === 'mock') {
      expect(successfulRouteCount).toBe(routes.length);
    } else {
      expect(successfulRouteCount).toBeGreaterThan(0);
    }
  });
});
