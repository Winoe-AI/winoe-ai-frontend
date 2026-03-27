import type { Browser, Page } from '@playwright/test';
import { BASE_URL, PERF_MODE, runLabel } from '../config';
import { getErrorMessage, storagePath, toInt } from '../helpers';
import type {
  InteractionSampleMetric,
  RuntimeIds,
  StorageRole,
} from '../types';

type RunnerFn = (page: Page) => Promise<void>;
export type InteractionContext = {
  browser: Browser;
  ids: RuntimeIds;
  sample: number;
  pushSuccess: (interaction: string, latencyMs: number) => void;
  pushFailure: (interaction: string, error: unknown) => void;
  runWithContext: (role: StorageRole, fn: RunnerFn) => Promise<void>;
  results: InteractionSampleMetric[];
};

export function createInteractionContext(
  browser: Browser,
  ids: RuntimeIds,
  sample: number,
): InteractionContext {
  const results: InteractionSampleMetric[] = [];
  const pushSuccess = (interaction: string, latencyMs: number) =>
    results.push({
      runLabel,
      mode: PERF_MODE,
      sample,
      interaction,
      status: 'ok',
      latencyMs: toInt(latencyMs),
      error: null,
    });
  const pushFailure = (interaction: string, error: unknown) =>
    results.push({
      runLabel,
      mode: PERF_MODE,
      sample,
      interaction,
      status: 'failed',
      latencyMs: 0,
      error: getErrorMessage(error),
    });
  const runWithContext = async (role: StorageRole, fn: RunnerFn) => {
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
  return {
    browser,
    ids,
    sample,
    pushSuccess,
    pushFailure,
    runWithContext,
    results,
  };
}
