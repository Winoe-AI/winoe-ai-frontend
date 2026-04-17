import type {
  TrialPromptOverrideField,
  TrialPromptOverrideKey,
  TrialRoleLevel,
} from '@/features/talent-partner/api';
import type { PromptOverrideFormValues } from '@/features/talent-partner/ai/promptOverrideFormUtils';

export type AiEvalDayFieldKey =
  | 'evalDay1'
  | 'evalDay2'
  | 'evalDay3'
  | 'evalDay4'
  | 'evalDay5';

export type FormFieldKey =
  | 'title'
  | 'role'
  | 'preferredLanguageFramework'
  | 'seniority'
  | 'focus'
  | 'companyDomain'
  | 'companyProductArea'
  | 'noticeVersion'
  | 'promptOverrides'
  | AiEvalDayFieldKey;

export type FieldErrors = Partial<Record<FormFieldKey, string>> & {
  form?: string;
};

export type FormValues = {
  title: string;
  role: string;
  preferredLanguageFramework: string;
  seniority: TrialRoleLevel;
  focus: string;
  companyDomain: string;
  companyProductArea: string;
  noticeVersion: string;
  promptOverrides: PromptOverrideFormValues;
  evalDay1: boolean;
  evalDay2: boolean;
  evalDay3: boolean;
  evalDay4: boolean;
  evalDay5: boolean;
};

export type PromptOverrideChange = (
  key: TrialPromptOverrideKey,
  field: TrialPromptOverrideField,
  value: string,
) => void;
