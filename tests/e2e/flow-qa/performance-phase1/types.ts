import type { Page } from '@playwright/test';

export type PerfMode = 'mock' | 'live';
export type StorageRole = 'none' | 'recruiter' | 'candidate' | 'authenticated';
export type RouteGroup =
  | 'public'
  | 'auth'
  | 'candidateDashboard'
  | 'candidateSession'
  | 'recruiter';
export type WaterfallType = 'none' | 'sequential' | 'parallel';

export type ApiTimelineEntry = {
  url: string;
  startMs: number;
  endMs: number;
  durationMs: number;
};
export type RuntimeIds = {
  simulationId: string;
  createdSimulationId: string;
  candidateSessionId: string;
  inviteToken: string;
};
export type RouteDefinition = {
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

export type RouteMetricEval = {
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

export type PageSampleMetric = {
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

export type InteractionSampleMetric = {
  runLabel: string;
  mode: PerfMode;
  sample: number;
  interaction: string;
  status: 'ok' | 'failed';
  latencyMs: number;
  error: string | null;
};

export type PerfWindowState = {
  __tenonPerf?: { lcp?: number; cls?: number; tbtMs?: number };
};
