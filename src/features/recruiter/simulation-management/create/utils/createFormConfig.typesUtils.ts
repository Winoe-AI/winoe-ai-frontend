import type {
  CreateSimulationInput,
  SimulationRoleLevel,
} from '@/features/recruiter/api';

export type AiEvalDayFieldKey =
  | 'evalDay1'
  | 'evalDay2'
  | 'evalDay3'
  | 'evalDay4'
  | 'evalDay5';

export type FormFieldKey =
  | 'title'
  | 'role'
  | 'techStack'
  | 'seniority'
  | 'templateKey'
  | 'focus'
  | 'companyDomain'
  | 'companyProductArea'
  | 'noticeVersion'
  | AiEvalDayFieldKey;

export type FieldErrors = Partial<Record<FormFieldKey, string>> & {
  form?: string;
};

export type FormValues = {
  title: string;
  role: string;
  techStack: string;
  seniority: SimulationRoleLevel;
  templateKey: CreateSimulationInput['templateKey'];
  focus: string;
  companyDomain: string;
  companyProductArea: string;
  noticeVersion: string;
  evalDay1: boolean;
  evalDay2: boolean;
  evalDay3: boolean;
  evalDay4: boolean;
  evalDay5: boolean;
};
