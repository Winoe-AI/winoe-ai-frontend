import path from 'path';
import type { PerfMode, RuntimeIds } from './types';

export const PERF_MODE: PerfMode =
  process.env.WINOE_PERF_MODE?.trim().toLowerCase() === 'live'
    ? 'live'
    : 'mock';
export const SAMPLE_COUNT = Math.max(
  1,
  Number.parseInt(process.env.WINOE_PERF_SAMPLE_COUNT?.trim() || '3', 10) || 3,
);
export const runLabel = process.env.WINOE_PERF_RUN_LABEL?.trim() || 'baseline';
export const defaultPassDate = new Date().toISOString().slice(0, 10);
export const defaultPassName =
  process.env.WINOE_PERF_PASS_NAME?.trim() || 'pass1';

export const passDir =
  process.env.WINOE_PERF_PASS_DIR?.trim() ||
  path.join(
    process.cwd(),
    'code-quality',
    'performance',
    'passes',
    defaultPassDate,
    defaultPassName,
  );
export const outputFile =
  process.env.WINOE_PERF_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', `perf-${runLabel}-${PERF_MODE}.json`);
export const interactionOutputFile =
  process.env.WINOE_PERF_INTERACTION_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', `interaction-${runLabel}-${PERF_MODE}.json`);
export const pageInventoryFile =
  process.env.WINOE_PERF_PAGE_INVENTORY_OUTPUT?.trim() ||
  path.join(passDir, 'metrics', 'page-inventory.json');
export const rawArtifactsDir =
  process.env.WINOE_PERF_RAW_ARTIFACTS_DIR?.trim() ||
  path.join(passDir, 'artifacts', `perf-raw-${runLabel}-${PERF_MODE}`);

export const BASE_URL =
  process.env.QA_E2E_BASE_URL?.trim() || 'http://127.0.0.1:3200';
export const DEFAULT_IDS: RuntimeIds = {
  trialId: process.env.WINOE_PERF_TRIAL_ID?.trim() || 'trial-123',
  createdTrialId:
    process.env.WINOE_PERF_CREATED_TRIAL_ID?.trim() || 'trial-created-456',
  candidateSessionId:
    process.env.WINOE_PERF_CANDIDATE_SESSION_ID?.trim() || '77',
  inviteToken: process.env.WINOE_PERF_INVITE_TOKEN?.trim() || 'test-token',
};
export const ALLOW_LIVE_CREATE_MUTATION =
  process.env.WINOE_PERF_LIVE_CREATE_MUTATION === '1';
