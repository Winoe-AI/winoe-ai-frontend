import { DEFAULT_TEMPLATE_KEY } from '@/lib/templateCatalog';
import { DEFAULT_EVAL_ENABLED_BY_DAY } from './createFormConfig.constants';
import type { FormValues } from './createFormConfig.types';

export const initialValues: FormValues = {
  title: '',
  role: 'Backend Engineer',
  techStack: 'Node.js + Postgres',
  seniority: 'mid',
  templateKey: DEFAULT_TEMPLATE_KEY,
  focus: '',
  companyDomain: '',
  companyProductArea: '',
  noticeVersion: 'mvp1',
  evalDay1: DEFAULT_EVAL_ENABLED_BY_DAY['1'],
  evalDay2: DEFAULT_EVAL_ENABLED_BY_DAY['2'],
  evalDay3: DEFAULT_EVAL_ENABLED_BY_DAY['3'],
  evalDay4: DEFAULT_EVAL_ENABLED_BY_DAY['4'],
  evalDay5: DEFAULT_EVAL_ENABLED_BY_DAY['5'],
};
