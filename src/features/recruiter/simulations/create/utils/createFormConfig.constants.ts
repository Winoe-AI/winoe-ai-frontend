import type { SimulationEvalDayKey, SimulationRoleLevel } from '@/features/recruiter/api';
import {
  DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY,
  SIMULATION_EVAL_DAY_KEYS,
} from '@/features/recruiter/api/simulationAiEval';
import type { AiEvalDayFieldKey } from './createFormConfig.types';

export const MAX_FOCUS_NOTES_CHARS = 1000;
export const MAX_COMPANY_CONTEXT_VALUE_CHARS = 120;
export const MAX_AI_NOTICE_VERSION_CHARS = 100;

export const AI_DAY_KEYS: readonly SimulationEvalDayKey[] =
  SIMULATION_EVAL_DAY_KEYS;

export const AI_DAY_FIELD_MAP: Record<SimulationEvalDayKey, AiEvalDayFieldKey> =
  {
    '1': 'evalDay1',
    '2': 'evalDay2',
    '3': 'evalDay3',
    '4': 'evalDay4',
    '5': 'evalDay5',
  };

export const SENIORITY_OPTIONS: SimulationRoleLevel[] = [
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
];

export const DEFAULT_EVAL_ENABLED_BY_DAY = DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY;
