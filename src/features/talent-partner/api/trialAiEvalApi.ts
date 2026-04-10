import { isRecord } from './trialUtilsApi';
import type { TrialEvalDayKey } from './typesApi';

export type TrialEvalEnabledByDay = Record<TrialEvalDayKey, boolean>;

export const TRIAL_EVAL_DAY_KEYS: readonly TrialEvalDayKey[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

export const DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY: TrialEvalEnabledByDay = {
  '1': true,
  '2': true,
  '3': true,
  '4': true,
  '5': true,
};

export function normalizeTrialEvalEnabledByDay(
  value: unknown,
  fallback: TrialEvalEnabledByDay = DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY,
): TrialEvalEnabledByDay {
  const normalized: TrialEvalEnabledByDay = { ...fallback };
  if (!isRecord(value)) return normalized;

  for (const day of TRIAL_EVAL_DAY_KEYS) {
    if (typeof value[day] === 'boolean') {
      normalized[day] = value[day];
    }
  }

  return normalized;
}

export function extractProvidedTrialEvalEnabledByDay(value: unknown):
  | {
      [K in TrialEvalDayKey]?: boolean;
    }
  | null {
  if (!isRecord(value)) return null;

  const next: { [K in TrialEvalDayKey]?: boolean } = {};
  for (const day of TRIAL_EVAL_DAY_KEYS) {
    if (typeof value[day] === 'boolean') {
      next[day] = value[day];
    }
  }

  return Object.keys(next).length > 0 ? next : null;
}
