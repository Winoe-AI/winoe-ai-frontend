import { isRecord } from './simUtilsApi';
import type { SimulationEvalDayKey } from './typesApi';

export type SimulationEvalEnabledByDay = Record<SimulationEvalDayKey, boolean>;

export const SIMULATION_EVAL_DAY_KEYS: readonly SimulationEvalDayKey[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

export const DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY: SimulationEvalEnabledByDay =
  {
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
  };

export function normalizeSimulationEvalEnabledByDay(
  value: unknown,
  fallback: SimulationEvalEnabledByDay = DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY,
): SimulationEvalEnabledByDay {
  const normalized: SimulationEvalEnabledByDay = { ...fallback };
  if (!isRecord(value)) return normalized;

  for (const day of SIMULATION_EVAL_DAY_KEYS) {
    if (typeof value[day] === 'boolean') {
      normalized[day] = value[day];
    }
  }

  return normalized;
}

export function extractProvidedSimulationEvalEnabledByDay(value: unknown):
  | {
      [K in SimulationEvalDayKey]?: boolean;
    }
  | null {
  if (!isRecord(value)) return null;

  const next: { [K in SimulationEvalDayKey]?: boolean } = {};
  for (const day of SIMULATION_EVAL_DAY_KEYS) {
    if (typeof value[day] === 'boolean') {
      next[day] = value[day];
    }
  }

  return Object.keys(next).length > 0 ? next : null;
}
