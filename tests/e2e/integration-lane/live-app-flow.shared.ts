import { test } from '@playwright/test';

export const DASHBOARD_BUDGET_MS = 10_000;
export const CREATE_FLOW_BUDGET_MS = 20_000;
export const CANDIDATE_DASHBOARD_BUDGET_MS = 10_000;

export function annotatePerf(type: string, valueMs: number) {
  test.info().annotations.push({
    type,
    description: String(valueMs),
  });
}
