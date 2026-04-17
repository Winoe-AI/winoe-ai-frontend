import { createEmptyPromptOverrideFormValues } from '@/features/talent-partner/ai/promptOverrideFormUtils';
import { DEFAULT_EVAL_ENABLED_BY_DAY } from './createFormConfig.constantsUtils';
import type { FormValues } from './createFormConfig.typesUtils';

export const initialValues: FormValues = {
  title: '',
  role: 'Backend Engineer',
  preferredLanguageFramework: '',
  seniority: 'mid',
  focus: '',
  companyDomain: '',
  companyProductArea: '',
  noticeVersion: 'mvp1',
  promptOverrides: createEmptyPromptOverrideFormValues(),
  evalDay1: DEFAULT_EVAL_ENABLED_BY_DAY['1'],
  evalDay2: DEFAULT_EVAL_ENABLED_BY_DAY['2'],
  evalDay3: DEFAULT_EVAL_ENABLED_BY_DAY['3'],
  evalDay4: DEFAULT_EVAL_ENABLED_BY_DAY['4'],
  evalDay5: DEFAULT_EVAL_ENABLED_BY_DAY['5'],
};
