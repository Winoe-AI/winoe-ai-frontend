import type {
  TrialEvalDayKey,
  TrialRoleLevel,
} from '@/features/talent-partner/api';
import {
  DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY,
  TRIAL_EVAL_DAY_KEYS,
} from '@/features/talent-partner/api/trialAiEvalApi';
import type { AiEvalDayFieldKey } from './createFormConfig.typesUtils';

export const MAX_FOCUS_NOTES_CHARS = 1000;
export const MAX_COMPANY_CONTEXT_VALUE_CHARS = 120;
export const MAX_AI_NOTICE_VERSION_CHARS = 100;

export const AI_DAY_KEYS: readonly TrialEvalDayKey[] = TRIAL_EVAL_DAY_KEYS;

export const AI_DAY_FIELD_MAP: Record<TrialEvalDayKey, AiEvalDayFieldKey> = {
  '1': 'evalDay1',
  '2': 'evalDay2',
  '3': 'evalDay3',
  '4': 'evalDay4',
  '5': 'evalDay5',
};

export const SENIORITY_OPTIONS: TrialRoleLevel[] = [
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
];

export const DEFAULT_EVAL_ENABLED_BY_DAY = DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY;
